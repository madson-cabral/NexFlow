import {ecommerceHoldTime,type EcommerceBranch,type EcommerceDirection} from "./ecommerce-scenes";
const abortError=()=>new DOMException("Transição cancelada","AbortError");
function assertLive(signal:AbortSignal){if(signal.aborted)throw abortError()}

/** A deadline counts foreground time only; decoding stops in hidden tabs. */
function foregroundDeadline(reject:(reason:Error)=>void,limit:number){
 let elapsed=0,last=performance.now(),foreground=!document.hidden;
 const accumulate=()=>{const now=performance.now();if(foreground)elapsed+=now-last;last=now};
 const visibility=()=>{accumulate();foreground=!document.hidden};
 document.addEventListener("visibilitychange",visibility);
 const timer=window.setInterval(()=>{
  accumulate();
  if(elapsed>=limit)reject(new Error("O vídeo demorou para responder."));
 },100);
 return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",visibility)};
}

export function seekEcommerceVideo(video:HTMLVideoElement,time:number,signal:AbortSignal){
 assertLive(signal);
 if(Math.abs(video.currentTime-time)<.001&&!video.seeking)return Promise.resolve();
 return new Promise<void>((resolve,reject)=>{
  let done=false;let stop=()=>{};
  const finish=(error?:Error)=>{
   if(done)return;done=true;stop();video.removeEventListener("seeked",seeked);video.removeEventListener("error",failed);signal.removeEventListener("abort",aborted);
   if(error)reject(error);else resolve();
  };
  const seeked=()=>{if(!video.seeking&&video.readyState>=2)finish()};
  const failed=()=>finish(new Error("Não foi possível preparar o vídeo."));
  const aborted=()=>finish(abortError());
  video.addEventListener("seeked",seeked);video.addEventListener("error",failed);signal.addEventListener("abort",aborted,{once:true});
  stop=foregroundDeadline(finish,12000);
  try{video.currentTime=time;seeked()}catch(error){finish(error instanceof Error?error:new Error("Vídeo indisponível."))}
 });
}

/** Register decoding before play(), and reject immediately when playback fails. */
export async function startEcommerceVideo(video:HTMLVideoElement,signal:AbortSignal,timeoutMs=12000){
 assertLive(signal);video.pause();await seekEcommerceVideo(video,0,signal);assertLive(signal);
 const hasFrameCallbacks=typeof video.requestVideoFrameCallback==="function";
 let cancel=()=>{};
 const decoded=new Promise<void>((resolve,reject)=>{
  let done=false,frame=0,raf=0;let stop=()=>{};
  const cleanup=()=>{
   stop();if(frame&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(frame);cancelAnimationFrame(raf);
   video.removeEventListener("playing",playing);video.removeEventListener("error",failed);signal.removeEventListener("abort",aborted);document.removeEventListener("visibilitychange",visibility);
  };
  const finish=(error?:Error)=>{if(done)return;done=true;cleanup();if(error)reject(error);else resolve()};
  cancel=()=>{if(!done){done=true;cleanup()}};
  const valid=(time:number)=>!document.hidden&&video.readyState>=2&&!video.seeking&&time<=.5;
  const poll=()=>{
   if(done)return;
   frame=video.requestVideoFrameCallback((_now,meta)=>{frame=0;if(valid(meta.mediaTime))finish();else poll()});
  };
  const fallback=()=>{
   cancelAnimationFrame(raf);
   raf=requestAnimationFrame(()=>{raf=requestAnimationFrame(()=>{
    if(!done&&valid(video.currentTime)&&!video.paused)finish();
   })});
  };
  const playing=()=>{if(!hasFrameCallbacks)fallback()};
  const failed=()=>finish(new Error("Não foi possível reproduzir esta opção."));
  const aborted=()=>finish(abortError());
  const visibility=()=>{
   if(document.hidden){video.pause();if(video.readyState>=1)video.currentTime=0}
   else void video.play().catch(error=>finish(error instanceof Error?error:new Error("Reprodução indisponível.")));
  };
  video.addEventListener("playing",playing);video.addEventListener("error",failed);signal.addEventListener("abort",aborted,{once:true});document.addEventListener("visibilitychange",visibility);
  stop=foregroundDeadline(finish,timeoutMs);
  if(hasFrameCallbacks)poll();
 });
 try{await Promise.all([video.play(),decoded]);assertLive(signal)}catch(error){video.pause();throw error}finally{cancel()}
}

/** Monitor only the active clip, then keep its valid terminal frame visible. */
export async function holdEcommerceVideo(video:HTMLVideoElement,branch:EcommerceBranch,direction:EcommerceDirection,signal:AbortSignal,onProgress:(time:number)=>void){
 assertLive(signal);
 if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error("A duração do vídeo não está disponível.");
 const hold=ecommerceHoldTime(video.duration,branch,direction);
 const hasFrameCallbacks=typeof video.requestVideoFrameCallback==="function";
 await new Promise<void>((resolve,reject)=>{
  let done=false,frame=0,raf=0;let stop=()=>{};
  const cleanup=()=>{
   stop();if(frame&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(frame);cancelAnimationFrame(raf);
   video.removeEventListener("ended",ended);video.removeEventListener("error",failed);signal.removeEventListener("abort",aborted);document.removeEventListener("visibilitychange",visibility);
  };
  const finish=(error?:Error)=>{if(done)return;done=true;video.pause();cleanup();if(error)reject(error);else resolve()};
  const tick=(time:number)=>{
   if(done)return;onProgress(time);
   if(time>=hold){finish();return}
   if(hasFrameCallbacks)frame=video.requestVideoFrameCallback((_now,meta)=>{frame=0;tick(meta.mediaTime)});
   else raf=requestAnimationFrame(()=>tick(video.currentTime));
  };
  const ended=()=>finish();
  const failed=()=>finish(new Error("A reprodução foi interrompida. Tente novamente."));
  const aborted=()=>finish(abortError());
  const visibility=()=>{if(document.hidden)video.pause();else void video.play().catch(error=>finish(error instanceof Error?error:new Error("Não foi possível continuar.")))};
  video.addEventListener("ended",ended);video.addEventListener("error",failed);signal.addEventListener("abort",aborted,{once:true});document.addEventListener("visibilitychange",visibility);
  stop=foregroundDeadline(finish,(video.duration+12)*1000);tick(video.currentTime);
 });
 assertLive(signal);await seekEcommerceVideo(video,hold,signal);assertLive(signal);
}
