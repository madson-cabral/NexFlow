"use client";

import {useEffect, useId, useRef, useState, type CSSProperties} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {demoDays, demoTools, searchDemoRecords} from "@/lib/system-demo-data";

function DemoIcon({kind, size=22}: {kind: "sparkle"|"check"|"search"|"workflow", size?: number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "check" ? <path d="m5 12 4 4L19 6"/> : kind === "search" ? <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></> : kind === "workflow" ? <><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v9h9M9 6h9v9"/></> : <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5Z"/></>}
  </svg>;
}

export function SystemMosaicDemo() {
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [phase, setPhase] = useState(-1);
  const [runs, setRuns] = useState(0);
  const [tools, setTools] = useState(["Notion", "Google Drive", "Slack"]);
  const [day, setDay] = useState(6);
  const [query, setQuery] = useState("");
  const busy = phase >= 0 && phase < 3;
  const results = searchDemoRecords(query);
  const phaseLabels = ["Recebendo solicitação…", "Registrando os dados…", "Preparando o relatório…", "Demonstração concluída."];

  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanupTimer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      element.classList.add("system-entrance");
      observer.disconnect();
      cleanupTimer = setTimeout(() => element.classList.remove("system-entrance"), 1850);
    }, {threshold: .08});
    observer.observe(element);
    return () => {observer.disconnect();clearTimeout(cleanupTimer);element.classList.remove("system-entrance")};
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function runDemo() {
    if (busy) return;
    timers.current.forEach(clearTimeout);
    setPhase(0);
    timers.current = [1, 2, 3].map(step => setTimeout(() => {
      setPhase(step);
      if (step === 3) setRuns(value => value + 1);
    }, step * 500));
  }

  function toggleTool(name: string) {
    setTools(current => current.includes(name) ? current.filter(tool => tool !== name) : [...current, name]);
  }

  return <div className="system-demo" ref={root} aria-label="Demonstração de um sistema web">
    <div className="system-demo-label"><span>EXEMPLO INTERATIVO</span><span>DADOS FICTÍCIOS</span></div>
    <div className="system-demo-stage">
      <article className="system-demo-card system-automate" aria-labelledby={`${uid}-automate`}>
        <div className="system-automate-copy">
          <h4 id={`${uid}-automate`}><span>Automatize</span> seu trabalho.<br/>Foque no que importa.</h4>
          <p>Um fluxo para receber, registrar e acompanhar solicitações.</p>
          <Button type="button" className="system-run-button" onClick={runDemo} disabled={busy}><DemoIcon kind="workflow" size={18}/>{busy ? "Executando…" : "Executar demonstração"}</Button>
          <p className="system-run-status" role="status">{phase < 0 ? "Experimente o fluxo demonstrativo." : phaseLabels[phase]}</p>
        </div>
        <div className={`system-interface-scene ${busy ? "is-running" : ""}`} aria-hidden="true">
          <div className="system-window system-window-back">
            <div className="system-window-chrome"><i/><i/><i/><span>Solicitações</span></div>
            <div className="system-window-body"><aside><span>Visão geral</span><span>Equipe</span></aside><div><strong>Nova solicitação</strong><span className={phase >= 0 ? "step-complete" : ""}>Receber informações <DemoIcon kind="check" size={14}/></span><span className={phase >= 1 ? "step-complete" : ""}>Registrar os dados <DemoIcon kind="check" size={14}/></span></div></div>
          </div>
          <div className="system-window system-window-front">
            <div className="system-window-chrome"><i/><i/><i/><span>Operação</span></div>
            <div className="system-window-body"><aside><span>Relatórios</span><span>Histórico</span></aside><div><strong>Relatório semanal</strong><span className={phase >= 2 ? "step-complete" : ""}>Organizar os registros <DemoIcon kind="check" size={14}/></span><span className={phase === 3 ? "step-complete" : ""}>Concluir o fluxo <DemoIcon kind="check" size={14}/></span><div className="system-window-progress"><span style={{width: `${phase < 0 ? 20 : (phase + 1) * 25}%`}}/></div></div></div>
          </div>
          <div className={`system-workflow-pill ${phase === 3 ? "is-complete" : ""}`}><span><DemoIcon kind="check" size={14}/></span>{phase === 3 ? "Fluxo concluído" : "Etapas conectadas"}</div>
          <div className="system-data-pill"><DemoIcon kind="sparkle"/><span>Dados<br/>centralizados</span></div>
          <svg className="system-cursor" width="25" height="30" viewBox="0 0 24 28" aria-hidden="true"><path d="M3 2v22l6-6 5 8 4-2-5-8h8Z" fill="#fff" stroke="#081d33" strokeWidth="1.3" strokeLinejoin="round"/></svg>
        </div>
      </article>

      <article className="system-demo-card system-notification" aria-label="Notificação demonstrativa">
        <div className="system-toast-wrap">
          <div className="system-toast-ledge"/>
          <div className="system-toast" key={runs}><span className="system-toast-icon"><DemoIcon kind={runs ? "check" : "sparkle"}/></span><div><strong>{runs ? "Automação concluída!" : "Tudo pronto para começar."}</strong><p>{runs ? "Relatório gerado no exemplo." : "Execute o fluxo para ver o resultado."}</p></div><small>{runs ? "AGORA" : "EXEMPLO"}</small></div>
        </div>
      </article>

      <article className="system-demo-card system-connect" aria-labelledby={`${uid}-tools`}>
        <h4 id={`${uid}-tools`}>Conecte suas<br/>ferramentas.</h4>
        <p>Selecione as ferramentas deste exemplo.</p>
        <div className="system-tool-chips">{demoTools.map(tool => <Button type="button" variant="outline" className={`system-tool-chip ${tool.name === "Slack" ? "system-slack-chip" : ""}`} key={tool.name} aria-pressed={tools.includes(tool.name)} onClick={() => toggleTool(tool.name)}><span>{tool.name}</span><span className="system-tool-symbol" aria-hidden="true">{tools.includes(tool.name) ? <DemoIcon kind="check" size={14}/> : tool.short}</span></Button>)}</div>
        <span className="system-tools-status" aria-live="polite">{tools.length} {tools.length === 1 ? "ferramenta selecionada" : "ferramentas selecionadas"}</span>
        <small>Integrações reais são definidas por projeto.</small>
      </article>

      <article className="system-demo-card system-insights" aria-labelledby={`${uid}-insights`}>
        <span className="system-insights-tag" id={`${uid}-insights`}>Visão da produtividade</span>
        <h4 key={day}>{demoDays[day].hours.toLocaleString("pt-BR")} horas</h4>
        <p>acumuladas até {demoDays[day].name.toLocaleLowerCase("pt-BR")}</p>
        <small>Cenário ilustrativo · selecione um dia</small>
        <div className="system-hours-chart" aria-label="Horas acumuladas na simulação">{demoDays.map((item, index) => <Button type="button" variant="ghost" className="system-chart-column" key={item.day} aria-label={`${item.name}: ${item.hours} horas acumuladas na simulação`} aria-pressed={index === day} onClick={() => setDay(index)} style={{"--bar-height": `${item.hours / 48 * 100}%`, "--bar-delay": `${index * 45}ms`} as CSSProperties}><span className="system-chart-bar"><span>{item.hours}h</span></span><span className="system-chart-day">{item.day}</span></Button>)}</div>
      </article>

      <article className="system-demo-card system-search" aria-labelledby={`${uid}-search-title`}>
        <div className="system-search-top"><h4 id={`${uid}-search-title`}>Encontre o que<br/>precisa.</h4><div className="system-search-input"><span aria-hidden="true"><DemoIcon kind="search"/></span><Input type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label="Buscar nos dados demonstrativos" placeholder="Buscar tarefas, documentos, fluxos…" maxLength={100}/></div></div>
        <div className="system-search-results"><p aria-live="polite">{query.trim() ? `${results.length} ${results.length === 1 ? "resultado encontrado" : "resultados encontrados"}` : "Experimente buscar por relatório, cliente ou tarefa."}</p>{query.trim() && <ul>{results.map(item => <li key={item.title}><span>{item.type}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></li>)}</ul>}{query.trim() && !results.length && <p className="system-search-empty">Nenhum registro corresponde à busca. Tente outro termo.</p>}</div>
      </article>
    </div>
    <p className="system-demo-note">Demonstração local. Nenhum relatório é enviado e nenhuma conta externa é conectada.</p>
  </div>;
}
