// Rounded-rectangle distance in local, unscaled CSS pixels.
export function roundedRectDistance(x:number,y:number,width:number,height:number,radius:number){
 const r=Math.min(Math.max(0,radius),width/2,height/2);
 const qx=Math.abs(x-width/2)-(width/2-r),qy=Math.abs(y-height/2)-(height/2-r);
 return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}

// feDisplacementMap uses R and G around .5; the interior stays neutral.
// Refraction is confined to the inside edge of the rounded rectangle.
export function liquidDisplacementPixels(width:number,height:number,radius:number){
 const w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));
 const pixels=new Uint8ClampedArray(w*h*4),band=Math.max(3,Math.min(12,h*.24));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const px=x+.5,py=y+.5,d=roundedRectDistance(px,py,w,h,radius),i=(y*w+x)*4;
  let nx=0,ny=0,strength=0;
  if(d<=0&&d>-band){
   nx=roundedRectDistance(px+.5,py,w,h,radius)-roundedRectDistance(px-.5,py,w,h,radius);
   ny=roundedRectDistance(px,py+.5,w,h,radius)-roundedRectDistance(px,py-.5,w,h,radius);
   const length=Math.hypot(nx,ny)||1;nx/=length;ny/=length;
   strength=Math.sin(Math.PI*(-d/band))*.82;
  }
  pixels[i]=Math.round(127.5+nx*strength*127.5);pixels[i+1]=Math.round(127.5+ny*strength*127.5);
  pixels[i+2]=128;pixels[i+3]=255;
 }
 return {width:w,height:h,pixels};
}
