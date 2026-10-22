"use client";

import {useEffect, useRef, useState, type CSSProperties, type PointerEvent} from "react";
import {Check, ChevronLeft, ChevronRight, Copy, Expand, Pause, Play, RotateCcw, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Slider} from "@/components/ui/slider";
import {Label} from "@/components/ui/label";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {identityFilters, identityReferences, type IdentityFilter, type IdentityPiece, type IdentityReference} from "@/lib/visual-identity-demo";

// Crop through layout only: all supplied artwork stays in its original file.
function artworkStyle(reference: IdentityReference, piece: IdentityPiece): CSSProperties {
  const [x, y, width, height] = piece.crop;
  return {width: `${reference.width / width * 100}%`, height: `${reference.height / height * 100}%`, left: `${-x / width * 100}%`, top: `${-y / height * 100}%`};
}

function Artwork({reference, piece, zoom = 100}: {reference: IdentityReference; piece: IdentityPiece; zoom?: number}) {
  return <div className="identity-crop" style={{"--identity-zoom": zoom / 100} as CSSProperties}><div className="identity-crop-zoom"><img src={reference.image} alt={piece.title} width={reference.width} height={reference.height} loading="lazy" decoding="async" draggable={false} style={artworkStyle(reference, piece)}/></div></div>;
}

