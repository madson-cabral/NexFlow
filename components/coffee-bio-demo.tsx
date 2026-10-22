"use client";

import {useEffect,useId,useRef,useState,type RefObject} from "react";
import {Pencil,X,Trophy,Shuffle,Pause,Play,Coffee} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {liquidDisplacementPixels} from "@/lib/liquid-glass";

type Panel="edit"|"achievements"|null;
const base="/assets/bio-coffee/";
const favorites=[{name:"Latte",count:73,image:"latte.png"},{name:"Chá gelado",count:28,image:"coffee.png"}];
const achievements=["Primeiro café","Hora do latte","Pausa para o lanche","Novo sabor","Café em companhia","Fim de semana","Rota das cafeterias","Favorito escolhido","Café da manhã","Mais uma visita","Clássico da casa","Doze cafeterias"];

function useLiquidGlass(root:RefObject<HTMLElement|null>,defs:RefObject<SVGDefsElement|null>,prefix:string,closed:boolean){
 useEffect(()=>{
  const surface=root.current,filters=defs.current;
  if(!surface||!filters||closed)return;
  // Other engines keep the ordinary blur. SVG backdrop refraction is an
  // enhancement, so the screen never depends on it to remain readable.
  const chromium=/(?:Chrome|Chromium|Edg)\//.test(navigator.userAgent);
  if(!chromium||!CSS.supports("backdrop-filter",`url("#${prefix}") blur(.3px) saturate(1.3)`))return;
  const ns="http://www.w3.org/2000/svg",elements=[...surface.querySelectorAll<HTMLElement>("[data-liquid]")];
  const previous=new Map<HTMLElement,string>(),signatures=new Map<HTMLElement,string>();
  const nodes=new Map<HTMLElement,SVGFilterElement>();let disposed=false,frame=0;
  function update(){
   frame=0;if(disposed)return;
   elements.forEach((element,index)=>{
    const width=element.offsetWidth,height=element.offsetHeight;
    if(width<1||height<1)return;
    const radius=parseFloat(getComputedStyle(element).borderTopLeftRadius)||22,key=`${width}/${height}/${radius}`;
    if(signatures.get(element)===key)return;signatures.set(element,key);
    const map=liquidDisplacementPixels(width,height,radius),canvas=document.createElement("canvas");
    canvas.width=map.width;canvas.height=map.height;const context=canvas.getContext("2d");if(!context)return;
    const data=context.createImageData(map.width,map.height);data.data.set(map.pixels);context.putImageData(data,0,0);
    let filter=nodes.get(element);
    if(!filter){filter=document.createElementNS(ns,"filter");filter.id=`${prefix}-${index}`;filters!.appendChild(filter);nodes.set(element,filter);previous.set(element,element.style.backdropFilter)}
    filter.replaceChildren();filter.setAttribute("filterUnits","userSpaceOnUse");filter.setAttribute("primitiveUnits","userSpaceOnUse");
    filter.setAttribute("x","0");filter.setAttribute("y","0");filter.setAttribute("width",String(width));filter.setAttribute("height",String(height));filter.setAttribute("color-interpolation-filters","sRGB");
    const image=document.createElementNS(ns,"feImage");image.setAttribute("href",canvas.toDataURL());image.setAttribute("x","0");image.setAttribute("y","0");image.setAttribute("width",String(width));image.setAttribute("height",String(height));image.setAttribute("result","refraction");
    const displacement=document.createElementNS(ns,"feDisplacementMap");displacement.setAttribute("in","SourceGraphic");displacement.setAttribute("in2","refraction");displacement.setAttribute("scale","16");displacement.setAttribute("xChannelSelector","R");displacement.setAttribute("yChannelSelector","G");
    filter.appendChild(image);filter.appendChild(displacement);element.style.backdropFilter=`url("#${filter.id}") blur(.3px) saturate(1.3)`;
   });
  }
  const schedule=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(update)};
  const observer=new ResizeObserver(schedule);elements.forEach(element=>observer.observe(element));update();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();nodes.forEach(node=>node.remove());previous.forEach((value,element)=>element.style.backdropFilter=value)};
 },[root,defs,prefix,closed]);
}

