"use client";

import {useEffect,useId,useRef,useState,type CSSProperties} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Tabs,TabsList,TabsTrigger,TabsContent} from "@/components/ui/tabs";
import {CoffeeBioDemo} from "@/components/coffee-bio-demo";
import {VirtualBusinessCardDemo} from "@/components/virtual-business-card-demo";

type Screen="home"|"about"|"events"|"sermons"|"contact";
const navigation:[Screen,string][]=[["home","Início"],["about","Sobre"],["events","Encontros"],["sermons","Mensagens"],["contact","Contato"]];
const events=[
 {day:"14",month:"DEZ",title:"Lucas 1 | A história de Zacarias",time:"18h30 às 20h"},
 {day:"21",month:"DEZ",title:"Romanos 15 | Viver para Cristo",time:"8h30 às 10h"},
 {day:"28",month:"DEZ",title:"Romanos 9 | A soberania de Deus",time:"17h30 às 19h"},
 {day:"4",month:"JAN",title:"João 3 | Nascer de novo",time:""}
];
const asset=(name:string)=>`/assets/bio-site/${name}.png`;

// Word wrappers keep natural line breaks; the complete text remains available
// to assistive technology while the visible characters appear in sequence.
function TypedText({text,delay=0,speed=18}:{text:string;delay?:number;speed?:number}){
 let character=0;
 return <span className="bio-typed"><span className="sr-only">{text}</span><span aria-hidden="true">{text.split(/(\s+)/).map((word,index)=>/\s/.test(word)?<span key={index}>{word}</span>:<span className="bio-word" key={index}>{Array.from(word).map((letter,i)=><span className="bio-letter" key={i} style={{"--bio-letter-delay":`${delay+character++*speed}ms`} as CSSProperties}>{letter}</span>)}</span>)}</span></span>;
}

function ChurchHeader({menu,onToggle,menuId,toggleRef}:{menu:boolean;onToggle:()=>void;menuId:string;toggleRef:React.RefObject<HTMLButtonElement|null>}){
 return <div className="bio-church-header"><div className="bio-church-brand"><img src={asset("cross")} width="46" height="46" alt=""/><span><TypedText text="Christ Family Church" speed={12}/></span></div><Button ref={toggleRef} type="button" variant="ghost" className={`bio-menu-toggle ${menu?"is-open":""}`} aria-label={menu?"Fechar menu da demonstração":"Abrir menu da demonstração"} aria-expanded={menu} aria-controls={menuId} onClick={onToggle}><span/><span/><span/></Button></div>;
}

