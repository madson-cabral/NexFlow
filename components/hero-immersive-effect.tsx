"use client";

import {useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent} from "react";
import {AppWindow, ArrowLeft, ArrowRight, Check, ClipboardCheck, Database, Expand, Layers3, Minus, Pause, Play, Plus, RotateCcw, Smartphone, Workflow, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Progress} from "@/components/ui/progress";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {heroCoreSvg} from "@/lib/hero-core-svg";
import {clampHero, heroCameraFor, heroFlowLogs, heroFlowSteps, heroNodes, heroStations, heroSceneFrame, type HeroCamera} from "@/lib/hero-immersive";

type Particle = {x: number; y: number; z: number; size: number; color: string};
type Engine = {width: number; height: number; camera: HeroCamera; target: HeroCamera; orbit: {rx: number; ry: number}; warp: number};
const positionNode = (id: number): CSSProperties => {const node = heroNodes.find(item => item.id === id)!; return {width: node.width, height: node.height, marginLeft: -node.width / 2, marginTop: -node.height / 2, transform: `translate3d(${node.x}px,${node.y}px,${node.z}px) rotateY(${node.ry}deg) rotateX(${node.rx}deg)`}};
const cameraTransform = (camera: HeroCamera) => `translate3d(${camera.x.toFixed(2)}px,${camera.y.toFixed(2)}px,${camera.z.toFixed(2)}px) rotateX(${camera.rx.toFixed(2)}deg) rotateY(${camera.ry.toFixed(2)}deg) scale3d(${camera.scale.toFixed(4)},${camera.scale.toFixed(4)},${camera.scale.toFixed(4)})`;

