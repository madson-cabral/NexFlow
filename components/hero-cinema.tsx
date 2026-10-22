"use client";
import {useEffect,useRef,useState} from "react";
import {Pause,Play} from "lucide-react";
import {Button} from "@/components/ui/button";

export function HeroCinema({paused=false,showControl=true}:{paused?:boolean;showControl?:boolean}){
 const video=useRef<HTMLVideoElement>(null),root=useRef<HTMLDivElement>(null);
 const syncPlayback=useRef<()=>void>(()=>{});
 const [userPaused,setUserPaused]=useState(false),[playing,setPlaying]=useState(false);
 const [reduced,setReduced]=useState(false),[motionReady,setMotionReady]=useState(false),[available,setAvailable]=useState(true);

 useEffect(()=>{
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  const change=()=>{setReduced(media.matches);setMotionReady(true)};
  change();media.addEventListener("change",change);
  return()=>media.removeEventListener("change",change);
 },[]);

 useEffect(()=>{
  const v=video.current,r=root.current;
  if(!v||!r)return;
  let disposed=false;
  const bounds=r.getBoundingClientRect();
  let inView=bounds.bottom>0&&bounds.top<window.innerHeight;
  const sync=()=>{
   if(disposed)return;
   if(paused||userPaused||reduced||!motionReady||!available||document.hidden||!inView){v.pause();return}
   if(!v.paused)return;
   v.muted=true;
   void v.play().catch((error:unknown)=>{
    // Visibility changes can abort a pending play request without a user pause.
    if(disposed||(error instanceof DOMException&&error.name==="AbortError"))return;
    if(v.paused)setPlaying(false);
   });
  };
  syncPlayback.current=sync;
  const observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;sync()},{threshold:0});
  observer.observe(r);
  document.addEventListener("visibilitychange",sync);
  document.addEventListener("pointerdown",sync,{passive:true});
  document.addEventListener("keydown",sync);
  sync();
  return()=>{
   disposed=true;observer.disconnect();
   document.removeEventListener("visibilitychange",sync);
   document.removeEventListener("pointerdown",sync);
   document.removeEventListener("keydown",sync);
   syncPlayback.current=()=>{};
   v.pause();
  };
 },[paused,userPaused,reduced,motionReady,available]);

 const toggle=()=>{
  const v=video.current;if(!v)return;
  if(playing){setUserPaused(true);v.pause()}
  else{
   setUserPaused(false);v.muted=true;
   void v.play().catch(()=>setPlaying(false));
  }
 };
 return <div ref={root} className={`hero-cinema ${(!playing||reduced)?"is-paused":""} ${!available?"video-unavailable":""}`}>
  <video ref={video} className="cinema-video" autoPlay={!paused&&motionReady&&!reduced&&!userPaused&&available} muted loop playsInline preload={reduced?"none":"auto"} poster="/assets/hero-flow-adapted-poster.jpg" aria-hidden="true" onCanPlay={()=>syncPlayback.current()} onPlaying={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>{setAvailable(false);setPlaying(false)}}>
   <source src="/assets/hero-flow-adapted-mobile.mp4" media="(max-width: 760px)" type="video/mp4"/>
   <source src="/assets/hero-flow-adapted.mp4" type="video/mp4"/>
  </video>
  <div className="cinema-shade"/>
  <svg className="cinema-traces" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true"><path className="trace-base" d="M-50 680H355L530 505H780L1180 105H1350"/><path className="trace-signal" d="M-50 680H355L530 505H780L1180 105H1350"/><path className="trace-base secondary" d="M-100 720H420L610 530H840L1260 110"/><path className="trace-signal secondary" d="M-100 720H420L610 530H840L1260 110"/></svg>
  <div className="cinema-control">{showControl&&available&&motionReady&&!reduced&&<Button variant="ghost" className="motion-toggle" onClick={toggle} aria-label={playing?"Pausar animação do hero":"Reproduzir animação do hero"} aria-pressed={!playing}>{playing?<Pause size={14}/>:<Play size={14}/>}<span>{playing?"Pausar":"Reproduzir"}</span></Button>}</div>
 </div>
}
