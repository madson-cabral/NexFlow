export type EcommerceScene = "base"|"scene"|"light"|"colorway"|"fullLook";
export type EcommerceBranch = Exclude<EcommerceScene,"base">;
export type EcommerceDirection = "forward"|"reverse";
export type EcommercePlayback = "loading"|"ready"|"starting"|"playing"|"error";
export const ecommerceOptions = [
 {id:"scene",label:"Cenário",video:2},
 {id:"light",label:"Iluminação",video:3},
 {id:"colorway",label:"Roupa",video:1},
 {id:"fullLook",label:"Modelo",video:4},
] as const;
export const ecommerceClips = ecommerceOptions.flatMap(option=>(["forward","reverse"] as const).map(direction=>({
 id:`${option.id}-${direction}`,
 branch:option.id,
 direction,
 src:`https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/video-${option.video}${direction==="reverse"?"-reverse":""}.mp4`,
})));
export const ecommerceBaseClip = "colorway-forward";
export function ecommerceTransitionAllowed(scene:EcommerceScene,playback:EcommercePlayback,branch:EcommerceBranch,direction:EcommerceDirection){
 if(playback!=="ready"&&playback!=="error")return false;
 return direction==="forward"?scene==="base":scene===branch;
}
export function ecommerceHoldTime(duration:number,branch:EcommerceBranch,direction:EcommerceDirection){
 return Math.max(0,duration-(branch==="scene"&&direction==="reverse"?.18:.08));
}
