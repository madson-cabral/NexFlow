precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
const float PI=3.14159265359;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
vec3 sheet(vec3 p,float phase){
 p.xy=rot(-.48)*p.xy;
 p.x-=.22*sin(p.y*.8+phase);
 p.z-=.17*cos(p.y*1.1-phase);
 p.xz=rot(p.y*.9+phase+.12*sin(p.y*1.3-phase))*p.xz;
 return p;
}
float scene(vec3 p,float phase){
 vec3 q=sheet(p,phase);
 float a=max(abs(q.z)-.045,abs(q.x)-.74);
 vec3 r=sheet(p+vec3(1.4,.4,1.2),phase+1.1);
 float b=max(abs(r.z)-.027,abs(r.x)-.30);
 return min(a,b)*.65;
}
vec3 normal(vec3 p,float phase){vec2 e=vec2(.001,0.);return normalize(vec3(scene(p+e.xyy,phase)-scene(p-e.xyy,phase),scene(p+e.yxy,phase)-scene(p-e.yxy,phase),scene(p+e.yyx,phase)-scene(p-e.yyx,phase)));}
vec3 studio(vec3 r){
 vec3 col=vec3(.018,.045,.073);
 col+=vec3(.75,.86,.96)*pow(max(0.,dot(r,normalize(vec3(-.65,.6,1.)))),9.);
 col+=vec3(.45,.55,.66)*pow(max(0.,dot(r,normalize(vec3(.8,-.4,.6)))),16.);
 col+=vec3(.0,.58,.62)*pow(max(0.,dot(r,normalize(vec3(1.,.5,-.6)))),7.);
 col+=vec3(.10,.15,.21)*(r.y*.5+.5);
 return col;
}
void main(){
 float phase=u_time*2.*PI/10.;
 vec2 uv=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y;
 vec2 screen=uv;
 uv.x-=.58;
 vec3 ro=vec3(.20*sin(phase),.16*cos(phase),4.6);
 vec3 target=vec3(0.,0.,0.);
 vec3 ww=normalize(target-ro),uu=normalize(cross(ww,vec3(0.,1.,0.))),vv=cross(uu,ww);
 vec3 rd=normalize(uv.x*uu+uv.y*vv+1.5*ww);
 float glow=exp(-3.*length(screen-vec2(.57,.05)));
 vec3 color=vec3(.012,.030,.050)+vec3(.004,.055,.070)*glow;
 float distance=0.;vec3 p=ro;bool hit=false;
 // Preserve the original art and camera. Smaller tracing steps resolve its edges accurately.
 for(int i=0;i<360;i++){p=ro+rd*distance;float d=scene(p,phase);if(d<.00012){hit=true;break;}distance+=max(d*.5,.00003);if(distance>9.)break;}
 if(hit){
  vec3 n=normal(p,phase);if(dot(n,rd)>0.)n=-n;
  vec3 reflection=reflect(rd,n);
  float fresnel=pow(1.-max(0.,dot(-rd,n)),3.);
  float diffuse=max(0.,dot(n,normalize(vec3(-.6,1.,1.))));
  vec3 q=sheet(p,phase);
  float edge=smoothstep(.54,.74,abs(q.x));
  float pulse=pow(.5+.5*sin(p.y*2.2-phase*2.),12.);
  vec3 metal=studio(reflection)*1.65+vec3(.16,.19,.22)*(diffuse*.8+.3);
  metal+=vec3(.04,.13,.18)*fresnel;
  vec3 teal=vec3(.005,.46,.52)*(edge*.85+pulse*.16);
  color=metal+teal;
  color+=vec3(.08,.60,.67)*edge*fresnel;
  color*=.985+.015*sin(p.y*90.+q.x*120.);
  color=mix(color,vec3(.012,.030,.050),smoothstep(5.,9.,distance)*.55);
 }
 float vignette=1.-.22*pow(length(screen)*.8,2.);
 color*=vignette;
 color=1.-exp(-color*1.20);
 color=pow(color,vec3(.80));
 gl_FragColor=vec4(color,1.);
}