function Phone({initial,index,label}:{initial:Screen;index:number;label:string}){
 const [screen,setScreen]=useState<Screen>(initial),[menu,setMenu]=useState(false),[visible,setVisible]=useState(false),[sermon,setSermon]=useState<number|null>(null),[sent,setSent]=useState(false);
 const slot=useRef<HTMLDivElement>(null),scroll=useRef<HTMLDivElement>(null),toggle=useRef<HTMLButtonElement>(null),menuPanel=useRef<HTMLDivElement>(null),lastScreen=useRef<Screen>(initial);
 const id=useId(),menuId=`bio-menu-${id}`;

 useEffect(()=>{
  const element=slot.current;if(!element)return;
  const measure=()=>element.style.setProperty("--bio-scale",String(Math.min(1,element.clientWidth/379)));
  const resize=new ResizeObserver(measure);resize.observe(element);measure();
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect()}},{threshold:.15});observer.observe(element);
  return()=>{resize.disconnect();observer.disconnect()};
 },[]);

 useEffect(()=>{
  if(lastScreen.current!==screen){scroll.current?.scrollTo({top:0,behavior:"instant"});scroll.current?.querySelector<HTMLElement>("h2")?.focus({preventScroll:true});lastScreen.current=screen}
 },[screen]);

 useEffect(()=>{
  if(!menu)return;
  const panel=menuPanel.current;panel?.querySelector<HTMLButtonElement>("button")?.focus({preventScroll:true});
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closeMenu();return}
  };
  panel?.addEventListener("keydown",keydown);
  return()=>panel?.removeEventListener("keydown",keydown);
 },[menu]);

 function navigate(next:Screen,lecture:number|null=null){
  setScreen(next);setSermon(lecture);setMenu(false);
  requestAnimationFrame(()=>{scroll.current?.scrollTo({top:0,behavior:"instant"});scroll.current?.querySelector<HTMLElement>("h2")?.focus({preventScroll:true})});
 }
 function closeMenu(){setMenu(false);requestAnimationFrame(()=>toggle.current?.focus({preventScroll:true}))}

 return <div className="bio-phone-group"><div ref={slot} className={`bio-phone-slot ${visible?"bio-visible":""}`} style={{"--bio-phone-delay":`${index*130}ms`} as CSSProperties}>
  <div className="bio-phone-shell"><div className="bio-phone-viewport">
   <div ref={scroll} className="bio-phone-scroll" inert={menu} tabIndex={menu?-1:0} aria-label={`Demonstração ${index+1}: ${label}. Conteúdo rolável.`}>
    <div className={`bio-screen bio-screen-${screen}`} key={`${screen}-${sermon??"list"}`}>
     <ChurchHeader menu={false} menuId={menuId} toggleRef={toggle} onToggle={()=>setMenu(true)}/>
     {screen==="about"&&<>
      <div className="bio-member-side"><TypedText text="Anna Miller"/><span><TypedText text="Membro da comunidade" delay={150}/></span></div>
      <img className="bio-portrait" src={asset("portrait")} width="240" height="300" alt="Anna Miller com um livro nas mãos" loading="lazy"/>
      <img className="bio-quote-icon" src={asset("quote")} width="28" height="24" alt=""/>
      <h2 className="bio-testimonial" tabIndex={-1}><TypedText text="Queremos ser uma família em que as pessoas se aproximem e construam amizades em Cristo." delay={180}/></h2>
      <div className="bio-sunday-card"><h3><TypedText text="Culto de domingo" delay={300}/></h3><p><TypedText text="7 de dezembro · 10h às 11h30" delay={400}/></p><Button type="button" variant="ghost" className="bio-more" onClick={()=>navigate("events")}><TypedText text="Saiba mais"/><img src={asset("arrow")} width="22" height="22" alt=""/></Button><img className="bio-card-star" src={asset("star")} width="48" height="48" alt=""/></div>
     </>}
     {screen==="home"&&<>
      <div className="bio-home-photo"><img src={asset("worship")} alt="Luz entrando pelas janelas de uma igreja" width="3026" height="1034" loading="lazy"/></div>
      <img className="bio-avatars" src={asset("avatars")} alt="" width="149" height="53" loading="lazy"/>
      <div className="bio-home-copy"><h2 tabIndex={-1}><TypedText text="Um passo para a luz." delay={100} speed={35}/></h2><p><TypedText text="Descubra fé, esperança e um lugar para pertencer." delay={400}/></p></div>
      <Button type="button" className="bio-cream-cta bio-home-cta" onClick={()=>navigate("contact")}><TypedText text="Venha nos conhecer" delay={650}/><img src={asset("arrow")} width="22" height="22" alt=""/></Button>
     </>}
     {(screen==="events"||screen==="sermons")&&<>
      <div className="bio-events-photo"><img src={asset("preacher")} alt="Pessoas reunidas para ler a Bíblia" width="1230" height="1029" loading="lazy"/></div>
      <Button type="button" className="bio-play" aria-label={sermon===null?"Conhecer a mensagem de Lucas 1":"Voltar à lista de mensagens"} onClick={()=>navigate("sermons",sermon===null?0:null)}><img src={asset("play")} alt="" width="25" height="25"/></Button>
      {sermon===null?<div className="bio-events-body"><h2 tabIndex={-1}><TypedText text={screen==="events"?"Próximos":"Mensagens"} delay={150}/></h2><div className="bio-event-list">{events.map((event,i)=><Button type="button" variant="ghost" className={`bio-event-row ${i===3?"bio-last-event":""}`} key={event.day} onClick={()=>navigate("sermons",i)} aria-label={`Ver ${event.title}`}><span className="bio-date-card"><b><TypedText text={event.day}/></b><span><TypedText text={event.month}/></span></span><span className="bio-event-copy"><span><TypedText text={event.title} delay={250+i*100}/></span>{event.time&&<small><TypedText text={event.time} delay={350+i*100}/></small>}</span></Button>)}</div></div>:<div className="bio-sermon-detail"><p className="bio-small-label"><TypedText text="MENSAGEM · PRÉVIA DEMONSTRATIVA"/></p><h2 tabIndex={-1}><TypedText text={events[sermon].title}/></h2><p><TypedText text="Uma página para reunir mensagens e leituras da comunidade." delay={200}/></p><p className="bio-media-note"><TypedText text="Esta prévia usa uma imagem. O vídeo completo pode ser integrado ao bio site." delay={300}/></p><Button type="button" className="bio-cream-cta" onClick={()=>navigate("sermons")}><TypedText text="Ver todas as mensagens"/></Button></div>}
     </>}
     {screen==="contact"&&<div className="bio-contact-body"><p className="bio-small-label"><TypedText text="FALE COM A COMUNIDADE"/></p><h2 tabIndex={-1}><TypedText text="Vamos conversar." speed={30}/></h2><p><TypedText text="Quer conhecer os encontros ou saber mais? Deixe sua mensagem." delay={200}/></p>{sent?<div className="bio-contact-feedback" role="status"><p>Você concluiu o teste. Nenhuma mensagem foi enviada.</p><Button type="button" className="bio-cream-cta" onClick={()=>setSent(false)}>Experimentar de novo</Button></div>:<form onSubmit={event=>{event.preventDefault();setSent(true)}}><div><Label htmlFor={`${id}-name`}><TypedText text="Seu nome"/></Label><Input id={`${id}-name`} name="name" required maxLength={100} autoComplete="off" placeholder="Como você se chama?"/></div><div><Label htmlFor={`${id}-email`}><TypedText text="Seu e-mail"/></Label><Input id={`${id}-email`} name="email" type="email" required autoComplete="off" placeholder="nome@exemplo.com"/></div><div><Label htmlFor={`${id}-message`}><TypedText text="Mensagem"/></Label><Textarea id={`${id}-message`} name="message" required maxLength={1000} rows={3} placeholder="O que você gostaria de saber?"/></div><Button type="submit" className="bio-cream-cta"><TypedText text="Enviar mensagem de teste"/></Button><p className="bio-form-note"><TypedText text="Formulário demonstrativo. Os dados não são enviados."/></p></form>}</div>}
    </div>
   </div>
   {menu&&<div className="bio-menu-overlay" id={menuId} ref={menuPanel} role="dialog" aria-modal="false" aria-label={`Menu da demonstração ${index+1}`}><ChurchHeader menu menuId={menuId} toggleRef={{current:null}} onToggle={closeMenu}/><nav aria-label="Páginas do bio site">{navigation.map(([destination,title],i)=><Button type="button" variant="ghost" className="bio-nav-link" aria-current={screen===destination?"page":undefined} key={destination} onClick={()=>navigate(destination)}><TypedText text={title} delay={i*50} speed={20}/></Button>)}</nav><Button type="button" className="bio-cream-cta bio-menu-cta" onClick={()=>navigate("contact")}><TypedText text="Venha nos conhecer"/></Button></div>}
   <div className="bio-dynamic-island" aria-hidden="true"/><div className="bio-home-indicator" aria-hidden="true"/>
  </div></div>
 </div><p className="bio-phone-label">0{index+1} / {label}</p></div>;
}

