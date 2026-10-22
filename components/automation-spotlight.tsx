"use client";

import {useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent} from "react";
import {Button} from "@/components/ui/button";
import {automationPresets, nextAutomationPreset} from "@/lib/automation-presets";

function SpotlightIcon({kind}:{kind:"play"|"pause"|"eye"|"shuffle"|"link"}) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind==="play"?<path d="m7 4 13 8-13 8Z" fill="currentColor" stroke="none"/>:kind==="pause"?<><path d="M8 5v14M16 5v14" strokeWidth="4"/></>:kind==="eye"?<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>:kind==="shuffle"?<><path d="M3 6h3c5 0 7 12 12 12h3M18 15l3 3-3 3M3 18h3c2 0 3-2 4-4M14 8c1-1 2-2 4-2h3M18 3l3 3-3 3"/></>:<><path d="m10 13 4-4"/><path d="M9 16 7 18a4 4 0 0 1-6-6l3-3a4 4 0 0 1 6 0M15 8l2-2a4 4 0 0 1 6 6l-3 3a4 4 0 0 1-6 0"/></>}
  </svg>;
}

export function AutomationSpotlight() {
  const uid=useId();
  const root=useRef<HTMLDivElement>(null), stack=useRef<HTMLDivElement>(null), back=useRef<HTMLImageElement>(null);
  const pointer=useRef({x:-9999,y:-9999,active:false});
  const [selected,setSelected]=useState(0),[playing,setPlaying]=useState(false),[fullReveal,setFullReveal]=useState(false),[notice,setNotice]=useState("");
  const noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const preset=automationPresets[selected];

  useEffect(()=>{
    const element=root.current;if(!element)return;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    if(reduced.matches)return;
    let cleanupTimer:ReturnType<typeof setTimeout>;
    const observer=new IntersectionObserver(entries=>{if(!entries.some(entry=>entry.isIntersecting))return;element.classList.add("spotlight-entrance");observer.disconnect();cleanupTimer=setTimeout(()=>element.classList.remove("spotlight-entrance"),1900)},{threshold:.08});
    observer.observe(element);
    return()=>{observer.disconnect();clearTimeout(cleanupTimer);element.classList.remove("spotlight-entrance")};
  },[]);

  useEffect(()=>{
    const image=back.current, art=stack.current;if(!image||!art)return;
    let frame=0,visible=true,lastTime=0,elapsed=0;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const smooth={x:-9999,y:-9999};
    const paint=(x:number,y:number)=>{
      const radius=Math.min(185,Math.max(85,art.clientWidth*.31));
      const mask=`radial-gradient(circle ${radius}px at ${x}px ${y}px, #000 0%, #000 62%, rgba(0,0,0,.5) 80%, transparent 100%)`;
      image.style.maskImage=mask;image.style.webkitMaskImage=mask;
    };
    const hide=()=>{paint(-9999,-9999);smooth.x=-9999;smooth.y=-9999};
    const tick=(time:number)=>{
      frame=0;
      if(!visible||fullReveal)return;
      const dt=Math.min(50,lastTime ? time-lastTime : 16.7);lastTime=time;
      if(playing)elapsed+=dt;
      let target=pointer.current;
      if(playing&&!pointer.current.active){
        target={x:art.clientWidth*(.5+.24*Math.sin(elapsed/1500)),y:art.clientHeight*(.43+.2*Math.cos(elapsed/2000)),active:true};
      }
      if(!target.active){hide();return;}
      if(reduced.matches){paint(target.x,target.y);return;}
      if(smooth.x===-9999){smooth.x=target.x;smooth.y=target.y;}
      const ease=1-Math.pow(.9,dt/16.7);
      smooth.x+=(target.x-smooth.x)*ease;smooth.y+=(target.y-smooth.y)*ease;
      paint(smooth.x,smooth.y);
      if(playing||Math.abs(target.x-smooth.x)+Math.abs(target.y-smooth.y)>.25)frame=requestAnimationFrame(tick);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(tick)};
    const refresh=()=>{
      if(fullReveal){image.style.maskImage="none";image.style.webkitMaskImage="none";return;}
      if(reduced.matches&&playing){paint(art.clientWidth*.52,art.clientHeight*.43);return;}
      schedule();
    };
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){lastTime=0;refresh()}else{cancelAnimationFrame(frame);frame=0}},{threshold:.05});
    observer.observe(art);
    const resize=new ResizeObserver(refresh);resize.observe(art);
    art.addEventListener("pointermove",schedule);art.addEventListener("pointerdown",schedule);art.addEventListener("pointerleave",schedule);art.addEventListener("pointercancel",schedule);
    reduced.addEventListener("change",refresh);refresh();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();reduced.removeEventListener("change",refresh);art.removeEventListener("pointermove",schedule);art.removeEventListener("pointerdown",schedule);art.removeEventListener("pointerleave",schedule);art.removeEventListener("pointercancel",schedule)};
  },[playing,fullReveal]);

  useEffect(()=>()=>{if(noticeTimer.current)clearTimeout(noticeTimer.current)},[]);
  function say(message:string){setNotice(message);if(noticeTimer.current)clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(""),2000)}
  function choose(index:number){setSelected(index);say(`Exemplo selecionado: ${automationPresets[index].name}.`)}
  function track(event:PointerEvent<HTMLDivElement>){
    const element=stack.current;if(!element)return;const rect=element.getBoundingClientRect();
    pointer.current={x:(event.clientX-rect.left)*(element.clientWidth/rect.width),y:(event.clientY-rect.top)*(element.clientHeight/rect.height),active:true};
  }
  function leave(){pointer.current.active=false}
  function togglePlay(){setFullReveal(false);setPlaying(value=>!value);say(playing?"Prévia pausada.":"Efeito de revelação ativado.")}
  function toggleReveal(){setPlaying(false);setFullReveal(value=>!value);say(fullReveal?"Efeito com cursor ativado.":"Segunda imagem revelada.")}

  return <div className="automation-spotlight" ref={root}>
    <div className="spotlight-toolbar"><span><b>NexFlow</b> / demonstração</span><span>PRÉVIA INTERATIVA</span></div>
    <div className="spotlight-stage">
      <div className="spotlight-heading"><p>AUTOMAÇÕES SOB MEDIDA</p><h4>Conecte as etapas.<br/><span><SpotlightIcon kind="link"/>Deixe o trabalho fluir.</span></h4></div>
      <div className="spotlight-features" aria-label={`Etapas do exemplo de ${preset.name}`}>{preset.steps.map((step,index)=><div key={step}><span>{step}</span><small>/ 0{index+1}</small></div>)}</div>
      <div className="spotlight-creator"><span aria-hidden="true">✓</span><div>NexFlow<small>Fluxo demonstrativo · 0{selected+1}</small></div></div>
      <div className="spotlight-art" ref={stack} onPointerMove={track} onPointerDown={track} onPointerLeave={leave} onPointerCancel={leave} style={{"--avatar-hue":`${preset.hue}deg`,"--avatar-saturation":preset.saturation} as CSSProperties}>
        <img className={`spotlight-front ${playing?"is-awake":""}`} src="/assets/automation/front.webp" alt="Androide em prata, parte da prévia visual interativa" width="600" height="759" draggable="false" loading="lazy"/>
        <img ref={back} className="spotlight-back" src="/assets/automation/back.webp" alt="" aria-hidden="true" width="960" height="1200" draggable="false" loading="lazy"/>
      </div>
      <div className="spotlight-ghost spotlight-ghost-one" aria-hidden="true">FLUXO</div><div className="spotlight-ghost spotlight-ghost-two" aria-hidden="true">CONTÍNUO</div>
      <div className="spotlight-mini-avatar" aria-hidden="true"><img src="/assets/automation/front.webp" alt="" width="600" height="759" loading="lazy"/></div>
      <div className="spotlight-glass-card">
        <div className="spotlight-card-top"><span className="spotlight-count"><strong>03</strong><small>etapas conectadas</small></span><Button type="button" variant="ghost" className="spotlight-eye" size="icon" onClick={toggleReveal} aria-pressed={fullReveal} aria-label={fullReveal?"Voltar à imagem prata":"Revelar a segunda imagem"}><SpotlightIcon kind="eye"/></Button></div>
        <h5>{preset.name}</h5><p>{preset.description}</p>
        <div className="spotlight-card-bottom"><span>{playing?"Prévia em":"Experimente a"}<strong>{playing?"movimento":"revelação"}</strong></span><Button type="button" variant="ghost" size="icon" className="spotlight-shuffle" onClick={()=>choose(nextAutomationPreset(selected))} aria-label="Selecionar o próximo exemplo de automação"><SpotlightIcon kind="shuffle"/></Button><Button type="button" size="icon" className="spotlight-play" onClick={togglePlay} aria-pressed={playing} aria-label={playing?"Pausar o efeito de revelação":"Reproduzir o efeito de revelação"}><SpotlightIcon kind={playing?"pause":"play"}/></Button></div>
      </div>
      <div className="spotlight-material"><div className="spotlight-material-thumb"><img src="/assets/automation/material.webp" alt="" width="360" height="328" loading="lazy"/></div><div className="spotlight-material-pill"><p>Etapas<br/>conectadas</p><Button type="button" variant="ghost" size="icon" onClick={()=>choose(nextAutomationPreset(selected))} aria-label="Alternar o exemplo de automação"><SpotlightIcon kind="shuffle"/></Button></div></div>
      <div className="spotlight-gallery" aria-labelledby={`${uid}-gallery`}><p id={`${uid}-gallery`}>ESCOLHA UM EXEMPLO DE FLUXO</p><div>{automationPresets.map((item,index)=><Button type="button" variant="ghost" className="spotlight-avatar" key={item.name} aria-pressed={selected===index} aria-label={`Selecionar exemplo: ${item.name}`} onClick={()=>choose(index)}><img src={`/assets/automation/av${index+1}.webp`} alt="" width="360" height="360" loading="lazy"/><span>{item.name}</span></Button>)}</div></div>
      <p className="spotlight-instruction">Mova o cursor ou toque na imagem.<br/>Use o botão de reprodução para ver o efeito.</p>
      <div className={`spotlight-notice ${notice?"is-visible":""}`} role="status" aria-live="polite">{notice}</div>
    </div>
    <p className="spotlight-disclaimer">Exemplos demonstrativos. Etapas e integrações são definidas conforme o projeto.</p>
  </div>;
}
