"use client";

import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {Dialog,DialogClose,DialogContent,DialogDescription,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {Tabs,TabsContent,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {PortfolioLandingDemo} from "@/components/portfolio-landing-demo";

const treatments=["Facetas dentárias","Coroas dentárias","Clareamento dental","Implantes dentários"];
const destinations=[{id:"start",label:"Início"},{id:"care",label:"Serviços"},{id:"implants",label:"Implantes"}];

/** A scoped shared-image mosaic: positions are measured before reveal transforms. */
function LandingMosaic({image,focalX=.8,enabled,children,className=""}:{image:string,focalX?:number,enabled:boolean,children:ReactNode,className?:string}){
 const root=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const group=root.current;if(!group)return;
  let disposed=false,raf=0;const picture=new Image();
  const position=()=>{
   raf=0;if(disposed)return;
   const width=group.clientWidth,height=group.clientHeight;
   const iw=picture.naturalWidth||2688,ih=picture.naturalHeight||1520;
   const scale=Math.max(width/iw,height/ih),sw=iw*scale,sh=ih*scale;
   const focal=width<680?.7:focalX;
   group.querySelectorAll<HTMLElement>("[data-landing-mask]").forEach(card=>{
    let x=0,y=0,node:HTMLElement|null=card;
    while(node&&node!==group){x+=node.offsetLeft;y+=node.offsetTop;node=node.offsetParent as HTMLElement|null;}
    card.style.backgroundSize=`${sw}px ${sh}px`;
    card.style.backgroundPosition=`${-x-(sw-width)*focal}px ${-y-(sh-height)*.5}px`;
   });
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(position);};
  picture.onload=schedule;picture.src=image;position();
  const resize=new ResizeObserver(schedule);resize.observe(group);
  group.querySelectorAll<HTMLElement>("[data-landing-mask]").forEach(card=>resize.observe(card));
  void document.fonts.ready.then(schedule);
  return()=>{disposed=true;picture.onload=null;cancelAnimationFrame(raf);resize.disconnect();};
 },[image,focalX]);
 useLandingReveal(root,enabled);
 return <div ref={root} className={`landing-shared ${className}`} style={{"--landing-image":`url("${image}")`} as CSSProperties}>{children}</div>;
}

function useLandingReveal(root:React.RefObject<HTMLDivElement|null>,enabled:boolean){
 useEffect(()=>{
  const group=root.current;if(!group||!enabled)return;
  const cards=Array.from(group.querySelectorAll<HTMLElement>(".landing-reveal"));
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const showAll=()=>cards.forEach(card=>card.classList.add("is-shown"));
  if(reduced.matches){showAll();return;}
  cards.forEach((card,index)=>card.style.setProperty("--landing-delay",`${Math.min(index,4)*120}ms`));
  group.classList.add("landing-reveal-ready");
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add("is-shown");observer.unobserve(entry.target);}
  }),{threshold:.08});
  cards.forEach(card=>observer.observe(card));
  const preference=()=>{if(reduced.matches){showAll();observer.disconnect();}};
  reduced.addEventListener("change",preference);
  return()=>{observer.disconnect();reduced.removeEventListener("change",preference);group.classList.remove("landing-reveal-ready");};
 },[enabled,root]);
}

function ReplayIcon(){return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;}