export function InstagramBioDemo(){
 return <section className="instagram-bio-demo" aria-label="Bio site para Instagram: demonstrações interativas"><div className="bio-toolbar"><b>NexFlow <span>/ bio site interativo</span></b><span>MODELOS PARA INSTAGRAM</span></div><Tabs defaultValue="community" className="bio-models"><TabsList className="bio-model-tabs" aria-label="Modelos de bio site"><TabsTrigger value="community">Comunidade</TabsTrigger><TabsTrigger value="coffee">Café e lifestyle</TabsTrigger><TabsTrigger value="business-card">Cartão de visita</TabsTrigger></TabsList><TabsContent value="community" className="bio-model-panel"><div className="bio-showcase"><Phone initial="about" index={0} label="Comunidade"/><Phone initial="home" index={1} label="Apresentação"/><Phone initial="events" index={2} label="Encontros"/></div><div className="bio-caption"><p>Abra os menus dos celulares para explorar o bio site.</p><span>Referência Christ Family Church. Conteúdo demonstrativo em português.</span></div></TabsContent><TabsContent value="coffee" className="bio-model-panel"><CoffeeBioDemo/></TabsContent><TabsContent value="business-card" className="bio-model-panel"><VirtualBusinessCardDemo/></TabsContent></Tabs></section>;
}
