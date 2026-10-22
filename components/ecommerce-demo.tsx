"use client";

import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {startEcommerceVideo,holdEcommerceVideo,seekEcommerceVideo} from "@/lib/ecommerce-player";
import {ecommerceOptions,ecommerceClips,ecommerceBaseClip,ecommerceTransitionAllowed,type EcommerceBranch,type EcommerceDirection,type EcommerceScene,type EcommercePlayback} from "@/lib/ecommerce-scenes";

export function EcommerceDemo({onContact}:{onContact?:()=>void}){
 const [playback,setPlayback]=useState<EcommercePlayback>("loading");
 const [scene,setScene]=useState<EcommerceScene>("base");
 const [chosen,setChosen]=useState<EcommerceBranch|null>(null);
 const [collapsed,setCollapsed]=useState(false);
 const [titleHidden,setTitleHidden]=useState(false);
 const [ready,setReady]=useState<Set<string>>(()=>new Set());
 const [notice,setNotice]=useState("");
 const [announcement,setAnnouncement]=useState("Carregando a vitrine interativa.");
 const stage=useRef<HTMLDivElement>(null),controller=useRef<HTMLDivElement>(null);
 const videos=useRef(new Map<string,HTMLVideoElement>()),buttons=useRef(new Map<EcommerceBranch,HTMLButtonElement>());
 const active=useRef<string|null>(null),initialized=useRef(false),locked=useRef(false),token=useRef(0);
 const request=useRef<AbortController|null>(null),retry=useRef<{branch:EcommerceBranch;direction:EcommerceDirection}|null>(null);
 const sceneRef=useRef<EcommerceScene>("base"),playbackRef=useRef<EcommercePlayback>("loading");
 const mounted=useRef(true),focusFrame=useRef(0),chosenRef=useRef<EcommerceBranch|null>(null),collapsedRef=useRef(false);
 const resumeRetry=useRef(false),loadDeadline=useRef({elapsed:0,last:0});

 function updatePlayback(value:EcommercePlayback){playbackRef.current=value;setPlayback(value)}
 function showClip(id:string){
  videos.current.forEach((video,key)=>{if(key!==id)video.pause();video.style.visibility=key===id?"visible":"hidden"});
  active.current=id;
 }
 function alignLabel(branch:EcommerceBranch){
  const bar=controller.current,button=buttons.current.get(branch),surface=stage.current;
  if(!bar||!button||!surface)return;
  // Measure the grid cell, rather than a label already moving toward the capsule.
  const cell=button.parentElement?.getBoundingClientRect(),box=bar.getBoundingClientRect();
  if(!cell)return;
  const targetY=box.top+(surface.clientWidth<=700?surface.clientHeight*.04:35);
  button.style.setProperty("--label-dx",`${box.left+box.width/2-(cell.left+cell.width/2)}px`);
  button.style.setProperty("--label-dy",`${targetY-(cell.top+cell.height/2)}px`);
 }
 function moveCapsule(index:number){
  if(collapsedRef.current||locked.current||sceneRef.current!=="base")return;
  const bar=controller.current;if(!bar)return;
  bar.style.setProperty("--cap-left",index===0?"-5px":`${index*20}%`);
  bar.style.setProperty("--cap-width",index===0||index===4?"calc(20% + 5px)":"20%");
  bar.classList.toggle("is-highlighted",index>0);
 }
 function restoreFocus(branch:EcommerceBranch,shouldRestore:boolean){
  if(!shouldRestore)return;cancelAnimationFrame(focusFrame.current);
  focusFrame.current=requestAnimationFrame(()=>{if(mounted.current&&!locked.current)buttons.current.get(branch)?.focus({preventScroll:true})});
 }

 useEffect(()=>{
  mounted.current=true;loadDeadline.current={elapsed:0,last:performance.now()};
  const refresh=()=>{
   const loaded=new Set<string>();videos.current.forEach((video,id)=>{if(video.readyState>=2)loaded.add(id)});setReady(loaded);
   const base=videos.current.get(ecommerceBaseClip);
   if(!initialized.current&&base&&loaded.has(ecommerceBaseClip)){
    base.pause();base.currentTime=0;showClip(ecommerceBaseClip);initialized.current=true;
    updatePlayback("ready");setNotice("");setAnnouncement("Vitrine pronta. Escolha cenário, iluminação, roupa ou modelo.");
   }
   const pending=retry.current;
   if(resumeRetry.current&&pending&&loaded.has(`${pending.branch}-forward`)&&loaded.has(`${pending.branch}-reverse`)){
    resumeRetry.current=false;const currentToken=token.current;
    queueMicrotask(()=>{if(mounted.current&&currentToken===token.current&&!locked.current)void transition(pending.branch,pending.direction)});
   }
  };
  const failed=()=>{
   refresh();if(!initialized.current){updatePlayback("error");setNotice("Não foi possível carregar a vitrine. Tente novamente.")}
   else if(!locked.current)setNotice("Algumas opções ainda não carregaram. Você pode tentar novamente.");
  };
  videos.current.forEach(video=>{video.addEventListener("loadeddata",refresh);video.addEventListener("canplay",refresh);video.addEventListener("error",failed)});
  refresh();
  const deadline=window.setInterval(()=>{
   const now=performance.now();if(!document.hidden)loadDeadline.current.elapsed+=now-loadDeadline.current.last;loadDeadline.current.last=now;
   if(!initialized.current&&playbackRef.current==="loading"&&loadDeadline.current.elapsed>20000){updatePlayback("error");setNotice("O carregamento está demorando. Tente novamente.");setAnnouncement("O carregamento da vitrine está demorando.")}
  },200);
  const observer=new ResizeObserver(()=>{if(chosenRef.current)alignLabel(chosenRef.current)});if(stage.current)observer.observe(stage.current);
  const currentVideos=[...videos.current.values()];
  return()=>{
   mounted.current=false;token.current++;request.current?.abort();cancelAnimationFrame(focusFrame.current);window.clearInterval(deadline);observer.disconnect();
   currentVideos.forEach(video=>{video.pause();video.removeEventListener("loadeddata",refresh);video.removeEventListener("canplay",refresh);video.removeEventListener("error",failed)});
  };
 },[]);

 async function transition(branch:EcommerceBranch,direction:EcommerceDirection){
  const forward=videos.current.get(`${branch}-forward`),reverse=videos.current.get(`${branch}-reverse`);
  if(locked.current||!initialized.current||!forward||!reverse||forward.readyState<2||reverse.readyState<2||!ecommerceTransitionAllowed(sceneRef.current,playbackRef.current,branch,direction))return;
  // Lock before any await: fast taps must never queue another clip.
  locked.current=true;resumeRetry.current=false;const currentToken=++token.current;request.current?.abort();const abort=new AbortController();request.current=abort;
  const live=()=>mounted.current&&currentToken===token.current&&!abort.signal.aborted;
  const button=buttons.current.get(branch),hadFocus=document.activeElement===button;
  const target=direction==="forward"?forward:reverse,targetId=`${branch}-${direction}`;
  const previousId=active.current,previous=previousId?videos.current.get(previousId):undefined,previousTime=previous?.currentTime??0;
  previous?.pause();retry.current={branch,direction};chosenRef.current=branch;setChosen(branch);alignLabel(branch);
  collapsedRef.current=direction==="forward";setCollapsed(collapsedRef.current);updatePlayback("starting");setNotice("");
  if(direction==="reverse"){
   controller.current?.style.setProperty("--cap-left","-5px");controller.current?.style.setProperty("--cap-width","calc(20% + 5px)");controller.current?.classList.remove("is-highlighted");
  }
  const label=ecommerceOptions.find(option=>option.id===branch)?.label??"Opção";
  setAnnouncement(direction==="forward"?`Alterando ${label.toLowerCase()}.` :"Voltando à cena inicial.");
  try{
   await startEcommerceVideo(target,abort.signal);if(!live())return;
   showClip(targetId);updatePlayback("playing");let hidden=direction==="reverse";
   await holdEcommerceVideo(target,branch,direction,abort.signal,time=>{
    if(live()&&direction==="forward"&&!hidden&&time>=Math.min(target.duration*.12,.9)){hidden=true;setTitleHidden(true)}
   });
   if(!live())return;
   const next:EcommerceScene=direction==="forward"?branch:"base";sceneRef.current=next;setScene(next);
   if(direction==="reverse"){chosenRef.current=null;setChosen(null);setTitleHidden(false)}
   retry.current=null;locked.current=false;updatePlayback("ready");
   setAnnouncement(direction==="forward"?`${label} selecionado. Use Voltar ao início para experimentar outra opção.`:"Cena inicial restaurada. Escolha outra opção.");restoreFocus(branch,hadFocus);
  }catch(error){
   if(!live())return;target.pause();
   // A failed request never commits a new scene or exposes an unloaded placeholder.
   if(previous){try{await seekEcommerceVideo(previous,previousTime,abort.signal)}catch{}if(!live())return;if(previousId)showClip(previousId)}
   const wasSelected=sceneRef.current!=="base";collapsedRef.current=wasSelected;setCollapsed(wasSelected);
   chosenRef.current=wasSelected?branch:null;setChosen(chosenRef.current);setTitleHidden(wasSelected);
   locked.current=false;updatePlayback("error");setNotice("Não foi possível concluir a transição. Tente novamente.");setAnnouncement("A transição não foi concluída. A cena anterior foi mantida.");restoreFocus(branch,hadFocus);
  }
 }

 function retryLoading(){
  if(locked.current)return;
  if(retry.current){
   const pending=retry.current,pair=[videos.current.get(`${pending.branch}-forward`),videos.current.get(`${pending.branch}-reverse`)];
   if(pair.every(video=>video&&video.readyState>=2&&!video.error)){void transition(pending.branch,pending.direction);return}
   resumeRetry.current=true;setNotice("Recarregando os vídeos desta opção…");setAnnouncement("Recarregando os vídeos para tentar novamente.");pair.forEach(video=>{if(video&&(video.readyState<2||video.error))video.load()});return;
  }
  setNotice("");setAnnouncement("Tentando carregar os vídeos novamente.");
  if(!initialized.current){loadDeadline.current={elapsed:0,last:performance.now()};updatePlayback("loading")}
  videos.current.forEach(video=>{if(video.readyState<2||video.error)video.load()});
 }
 const busy=playback==="starting"||playback==="playing";
 const selected=scene!=="base"&&!busy;

 return <div className="ecommerce-demo">
  <div className="ecom-toolbar"><b>NexFlow <span>/ vitrine interativa</span></b><span>EXEMPLO DE E-COMMERCE</span></div>
  <div ref={stage} className={`ecom-stage ${titleHidden?"title-hidden":""}`} aria-busy={busy||playback==="loading"}>
   {ecommerceClips.map(clip=><video key={clip.id} ref={element=>{if(element){element.muted=true;videos.current.set(clip.id,element)}else videos.current.delete(clip.id)}} className="ecom-media" src={clip.src} muted playsInline preload="auto" aria-hidden="true"/>)}
   <div className="ecom-copy"><h4><span>Seu</span> <span>catálogo</span> <span>em cena.</span></h4><p>Explore diferentes formas de apresentar uma coleção.</p></div>
   <div ref={controller} className={`ecom-controller ${collapsed?"is-collapsed":""} ${selected?"is-selected":""} ${busy&&!collapsed?"is-reversing":""}`} role="group" aria-label="Opções da vitrine"
    onPointerMove={event=>{const box=event.currentTarget.getBoundingClientRect();event.currentTarget.style.setProperty("--glass-x",`${(event.clientX-box.left)/box.width*100}%`);event.currentTarget.style.setProperty("--glass-y",`${(event.clientY-box.top)/box.height*100}%`)}}
    onPointerLeave={()=>{const index=ecommerceOptions.findIndex(option=>buttons.current.get(option.id)===document.activeElement);moveCapsule(index+1)}}>
    <div className="ecom-track ecom-glass" aria-hidden="true"/><div className="ecom-capsule ecom-glass" aria-hidden="true"/>
    <div className="ecom-cells">
     <div className="ecom-cell ecom-prompt" aria-hidden={collapsed}>Explorar <span aria-hidden="true">→</span></div>
     {ecommerceOptions.map((option,index)=>{
      const isChosen=chosen===option.id,hidden=collapsed&&!isChosen;
      const disabled=busy||!initialized.current||!ready.has(`${option.id}-forward`)||!ready.has(`${option.id}-reverse`)||(scene!=="base"&&scene!==option.id);
      return <div className="ecom-cell-slot" key={option.id}><Button variant="ghost" ref={element=>{if(element)buttons.current.set(option.id,element);else buttons.current.delete(option.id)}} className={`ecom-cell ecom-action ${isChosen?"is-chosen":""}`} disabled={disabled} aria-hidden={hidden} tabIndex={hidden?-1:0} aria-label={selected&&isChosen?"Voltar à cena inicial":option.label}
       onPointerEnter={()=>moveCapsule(index+1)} onFocus={()=>moveCapsule(index+1)} onBlur={()=>moveCapsule(0)} onClick={()=>void transition(option.id,sceneRef.current===option.id?"reverse":"forward")}>
       <span className="ecom-option-label">{option.label}</span><span className="ecom-reset-label" aria-hidden="true">Voltar ao início</span>
      </Button></div>;
     })}
    </div>
   </div>
   <div className="ecom-stage-header"><b>NexFlow <span>COLEÇÃO</span></b><a href="#contato" onClick={onContact}>Minha loja</a></div>
   {(!initialized.current||notice)&&<div className="ecom-notice" role="status"><p>{notice||"Carregando a vitrine…"}</p>{notice&&<Button variant="ghost" onClick={retryLoading}>Tentar novamente</Button>}</div>}
   <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
  </div>
  <div className="ecom-caption"><p>Escolha uma opção para explorar a coleção.</p><span>Vitrine demonstrativa. Volte ao início para experimentar outra opção.</span></div>
 </div>;
}