export function HeroImmersiveEffect({onSelectSolution}: {onSelectSolution: (solution: string) => void}) {
  const [station, setStation] = useState(0), [tour, setTour] = useState(true), [paused, setPaused] = useState(false), [expanded, setExpanded] = useState(false), [zoom, setZoom] = useState(0);
  const [step, setStep] = useState(0), [running, setRunning] = useState(false), [inView, setInView] = useState(false), [documentVisible, setDocumentVisible] = useState(true), [reduced, setReduced] = useState(false), [ready, setReady] = useState(false);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null), [dragging, setDragging] = useState(false);
  const root = useRef<HTMLDivElement>(null), world = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), opener = useRef<HTMLButtonElement | null>(null), timers = useRef<number[]>([]);
  const selected = useRef(station), magnification = useRef(zoom), paint = useRef<() => void>(() => {}), drag = useRef<{id: number; x: number; y: number} | null>(null);
  const engine = useRef<Engine>({width: 620, height: 340, camera: heroCameraFor(0, 620, 340), target: heroCameraFor(0, 620, 340), orbit: {rx: 0, ry: 0}, warp: 0});
  const id = `hero-3d-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const motion = ready && !paused && !reduced && documentVisible && (inView || expanded);
  selected.current = station; magnification.current = zoom;
  const coreSvg = heroCoreSvg.replaceAll("coreTop3D", `${id}-core-top`);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {setReduced(preference.matches); setReady(true); if (preference.matches) setTour(false)};
    const visibility = () => setDocumentVisible(!document.hidden);
    sync(); visibility(); preference.addEventListener("change", sync); document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(entries => setInView(entries.some(entry => entry.isIntersecting)), {threshold: .01});
    if (root.current) observer.observe(root.current);
    return () => {observer.disconnect(); preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", visibility); timers.current.forEach(timer => window.clearTimeout(timer))};
  }, []);

  useEffect(() => {
    const frame = heroSceneFrame(engine.current.width, engine.current.height, expanded);
    engine.current.target = heroCameraFor(station, frame.width, frame.height, zoom);
    engine.current.orbit = {rx: 0, ry: 0}; engine.current.warp = 1; paint.current();
  }, [station, zoom, viewport, expanded]);

  useEffect(() => {
    if (!viewport || !world.current || !canvas.current) return;
    const scene = world.current, field = canvas.current, context = field.getContext("2d");
    if (!context) return;
    let frame = 0, disposed = false, lastFrame = 0, lastPaint = 0;
    const particles: Particle[] = Array.from({length: viewport.clientWidth < 500 ? 44 : 80}, () => ({x: (Math.random() - .5) * 2000, y: (Math.random() - .5) * 1200, z: Math.random() * 1400 + 100, size: Math.random() * 1.2 + .5, color: Math.random() > .24 ? "#21dade" : "#548fa7"}));
    const draw = (now: number, force = false) => {
      if (disposed) return;
      if (!force && now - lastPaint < 1000 / 30) {frame = requestAnimationFrame(tick); return}
      const dt = lastFrame ? Math.min(64, now - lastFrame) : 16.67; lastFrame = now; lastPaint = now;
      const state = engine.current, target = {...state.target, rx: state.target.rx + state.orbit.rx, ry: state.target.ry + state.orbit.ry};
      if (motion) {
        const factor = 1 - Math.exp(-dt / 165);
        for (const key of Object.keys(target) as (keyof HeroCamera)[]) state.camera[key] += (target[key] - state.camera[key]) * factor;
      } else state.camera = {...target};
      scene.style.transform = cameraTransform(state.camera);
      context.clearRect(0, 0, state.width, state.height);
      const speed = motion ? (2.2 + state.warp * 22) * dt / 16.67 : 0;
      if (motion) state.warp *= Math.pow(.92, dt / 16.67);
      for (const particle of particles) {
        particle.z -= speed;
        if (particle.z < 25) {particle.z = 1500; particle.x = (Math.random() - .5) * 2000; particle.y = (Math.random() - .5) * 1200}
        const depth = 520 / particle.z, cx = state.width / 2, cy = state.height / 2;
        const x = cx + (particle.x + state.camera.x * .2) * depth, y = cy + (particle.y + state.camera.y * .2) * depth;
        if (x < 0 || x > state.width || y < 0 || y > state.height) continue;
        context.globalAlpha = Math.min(.48, (1500 - particle.z) / 1800); context.strokeStyle = particle.color; context.fillStyle = particle.color;
        context.beginPath();
        if (motion && state.warp > .08) {const previousDepth = 520 / (particle.z + speed * 2.4); context.lineWidth = particle.size; context.moveTo(x, y); context.lineTo(cx + (particle.x + state.camera.x * .2) * previousDepth, cy + (particle.y + state.camera.y * .2) * previousDepth); context.stroke()}
        else {context.arc(x, y, Math.min(2, particle.size * depth * .5), 0, Math.PI * 2); context.fill()}
      }
      context.globalAlpha = 1;
    };
    const tick = (now: number) => {frame = 0; draw(now); if (motion && !disposed && !frame) frame = requestAnimationFrame(tick)};
    const once = () => {if (!motion) draw(performance.now(), true)};
    paint.current = once;
    const resize = () => {
      const width = viewport.clientWidth, height = viewport.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(1.5, window.devicePixelRatio || 1);
      field.width = Math.round(width * ratio); field.height = Math.round(height * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0);
      engine.current.width = width; engine.current.height = height;
      const frame = heroSceneFrame(width, height, expanded);
      engine.current.target = heroCameraFor(selected.current, frame.width, frame.height, magnification.current);
      once();
    };
    const observer = new ResizeObserver(resize); observer.observe(viewport); resize(); draw(performance.now(), true);
    if (motion) frame = requestAnimationFrame(tick);
    return () => {disposed = true; cancelAnimationFrame(frame); observer.disconnect(); paint.current = () => {}};
  }, [viewport, motion, expanded]);

  useEffect(() => {
    if (!tour || !motion) return;
    const timer = window.setInterval(() => {setStation(current => (current + 1) % heroStations.length); setZoom(0)}, 5200);
    return () => window.clearInterval(timer);
  }, [tour, motion]);

  useEffect(() => {
    if (!ready || (documentVisible && (inView || expanded) && !paused)) return;
    timers.current.forEach(timer => window.clearTimeout(timer)); timers.current = []; setRunning(false);
  }, [ready, documentVisible, inView, expanded, paused]);

  function choose(next: number) {setTour(false); setStation(next); setZoom(0); engine.current.orbit = {rx: 0, ry: 0}}
  function stopFlow() {timers.current.forEach(timer => window.clearTimeout(timer)); timers.current = []; setRunning(false)}
  function runFlow() {
    stopFlow(); setStep(0);
    if (reduced) {setStep(4); return}
    setRunning(true);
    timers.current = heroFlowLogs.map((_, index) => window.setTimeout(() => {setStep(index + 1); if (index === 3) {setRunning(false); timers.current = []}}, 800 * (index + 1)));
  }
  function togglePause() {const next = !paused; setPaused(next); if (next) stopFlow()}
  function toggleTour() {
    if (tour) {setTour(false); return}
    setPaused(false); setTour(true); setStation(current => (current + 1) % heroStations.length); setZoom(0);
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (paused || reduced || event.button !== 0 || (event.target as HTMLElement).closest("button,a,input")) return;
    setTour(false); drag.current = {id: event.pointerId, x: event.clientX, y: event.clientY}; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!motion) return;
    const active = drag.current;
    if (active && active.id === event.pointerId) {
      const dx = event.clientX - active.x, dy = event.clientY - active.y; active.x = event.clientX; active.y = event.clientY;
      engine.current.orbit.ry = clampHero(engine.current.orbit.ry + dx * .18, -30, 30); engine.current.orbit.rx = clampHero(engine.current.orbit.rx - dy * .15, -20, 20);
    } else if (event.pointerType === "mouse") {
      const rect = event.currentTarget.getBoundingClientRect(); engine.current.orbit.ry = ((event.clientX - rect.left) / rect.width - .5) * 4; engine.current.orbit.rx = -((event.clientY - rect.top) / rect.height - .5) * 3;
    }
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {if (drag.current?.id !== event.pointerId) return; drag.current = null; setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)}
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowRight") {event.preventDefault(); choose((station + 1) % 5)}
    if (event.key === "ArrowLeft") {event.preventDefault(); choose((station + 4) % 5)}
    if (event.key === "+" || event.key === "=") {event.preventDefault(); setZoom(current => clampHero(current + .25, -1, 1))}
    if (event.key === "-") {event.preventDefault(); setZoom(current => clampHero(current - .25, -1, 1))}
    if (event.key === "Home") {event.preventDefault(); choose(0)}
  }
  const focusButton = (node: number, title: string, Icon: typeof Workflow) => <Button type="button" variant="ghost" className="hi-node-heading" tabIndex={station === node ? 0 : -1} aria-pressed={station === node} onClick={() => choose(node)}><Icon size={20}/><span>{title}</span><small>0{node + 1}</small></Button>;

  const experience = <div className={`hi-experience ${!motion ? "hi-paused" : ""}`}>
    <div className="hi-toolbar"><span>FLUXO DEMONSTRATIVO</span><div><Button type="button" variant="ghost" onClick={toggleTour} aria-pressed={tour} disabled={reduced}>{tour ? <Pause size={16}/> : <Play size={16}/>}<span>{tour ? "Pausar passeio" : "Passeio automático"}</span></Button><Button type="button" variant="ghost" onClick={togglePause} aria-label={paused ? "Reproduzir movimentos do hero" : "Pausar movimentos do hero"} aria-pressed={paused} disabled={reduced}>{paused ? <Play size={17}/> : <Pause size={17}/>}</Button>{!expanded && <Button type="button" variant="ghost" onClick={event => {opener.current = event.currentTarget; setExpanded(true)}} aria-label="Ampliar experiência 3D"><Expand size={17}/></Button>}</div></div>
    <div className={`hi-viewport ${station > 0 ? "hi-focused" : ""} ${dragging ? "hi-dragging" : ""}`} ref={setViewport} tabIndex={0} role="group" aria-label="Cena 3D. Use as setas para mudar de módulo e mais ou menos para ajustar o zoom." onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={() => {drag.current = null; setDragging(false)}} onPointerLeave={() => {if (!drag.current) engine.current.orbit = {rx: 0, ry: 0}}} onKeyDown={keyboard}>
      <canvas ref={canvas} className="hi-particles" aria-hidden="true"/>
      <div className="hi-world" ref={world} style={{transform: cameraTransform(engine.current.camera)}}>
        <div className="hi-floor" aria-hidden="true"/>
        <div className="hi-connections" aria-hidden="true"><svg viewBox="0 0 1040 640" fill="none"><ellipse cx="520" cy="345" rx="390" ry="185" stroke="#21dade" strokeOpacity=".12" strokeDasharray="12 8"/><ellipse cx="520" cy="345" rx="240" ry="112" stroke="#548fa7" strokeOpacity=".3" strokeDasharray="18 12"/>{["M520 345L340 300L180 205", "M520 345L700 300L865 210", "M520 345L360 400L235 475", "M520 345L680 400L805 480"].map((path, index) => <g key={path}><path d={path} stroke="#08b6c4" strokeWidth="2" strokeOpacity=".35"/><path className={`hi-data-stream hi-stream-${index}`} d={path} stroke="#21dade" strokeWidth="3" strokeDasharray="24 170"/></g>)}</svg></div>
        <div className={`hi-node hi-core ${station === 1 ? "hi-active" : ""}`} style={positionNode(1)}>{focusButton(1, "Integrações", Layers3)}<div className="hi-core-graphic" dangerouslySetInnerHTML={{__html: coreSvg}}/><div className="hi-core-caption"><span>FORMULÁRIO</span><i/><span>SISTEMA</span><i/><span>EQUIPE</span></div></div>
        <article className={`hi-node hi-panel ${station === 2 ? "hi-active" : ""}`} style={positionNode(2)}>{focusButton(2, "Automações", Workflow)}<div className="hi-mini-workflow"><svg viewBox="0 0 270 100" fill="none" aria-hidden="true"><path d="M37 28H104V50H164L232 26M37 76H104V50M164 50L232 76" stroke="#548fa7" strokeWidth="2"/><path className="hi-data-stream" d="M37 28H104V50H164L232 26" stroke="#21dade" strokeWidth="3" strokeDasharray="20 140"/>{[[15, 16], [15, 64], [135, 35], [212, 14], [212, 64]].map(([x, y], index) => <rect x={x} y={y} width={index === 2 ? 47 : 38} height="24" rx="5" key={index} fill="#12364d" stroke={step >= index ? "#21dade" : "#3a6275"}/>)}</svg><div className="hi-workflow-labels"><span>Receber</span><span>Organizar</span><span>Encaminhar</span></div></div><div className="hi-node-footer"><span>ETAPA</span><strong>{heroFlowSteps[step]}</strong></div></article>
        <article className={`hi-node hi-panel ${station === 3 ? "hi-active" : ""}`} style={positionNode(3)}>{focusButton(3, "Sistemas web", Database)}<div className="hi-telemetry"><div className="hi-gauge"><svg viewBox="0 0 92 92" aria-hidden="true"><circle cx="46" cy="46" r="35" fill="none" stroke="#315468" strokeWidth="6"/><circle className="hi-gauge-value" cx="46" cy="46" r="35" fill="none" stroke="#21dade" strokeWidth="6" pathLength="100" strokeDasharray={`${step * 25} 100`} transform="rotate(-90 46 46)" strokeLinecap="round"/></svg><strong>{step * 25}%</strong></div><dl><div><dt>Recebidas</dt><dd>{step > 0 ? "01" : "00"}</dd></div><div><dt>Em andamento</dt><dd>{step > 0 && step < 4 ? "01" : "00"}</dd></div><div><dt>Concluídas</dt><dd>{step === 4 ? "01" : "00"}</dd></div></dl></div><div className="hi-node-footer"><span>PROGRESSO</span><strong>{step} / 4 etapas</strong></div></article>
        <article className={`hi-node hi-panel ${station === 4 ? "hi-active" : ""}`} style={positionNode(4)}>{focusButton(4, "Aplicações", AppWindow)}<div className="hi-app-preview"><div><span><AppWindow size={18}/>WEB</span><div className="hi-app-lines"><i/><i/><i/></div><Progress value={step * 25} aria-label="Etapas demonstrativas disponíveis no aplicativo web"/></div><div><Smartphone size={35}/><span>MÓVEL</span></div></div><div className="hi-node-footer"><span>ACOMPANHAMENTO</span><strong>{step === 4 ? "Disponível" : "Em preparação"}</strong></div></article>
        <article className="hi-node hi-panel hi-log-node" style={{width: 270, height: 185, marginLeft: -135, marginTop: -92, transform: "translate3d(285px,160px,120px) rotateY(-18deg) rotateX(-5deg)"}}><div className="hi-log-heading"><ClipboardCheck size={19}/><span>Eventos de exemplo</span></div><ul>{heroFlowLogs.map((log, index) => <li className={step > index ? "hi-log-done" : ""} key={log}>{step > index ? <Check size={13}/> : <span className="hi-log-dot"/>}<span>{log}</span></li>)}</ul></article>
      </div>
      <div className="hi-camera-controls"><Button type="button" variant="ghost" onClick={() => setZoom(current => clampHero(current - .25, -1, 1))} disabled={zoom <= -1} aria-label="Afastar câmera"><Minus size={17}/></Button><Button type="button" variant="ghost" onClick={() => setZoom(current => clampHero(current + .25, -1, 1))} disabled={zoom >= 1} aria-label="Aproximar câmera"><Plus size={17}/></Button><Button type="button" variant="ghost" onClick={() => choose(0)} aria-label="Voltar à visão geral"><RotateCcw size={16}/></Button></div>
      <div className="hi-camera-navigation"><Button type="button" variant="ghost" onClick={() => choose((station + 4) % 5)} aria-label="Módulo anterior"><ArrowLeft size={17}/></Button><span>0{station + 1} / 05</span><Button type="button" variant="ghost" onClick={() => choose((station + 1) % 5)} aria-label="Próximo módulo"><ArrowRight size={17}/></Button></div>
      <span className="hi-drag-guide">ARRASTE PARA EXPLORAR</span>
    </div>
    <Tabs value={String(station)} onValueChange={value => choose(Number(value))} className="hi-station-tabs"><TabsList className="hi-station-list" aria-label="Módulos da experiência 3D">{heroStations.map(item => <TabsTrigger key={item.id} value={String(item.id)}>{item.label}</TabsTrigger>)}</TabsList>{heroStations.map(item => <TabsContent value={String(item.id)} className="hi-detail" key={item.id}><div><h3>{item.title}</h3><p>{item.description}</p></div><div className="hi-detail-actions"><Button type="button" className="hi-run" onClick={runFlow} disabled={running || paused}>{running ? <Workflow size={16}/> : <Play size={16}/>} {running ? "Executando fluxo…" : step ? "Reexecutar fluxo" : "Executar exemplo"}</Button><Button type="button" variant="ghost" asChild><a href="#solucoes" onClick={() => {setExpanded(false); onSelectSolution(item.solution)}}>{item.action}</a></Button>{step > 0 && !running && <Button type="button" variant="ghost" className="hi-reset-flow" onClick={() => {stopFlow(); setStep(0)}} aria-label="Reiniciar fluxo demonstrativo"><RotateCcw size={16}/></Button>}</div></TabsContent>)}</Tabs>
    <div className="hi-flow-status" role="status" aria-live="polite"><span>{step ? `Exemplo · ${heroFlowSteps[step]} · ${step}/4` : "Selecione um módulo e experimente o fluxo."}</span><span aria-hidden="true">{paused ? "MOVIMENTO PAUSADO" : ""}</span></div>
  </div>;

  return <div className="hero-immersive" ref={root}>
    {expanded ? <div className="hi-placeholder"><Expand size={28}/><p>Experiência aberta em modo imersivo.</p></div> : experience}
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="hi-immersive-dialog" showCloseButton={false} onCloseAutoFocus={event => {event.preventDefault(); opener.current?.focus({preventScroll: true})}}><DialogHeader><DialogTitle>Explore a operação em 3D</DialogTitle><DialogDescription>Selecione um módulo, mova a câmera e reproduza o fluxo demonstrativo.</DialogDescription></DialogHeader><DialogClose className="hi-dialog-close" aria-label="Fechar modo imersivo"><X size={20}/></DialogClose>{experience}</DialogContent></Dialog>
  </div>;
}