function ClinicLandingPageDemo(){
 const scroll=useRef<HTMLDivElement>(null),progress=useRef<HTMLSpanElement>(null),third=useRef<HTMLDivElement>(null),menuButton=useRef<HTMLButtonElement>(null);
 const [menu,setMenu]=useState(false),[intro,setIntro]=useState(true),[count,setCount]=useState(0),[exiting,setExiting]=useState(false),[cycle,setCycle]=useState(0);
 const [selected,setSelected]=useState(0),[dialog,setDialog]=useState<"booking"|"process"|"followup"|null>(null),[completed,setCompleted]=useState(false),[name,setName]=useState("");
 useLandingReveal(third,!intro);

 useEffect(()=>{
  if(!intro)return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(reduced.matches){setIntro(false);return;}
  let raf=0,started=0,finish=0,exit=0;
  const stop=()=>{cancelAnimationFrame(raf);window.clearTimeout(finish);window.clearTimeout(exit);};
  const step=(time:number)=>{
   if(!started)started=time;
   const value=Math.min(100,Math.floor((time-started)/20));setCount(value);
   if(value<100)raf=requestAnimationFrame(step);
   else{exit=window.setTimeout(()=>setExiting(true),200);finish=window.setTimeout(()=>setIntro(false),900);}
  };
  raf=requestAnimationFrame(step);
  const preference=()=>{if(reduced.matches){stop();setIntro(false);}};
  reduced.addEventListener("change",preference);
  return()=>{stop();reduced.removeEventListener("change",preference);};
 },[intro,cycle]);

 useEffect(()=>{
  const element=scroll.current;if(!element)return;let raf=0;
  const update=()=>{raf=0;const total=element.scrollHeight-element.clientHeight;progress.current?.style.setProperty("--landing-progress",String(total>0?element.scrollTop/total:0));};
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
  const resize=new ResizeObserver(schedule);resize.observe(element);Array.from(element.children).forEach(child=>resize.observe(child));
  element.addEventListener("scroll",schedule,{passive:true});update();
  return()=>{resize.disconnect();cancelAnimationFrame(raf);element.removeEventListener("scroll",schedule);};
 },[]);

 useEffect(()=>{
  if(!menu)return;
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMenu(false);menuButton.current?.focus();}};
  window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape);
 },[menu]);

 function jump(id:string){
  setMenu(false);
  const target=scroll.current?.querySelector<HTMLElement>(`[data-landing-section="${id}"]`);
  if(target&&scroll.current){
   let top=0,node:HTMLElement|null=target;
   while(node&&node!==scroll.current){top+=node.offsetTop;node=node.offsetParent as HTMLElement|null;}
   scroll.current.scrollTo({top:id==="start"?0:Math.max(0,top-84),behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  }
  scroll.current?.focus({preventScroll:true});
 }
 function replay(){setMenu(false);setCount(0);setExiting(false);setIntro(true);setCycle(value=>value+1);scroll.current?.scrollTo({top:0,behavior:"instant"});}
 function openBooking(index=selected){setSelected(index);setCompleted(false);setName("");setMenu(false);setDialog("booking");}

 return <div className="landing-page-demo">
  <div className="landing-demo-toolbar"><div><b>NexFlow</b><span>/ landing page demonstrativa</span></div><Button variant="ghost" className="landing-replay" aria-label="Repetir abertura da demonstração" onClick={replay} disabled={intro}><ReplayIcon/><span>Repetir abertura</span></Button></div>
  <div className="landing-preview-shell">
   <header className="landing-nav" inert={intro}>
    <button className="landing-clinic-logo" onClick={()=>jump("start")} aria-label="Saúde Bucal, início da demonstração"><strong>Saúde<br/>Bucal</strong><small>CLÍNICA DEMONSTRATIVA</small></button>
    <div className="landing-nav-actions"><Button className="landing-menu-button" variant="outline" aria-label={menu?"Fechar menu da demonstração":"Abrir menu da demonstração"} ref={menuButton} aria-expanded={menu} aria-controls="landing-clinic-menu" onClick={()=>setMenu(value=>!value)}><span>{menu?"Fechar":"Menu"}</span><i className={menu?"is-open":""} aria-hidden="true"><span/><span/><span/></i></Button><Button className="landing-nav-book" onClick={()=>openBooking()}>Agendar avaliação</Button></div>
   </header>
   <nav id="landing-clinic-menu" className="landing-menu" aria-label="Menu da clínica demonstrativa" hidden={!menu} onClick={event=>{if(event.target===event.currentTarget){setMenu(false);menuButton.current?.focus();}}}>
    <div>{destinations.map((item,index)=><button key={item.id} style={{"--menu-delay":`${index*60}ms`} as CSSProperties} onClick={()=>jump(item.id)}><small>0{index+1}</small>{item.label}</button>)}<Button className="landing-pill" onClick={()=>openBooking()}>Agendar uma avaliação</Button><p>Uma clínica fictícia para experimentar este formato de página.</p></div>
   </nav>
   <div className="landing-preview-scroll" ref={scroll} tabIndex={0} role="region" aria-label="Página demonstrativa de clínica odontológica. Role dentro do quadro para explorar." inert={menu||intro}>
    <section data-landing-section="start" className="landing-clinic-section landing-clinic-intro" aria-label="Apresentação da clínica">
     <LandingMosaic image="/assets/landing/hero.webp" enabled={!intro} className="landing-hero-mosaic">
      {["Cuidado em cada etapa","Informação clara","Atendimento próximo"].map(text=><div className="landing-feature-bar landing-reveal" data-landing-mask key={text}><span>{text}</span></div>)}
      <div className="landing-clinic-hero landing-reveal" data-landing-mask>
       <p className="landing-hero-note">Um espaço para conhecer a clínica<br/>e conversar sobre o seu cuidado.</p>
       <div className="landing-hero-title"><span>ODONTOLOGIA · SAÚDE BUCAL</span><h4>Cuidar<br/>do sorriso.</h4></div>
       <Button className="landing-pill landing-hero-cta" onClick={()=>openBooking()}>Agendar avaliação</Button>
      </div>
     </LandingMosaic>
    </section>
    <section data-landing-section="care" className="landing-clinic-section" aria-label="Serviços da clínica">
     <LandingMosaic image="/assets/landing/smile.webp" enabled={!intro} focalX={.8} className="landing-care-mosaic">
      <div className="landing-care-heading landing-reveal" data-landing-mask><h4>Seu sorriso.<br/>Seu cuidado.</h4><p>Conheça as áreas de atendimento.</p></div>
      <div className="landing-care-contact landing-reveal" data-landing-mask><div><p>O primeiro passo é uma conversa.<br/>Uma avaliação ajuda a entender o que você precisa.</p><Button className="landing-pill" onClick={()=>openBooking()}>Conversar com a clínica</Button></div></div>
      <div className="landing-care-title landing-reveal" data-landing-mask><h4>Cuidado<br/>em cada<br/>detalhe.</h4></div>
      <div className="landing-treatment-grid landing-reveal" data-landing-mask>
       {treatments.map((treatment,index)=><button key={treatment} className={`landing-treatment ${index===selected?"is-active":""}`} aria-pressed={index===selected} onClick={()=>setSelected(index)}><h5>{treatment}</h5><span>0{index+1}</span></button>)}
      </div>
      <div className="landing-treatment-selection"><p aria-live="polite">Você selecionou <strong>{treatments[selected].toLowerCase()}</strong>.</p><Button variant="ghost" onClick={()=>openBooking()}>Solicitar avaliação</Button></div>
     </LandingMosaic>
    </section>
    <section data-landing-section="implants" className="landing-clinic-section" aria-label="Apresentação de implantes dentários">
     <div className="landing-implant-grid" ref={third}>
      <div className="landing-implant-copy">
       <div className="landing-implant-heading landing-reveal"><h4>Implantes<br/>dentários.</h4><p>Entenda o atendimento, etapa por etapa.</p></div>
       <div className="landing-implant-images landing-reveal"><img src="/assets/landing/implant.webp" alt="Ilustração de um implante dentário e sua coroa" width="720" height="720" loading="lazy"/><img src="/assets/landing/restoration.webp" alt="Ilustração das peças de uma restauração dentária" width="720" height="720" loading="lazy"/></div>
       <div className="landing-consultation landing-reveal"><div><small>AVALIAÇÃO</small><h5>Converse sobre<br/>o seu cuidado.</h5></div><Button className="landing-pill" onClick={()=>openBooking(3)}>Agendar</Button></div>
      </div>
      <div className="landing-patient landing-reveal"><img src="/assets/landing/patient.webp" alt="Retrato ilustrativo de uma pessoa sorrindo" width="720" height="1084" loading="lazy"/><div className="landing-patient-panels"><button onClick={()=>setDialog("process")}><h5>Como funciona<br/>o atendimento</h5><span>Conhecer</span></button><button onClick={()=>setDialog("followup")}><h5>Cuidados e<br/>acompanhamento</h5><span>Saiba mais</span></button></div></div>
     </div>
    </section>
    <div className="landing-clinic-footer"><span>Saúde Bucal · exemplo fictício</span><button onClick={()=>jump("start")}>Voltar ao início</button></div>
   </div>
   <div className="landing-scroll-progress" aria-hidden="true"><span ref={progress}/></div>
   {intro&&<div className={`landing-splash ${exiting?"is-exiting":""}`} role="status" aria-label="Abertura da página demonstrativa"><span className="landing-splash-label">SAÚDE BUCAL / CLÍNICA DEMONSTRATIVA</span><Button variant="ghost" onClick={()=>setIntro(false)} className="landing-splash-skip">Pular abertura</Button><span className="landing-splash-count" aria-hidden="true">{count.toString().padStart(2,"0")}</span></div>}
  </div>
  <div className="landing-demo-caption"><p>Role dentro do quadro para explorar a página.</p><span>Clínica e conteúdo demonstrativos. O agendamento é uma simulação.</span></div>
  <Dialog open={dialog!==null} onOpenChange={open=>{if(!open)setDialog(null);}}>
   <DialogContent className="landing-booking-dialog" showCloseButton={false}>
    <DialogClose className="landing-dialog-close" aria-label="Fechar demonstração">×</DialogClose>
    <DialogHeader><DialogTitle>{dialog==="booking"?"Agendar uma avaliação":dialog==="process"?"Como funciona o atendimento":"Cuidados e acompanhamento"}</DialogTitle><DialogDescription>{dialog==="booking"?"Experimente o contato desta página. Nenhuma solicitação será enviada à clínica.":"Exemplo de conteúdo que uma clínica pode apresentar em sua landing page."}</DialogDescription></DialogHeader>
    {dialog==="booking"?(completed?<div className="landing-booking-success" role="status"><strong>Simulação concluída, {name.trim()}.</strong><p>Sua escolha foi {treatments[selected].toLowerCase()}. Em um projeto real, este contato pode seguir para o canal de atendimento da empresa.</p><Button className="landing-pill" onClick={()=>setDialog(null)}>Voltar à página</Button></div>:<form className="landing-booking-form" onSubmit={event=>{event.preventDefault();setCompleted(true);}}><div><Label htmlFor="landing-demo-name">Seu nome</Label><Input id="landing-demo-name" value={name} onChange={event=>setName(event.target.value)} required minLength={2} maxLength={60} pattern=".*\S.*" placeholder="Use um nome para testar"/></div><div><Label htmlFor="landing-demo-treatment">Área de interesse</Label><Select value={String(selected)} onValueChange={value=>setSelected(Number(value))}><SelectTrigger id="landing-demo-treatment"><SelectValue/></SelectTrigger><SelectContent>{treatments.map((treatment,index)=><SelectItem key={treatment} value={String(index)}>{treatment}</SelectItem>)}</SelectContent></Select></div><Button type="submit" className="landing-pill">Simular solicitação</Button></form>):<div className="landing-info-content"><p>{dialog==="process"?"A página pode explicar como solicitar uma avaliação, quais informações levar e como a clínica organiza as próximas etapas.":"Este espaço pode reunir orientações da equipe e os canais usados para acompanhar o atendimento, conforme cada caso."}</p><Button className="landing-pill" onClick={()=>openBooking(3)}>Experimentar agendamento</Button></div>}
   </DialogContent>
  </Dialog>
 </div>;
}

export function LandingPageDemo(){
 return <div className="landing-model-gallery"><Tabs defaultValue="clinic" className="landing-models"><TabsList className="landing-model-tabs" aria-label="Modelos de landing page"><TabsTrigger value="clinic">Clínica e atendimento</TabsTrigger><TabsTrigger value="portfolio">Portfólio de criador 3D</TabsTrigger></TabsList><TabsContent value="clinic" className="landing-model-panel"><ClinicLandingPageDemo/></TabsContent><TabsContent value="portfolio" className="landing-model-panel"><PortfolioLandingDemo/></TabsContent></Tabs></div>;
}
