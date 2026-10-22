"use client";
import {useLayoutEffect,useRef,type CSSProperties,type ReactNode} from "react";
/** Each panel is a window into one shared image, measured in untransformed layout space. */
export function MosaicGroup({children,className="",image="/assets/ribbon.png",focalX=.72,updateKey=""}:{children:ReactNode,className?:string,image?:string,focalX?:number,updateKey?:string}){
 const root=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const group=root.current;if(!group)return;let disposed=false,raf=0;const picture=new Image();
  const position=()=>{raf=0;if(disposed)return;const width=group.clientWidth,height=group.clientHeight;const iw=picture.naturalWidth||1254,ih=picture.naturalHeight||1254;const scale=Math.max(width/iw,height/ih)*1.07;const sw=iw*scale,sh=ih*scale;const focal=window.matchMedia("(max-width:760px)").matches ? .66 : focalX;
   group.querySelectorAll<HTMLElement>("[data-mask]").forEach(card=>{let x=0,y=0,node:HTMLElement|null=card;while(node&&node!==group){x+=node.offsetLeft;y+=node.offsetTop;node=node.offsetParent as HTMLElement|null}card.style.setProperty("--mask-size",`${sw}px ${sh}px`);card.style.setProperty("--mask-x",`${-x-(sw-width)*focal}px`);card.style.setProperty("--mask-y",`${-y-(sh-height)*.5}px`)});
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(position)};picture.onload=schedule;picture.src=image;position();
  const resize=new ResizeObserver(schedule);resize.observe(group);const cards=Array.from(group.querySelectorAll<HTMLElement>(".mosaic-enter"));group.querySelectorAll<HTMLElement>("[data-mask]").forEach(card=>resize.observe(card));group.classList.add("mosaic-ready");
  cards.forEach((card,i)=>card.style.setProperty("--enter-delay",`${Math.min(i,5)*120}ms`));
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-shown");reveal.unobserve(entry.target)}}),{threshold:.12});cards.forEach(card=>reveal.observe(card));
  window.addEventListener("resize",schedule);void document.fonts.ready.then(schedule);
  return()=>{disposed=true;picture.onload=null;cancelAnimationFrame(raf);resize.disconnect();reveal.disconnect();window.removeEventListener("resize",schedule);group.classList.remove("mosaic-ready")};
 },[image,focalX,updateKey]);
 return <div ref={root} className={`mosaic-group ${className}`} style={{"--mask-bg":`url("${image}")`} as CSSProperties}>{children}</div>
}