export function CoffeeBioDemo(){
 const [name,setName]=useState("Dasha"),[subtitle,setSubtitle]=useState("Latte com parfait de ameixa"),[favorite,setFavorite]=useState(0);
 const [panel,setPanel]=useState<Panel>(null),[closed,setClosed]=useState(false),[notice,setNotice]=useState("");
 const [visible,setVisible]=useState(false),[playing,setPlaying]=useState(false),[paused,setPaused]=useState(false),[reduced,setReduced]=useState(false),[motionReady,setMotionReady]=useState(false),[available,setAvailable]=useState(true);
 const root=useRef<HTMLDivElement>(null),slot=useRef<HTMLDivElement>(null),screen=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null),defs=useRef<SVGDefsElement>(null),sheet=useRef<HTMLDivElement>(null);
 const lastTrigger=useRef<HTMLButtonElement|null>(null),syncVideo=useRef(()=>{});
 const id=useId().replace(/[^a-zA-Z0-9_-]/g,""),chosen=favorites[favorite];
 useLiquidGlass(root,defs,`coffee-liquid-${id}`,closed);

 useEffect(()=>{
  const element=slot.current;if(!element)return;
  const measure=()=>element.style.setProperty("--coffee-scale",String(Math.max(.1,Math.min(.78,element.clientWidth/390))));
  const resize=new ResizeObserver(measure);resize.observe(element);measure();
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect()}},{threshold:.1});observer.observe(element);
  return()=>{resize.disconnect();observer.disconnect()};
 },[]);

 useEffect(()=>{
  const query=window.matchMedia("(prefers-reduced-motion: reduce)");
  const update=()=>{setReduced(query.matches);setMotionReady(true)};update();query.addEventListener("change",update);
  return()=>query.removeEventListener("change",update);
 },[]);

 useEffect(()=>{
  const v=video.current,surface=root.current;if(!v||!surface||closed)return;
  let disposed=false,inView=false;
  const sync=()=>{
   if(disposed)return;
   if(!motionReady||reduced||paused||!available||document.hidden||!inView){v.pause();return}
   v.muted=true;if(v.paused)void v.play().catch(()=>{if(!disposed)setPlaying(false)});
  };
  syncVideo.current=sync;
  const observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;sync()},{threshold:0});observer.observe(surface);
  document.addEventListener("visibilitychange",sync);
  return()=>{disposed=true;observer.disconnect();document.removeEventListener("visibilitychange",sync);syncVideo.current=()=>{};v.pause()};
 },[closed,motionReady,reduced,paused,available]);

 useEffect(()=>{if(panel)sheet.current?.querySelector<HTMLElement>("input,button")?.focus({preventScroll:true})},[panel]);
 useEffect(()=>{if(closed)root.current?.querySelector<HTMLButtonElement>("button")?.focus({preventScroll:true})},[closed]);
 function openPanel(next:Exclude<Panel,null>,trigger:HTMLButtonElement){lastTrigger.current=trigger;setPanel(next)}
 function closePanel(){setPanel(null);requestAnimationFrame(()=>lastTrigger.current?.focus({preventScroll:true}))}
 function toggleVideo(){
  const v=video.current;if(!v)return;
  if(playing){setPaused(true);v.pause()}else{setPaused(false);v.muted=true;void v.play().catch(()=>setNotice("Toque em reproduzir para tentar novamente."))}
 }

 return <div className="coffee-bio-demo"><div className="coffee-showcase"><div ref={slot} className={`coffee-slot ${visible?"coffee-visible":""}`}><div className="coffee-phone" ref={root}>
  <svg className="coffee-liquid-defs" aria-hidden="true"><defs ref={defs}/></svg>
  {closed?<div className="coffee-closed"><Coffee size={38}/><h2>Prévia encerrada.</h2><Button type="button" className="coffee-solid-button" onClick={()=>{setClosed(false);setNotice("");requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>(".coffee-edit")?.focus({preventScroll:true}))}}>Reabrir perfil</Button></div>:<>
   <div ref={screen} className="coffee-screen" inert={panel!==null} tabIndex={panel?-1:0} aria-label="Perfil de café demonstrativo. Conteúdo rolável.">
    <div className={`coffee-hero ${!available?"coffee-video-unavailable":""}`}><video ref={video} src={`${base}hero.mp4`} muted loop playsInline preload={reduced?"none":"metadata"} poster={`${base}poster.jpg`} aria-hidden="true" onCanPlay={()=>syncVideo.current()} onPlaying={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>{setAvailable(false);setPlaying(false);setNotice("O vídeo não carregou. A imagem de capa continua disponível.")}}/><div className="coffee-hero-shade"/></div>
    <div className="coffee-topbar"><Button type="button" variant="ghost" className="coffee-glass coffee-circle coffee-edit" data-liquid aria-label="Editar perfil de demonstração" onClick={event=>openPanel("edit",event.currentTarget)}><Pencil size={19}/></Button><Button type="button" variant="ghost" className="coffee-glass coffee-circle coffee-close" data-liquid aria-label="Encerrar prévia do perfil" onClick={()=>{setClosed(true);setPlaying(false)}}><X size={21}/></Button></div>
    <div className="coffee-identity"><img className="coffee-laurel coffee-laurel-left" src={`${base}laurel-left.svg`} alt="" width="37" height="73"/><h2>{name}</h2><img className="coffee-laurel coffee-laurel-right" src={`${base}laurel-right.svg`} alt="" width="37" height="73"/><p>{subtitle}</p></div>
    <div className="coffee-achievement-wrap"><Button type="button" variant="ghost" className="coffee-glass coffee-pill" data-liquid onClick={event=>openPanel("achievements",event.currentTarget)}><Trophy size={18}/><span>12 conquistas</span></Button></div>
    <div className="coffee-stats"><article className="coffee-stat"><img src={`${base}coffee.png`} width="84" height="84" alt=""/><strong>154</strong><span>bebidas<br/>consumidas</span></article><article className="coffee-stat"><img src={`${base}sandwich.png`} width="84" height="84" alt=""/><strong>36</strong><span>sanduíches<br/>saboreados</span></article><article className="coffee-stat"><img src={`${base}cafe.png`} width="84" height="84" alt=""/><strong>12</strong><span>cafeterias<br/>visitadas</span></article></div>
    <div className="coffee-favorite"><img className="coffee-favorite-image" src={`${base}${chosen.image}`} width="108" height="108" alt={chosen.name}/><div className="coffee-favorite-copy"><span>Favorito</span><strong>{chosen.name}</strong><small>Pedido {chosen.count} vezes</small></div><Button type="button" variant="ghost" className="coffee-glass coffee-circle coffee-shuffle" data-liquid aria-label="Trocar bebida favorita" onClick={()=>{const next=(favorite+1)%favorites.length;setFavorite(next);setNotice(`Favorito alterado para ${favorites[next].name}.`)}}><Shuffle size={19}/></Button></div>
    <div className="coffee-next-card"><h3>Seu resumo</h3><p>154 bebidas, 36 sanduíches e 12 cafeterias.</p><span>Dados deste perfil demonstrativo.</span></div>
   </div>
   {panel&&<div className="coffee-sheet-overlay"><div ref={sheet} className="coffee-sheet" role="dialog" aria-modal="false" aria-labelledby={`coffee-sheet-title-${id}`} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closePanel()}}}><header><h3 id={`coffee-sheet-title-${id}`}>{panel==="edit"?"Editar perfil":"Suas conquistas"}</h3><Button type="button" variant="ghost" className="coffee-glass coffee-circle" aria-label="Fechar painel" onClick={closePanel}><X size={21}/></Button></header>{panel==="edit"?<form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const nextName=String(data.get("name")??"").trim(),nextSubtitle=String(data.get("subtitle")??"").trim();if(!nextName||!nextSubtitle)return;setName(nextName);setSubtitle(nextSubtitle);setNotice("Perfil de demonstração atualizado.");closePanel()}}><div><Label htmlFor={`coffee-name-${id}`}>Nome</Label><Input id={`coffee-name-${id}`} name="name" defaultValue={name} required maxLength={20} autoComplete="off"/></div><div><Label htmlFor={`coffee-subtitle-${id}`}>Sua bebida</Label><Input id={`coffee-subtitle-${id}`} name="subtitle" defaultValue={subtitle} required maxLength={50} autoComplete="off"/></div><p>As alterações ficam somente nesta prévia.</p><Button type="submit" className="coffee-solid-button">Salvar perfil</Button><Button type="button" variant="ghost" className="coffee-cancel" onClick={closePanel}>Cancelar</Button></form>:<><p>12 conquistas do perfil demonstrativo.</p><ul className="coffee-achievement-list">{achievements.map((title,index)=><li key={title}><Trophy size={20}/><span>{title}</span><small>{String(index+1).padStart(2,"0")}</small></li>)}</ul></>}</div></div>}
  </>}
 </div></div></div><div className="bio-caption coffee-caption"><p>Explore as conquistas, edite o perfil e troque o favorito.</p><span>Modelo de café e lifestyle. Dados demonstrativos.</span>{!closed&&available&&<Button type="button" variant="ghost" className="coffee-motion-control" onClick={toggleVideo} aria-label={playing?"Pausar vídeo do perfil":"Reproduzir vídeo do perfil"}>{playing?<Pause size={16}/>:<Play size={16}/>}<span>{playing?"Pausar vídeo":"Reproduzir vídeo"}</span></Button>}<div className="coffee-notice" role="status" aria-live="polite">{notice}</div></div></div>;
}