function IdentityBoard({reference, index}: {reference: IdentityReference; index: number}) {
  const root = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null), opener = useRef<HTMLElement | null>(null), pointerFrame = useRef(0);
  const [filter, setFilter] = useState<IdentityFilter>("all"), [selected, setSelected] = useState(reference.pieces[0].id);
  const [expanded, setExpanded] = useState(false), [mode, setMode] = useState("piece"), [zoom, setZoom] = useState(100);
  const [playing, setPlaying] = useState(false), [inView, setInView] = useState(false), [reduced, setReduced] = useState(false), [documentVisible, setDocumentVisible] = useState(true);
  const [copied, setCopied] = useState(""), [notice, setNotice] = useState("");
  const pieces = reference.pieces.filter(piece => filter === "all" || piece.category === filter);
  const piece = reference.pieces.find(item => item.id === selected) || reference.pieces[0];
  const current = Math.max(0, pieces.findIndex(item => item.id === piece.id));

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {setReduced(preference.matches); if (preference.matches) {setPlaying(false); clearReflection()}};
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    updatePreference(); updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {setInView(entry.isIntersecting); if (entry.isIntersecting) element.classList.add("identity-arrived")}), {threshold: .03});
    observer.observe(element);
    return () => {observer.disconnect(); preference.removeEventListener("change", updatePreference); document.removeEventListener("visibilitychange", updateVisibility); cancelAnimationFrame(pointerFrame.current)};
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const tiles = element.querySelectorAll(".identity-tile");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {if (entry.isIntersecting) {entry.target.classList.add("identity-tile-visible"); observer.unobserve(entry.target)}}), {threshold: .08});
    tiles.forEach(tile => observer.observe(tile));
    return () => observer.disconnect();
  }, [filter]);

  useEffect(() => {
    if (!playing || !inView || !documentVisible || reduced || expanded) return;
    const timer = window.setInterval(() => setSelected(previous => {
      const choices = reference.pieces.filter(item => filter === "all" || item.category === filter);
      const next = (choices.findIndex(item => item.id === previous) + 1) % choices.length;
      return choices[next].id;
    }), 2600);
    return () => window.clearInterval(timer);
  }, [playing, inView, documentVisible, reduced, expanded, filter, reference]);

  function clearReflection() {
    cancelAnimationFrame(pointerFrame.current);
    stage.current?.style.setProperty("--identity-rotate-x", "0deg");
    stage.current?.style.setProperty("--identity-rotate-y", "0deg");
  }

  function reflect(event: PointerEvent<HTMLDivElement>) {
    if (reduced || expanded || event.pointerType !== "mouse") return;
    const element = stage.current;
    if (!element) return;
    const rect = element.getBoundingClientRect(), x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = requestAnimationFrame(() => {
      element.style.setProperty("--identity-rotate-x", `${(y - .5) * -1.8}deg`);
      element.style.setProperty("--identity-rotate-y", `${(x - .5) * 2.2}deg`);
    });
  }

  function changeFilter(value: string) {
    const next = value as IdentityFilter;
    setFilter(next); setPlaying(false);
    if (next !== "all" && piece.category !== next) setSelected(reference.pieces.find(item => item.category === next)!.id);
  }

  function openArtwork(element: HTMLElement, target: IdentityPiece = piece, view = "piece") {
    opener.current = element; setSelected(target.id); setMode(view); setZoom(100); setPlaying(false); clearReflection(); setExpanded(true);
  }

  function step(direction: number) {
    setSelected(pieces[(current + direction + pieces.length) % pieces.length].id); setZoom(100); setPlaying(false);
  }

  async function copyColor(color: string) {
    try {await navigator.clipboard.writeText(color); setCopied(color); setNotice(`Cor ${color} copiada.`)}
    catch {setNotice(`Cor selecionada: ${color}. Você pode copiar o código exibido.`)}
  }

  return <article ref={root} className={`identity-board identity-${reference.id} ${playing ? "identity-touring" : ""}`} aria-labelledby={`identity-${reference.id}-title`}>
    <header className="identity-board-heading"><div className="identity-board-number">0{index + 1}<span>/ QUADRO</span></div><div><p>REFERÊNCIA DE IDENTIDADE</p><h4 id={`identity-${reference.id}-title`}>{reference.name}<span>{reference.subtitle}</span></h4></div><Button type="button" variant="ghost" className="identity-expand-board" onClick={event => openArtwork(event.currentTarget, piece, "board")}><Expand/><span>Ampliar quadro</span></Button></header>
    <Tabs value={filter} onValueChange={changeFilter} className="identity-filter-tabs">
      <div className="identity-board-tools"><TabsList className="identity-filters" aria-label={`Aplicações da identidade ${reference.name}`}>{identityFilters.map(option => <TabsTrigger key={option.id} value={option.id}>{option.label}</TabsTrigger>)}</TabsList><Button type="button" variant="ghost" className="identity-tour" aria-pressed={playing} disabled={reduced} onClick={() => setPlaying(!playing)}>{playing ? <Pause/> : <Play/>}<span>{playing ? "Pausar" : "Percorrer peças"}</span></Button></div>
      {identityFilters.map(option => <TabsContent key={option.id} value={option.id} className="identity-filter-content">
        <div ref={option.id === filter ? stage : undefined} className={`identity-stage ${option.id === "all" ? "identity-stage-complete" : "identity-stage-filtered"}`} style={{"--identity-ratio": reference.width / reference.height, "--identity-board-bg": reference.background} as CSSProperties} onPointerMove={reflect} onPointerLeave={clearReflection}>
          {reference.pieces.filter(item => option.id === "all" || item.category === option.id).map((item, tileIndex) => {
            const [x, y, width, height] = item.crop;
            return <Button type="button" variant="ghost" key={item.id} className={`identity-tile ${item.id === selected ? "identity-selected" : ""}`} style={{left: `${x / reference.width * 100}%`, top: `${y / reference.height * 100}%`, width: `${width / reference.width * 100}%`, height: `${height / reference.height * 100}%`, "--identity-piece-ratio": width / height, "--identity-tile-delay": `${Math.min(tileIndex, 8) * 65}ms`} as CSSProperties} onClick={event => openArtwork(event.currentTarget, item)} aria-label={`Ampliar ${item.title} — ${reference.name}`}><Artwork reference={reference} piece={item}/><span className="identity-tile-caption"><span>{item.title}</span><Expand/></span></Button>;
          })}
        </div>
      </TabsContent>)}
    </Tabs>
    <div className="identity-piece-inspector"><div className="identity-piece-count">{String(current + 1).padStart(2, "0")}<span>/ {String(pieces.length).padStart(2, "0")}</span></div><div><h5>{piece.title}</h5><p>{piece.description}</p></div><div className="identity-piece-navigation"><Button variant="ghost" type="button" aria-label={`Peça anterior de ${reference.name}`} onClick={() => step(-1)}><ChevronLeft/></Button><Button variant="ghost" type="button" aria-label={`Próxima peça de ${reference.name}`} onClick={() => step(1)}><ChevronRight/></Button><Button variant="ghost" type="button" aria-label={`Ampliar ${piece.title}`} onClick={event => openArtwork(event.currentTarget)}><Expand/></Button></div></div>
    <div className="identity-board-footer"><p>{reference.description}</p><div className="identity-palette"><span>Cores aproximadas da referência</span><div>{reference.colors.map(color => <Button key={color} type="button" variant="ghost" onClick={() => copyColor(color)} className="identity-swatch" aria-label={`Copiar cor ${color}`}><i style={{background: color}} aria-hidden="true"/><code>{color}</code>{copied === color ? <Check/> : <Copy/>}</Button>)}</div></div></div>
    <p className="identity-copy-status" role="status" aria-live="polite">{notice}</p>
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="identity-dialog" showCloseButton={false} onCloseAutoFocus={event => {event.preventDefault(); opener.current?.focus()}}>
      <DialogClose asChild><Button type="button" variant="ghost" className="identity-dialog-close" aria-label="Fechar quadro de identidade visual"><X/></Button></DialogClose>
      <DialogHeader className="identity-dialog-heading"><DialogTitle>{reference.name} / {mode === "board" ? "Quadro completo" : piece.title}</DialogTitle><DialogDescription>{mode === "board" ? "Composição original da referência enviada." : piece.description}</DialogDescription></DialogHeader>
      <Tabs value={mode} onValueChange={value => {setMode(value); setZoom(100)}} className="identity-dialog-tabs"><TabsList className="identity-dialog-modes" aria-label="Visualização da identidade"><TabsTrigger value="piece">Peça selecionada</TabsTrigger><TabsTrigger value="board">Quadro completo</TabsTrigger></TabsList><TabsContent value="piece" className="identity-lightbox-panel"><div className="identity-lightbox-art" style={{"--identity-art-ratio": piece.crop[2] / piece.crop[3]} as CSSProperties}><Artwork reference={reference} piece={piece} zoom={zoom}/></div><div className="identity-zoom-controls"><Label htmlFor={`identity-${reference.id}-zoom`}>Ampliação <b>{zoom}%</b></Label><Slider id={`identity-${reference.id}-zoom`} min={100} max={180} step={10} value={[zoom]} onValueChange={values => setZoom(values[0])} aria-label="Ampliação da peça"/><Button type="button" variant="ghost" aria-label="Restaurar ampliação original" disabled={zoom === 100} onClick={() => setZoom(100)}><RotateCcw/></Button></div><div className="identity-lightbox-navigation"><Button variant="outline" type="button" onClick={() => step(-1)}><ChevronLeft/>Anterior</Button><span>{current + 1} de {pieces.length}</span><Button variant="outline" type="button" onClick={() => step(1)}>Próxima<ChevronRight/></Button></div></TabsContent><TabsContent value="board" className="identity-full-reference"><img src={reference.image} width={reference.width} height={reference.height} alt={`Quadro original da identidade ${reference.name}, com símbolo e aplicações da marca`} loading="lazy"/></TabsContent></Tabs>
      <p className="identity-dialog-note">Referência fornecida para demonstração de identidade visual.</p>
    </DialogContent></Dialog>
  </article>;
}

export function VisualIdentityDemo() {
  return <section className="visual-identity-demo" aria-label="Identidade visual: modelos interativos"><div className="identity-toolbar"><b>NexFlow <span>/ identidade visual</span></b><span>MARCA. SISTEMA. APLICAÇÕES.</span></div><Tabs defaultValue={identityReferences[0].id} className="identity-models"><TabsList className="identity-model-tabs" aria-label="Modelos de identidade visual">{identityReferences.map(reference => <TabsTrigger key={reference.id} value={reference.id}>{reference.name}</TabsTrigger>)}</TabsList>{identityReferences.map((reference, index) => <TabsContent key={reference.id} value={reference.id} className="identity-model-panel"><div className="identity-boards"><IdentityBoard reference={reference} index={index}/></div></TabsContent>)}</Tabs><p className="identity-model-caption">Selecione um modelo para explorar sua identidade e aplicações.</p></section>;
}
