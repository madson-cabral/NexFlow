"""Render the original NexFlow artwork at 4K, then supersample to 1440p.

The camera, surfaces, lighting, palette and 10-second motion are unchanged.
Use --quality-check for five native-resolution inspection frames or --full
to generate both responsive videos and the poster. Requires EGL, Pillow and ffmpeg.
"""
import ctypes as C,ctypes.util,os,subprocess,sys,time
from pathlib import Path
os.environ.setdefault('EGL_PLATFORM','surfaceless')
E=C.CDLL(ctypes.util.find_library('EGL'));G=C.CDLL(ctypes.util.find_library('GL'))
def bind(lib,name,restype,args):
 f=getattr(lib,name);f.restype=restype;f.argtypes=args;return f
ptr=C.c_void_p;I=C.c_int;U=C.c_uint;F=C.c_float;B=C.c_ubyte
bind(E,'eglGetDisplay',ptr,[ptr]);bind(E,'eglInitialize',U,[ptr,C.POINTER(I),C.POINTER(I)]);bind(E,'eglBindAPI',U,[U]);bind(E,'eglChooseConfig',U,[ptr,C.POINTER(I),C.POINTER(ptr),I,C.POINTER(I)]);bind(E,'eglCreatePbufferSurface',ptr,[ptr,ptr,C.POINTER(I)]);bind(E,'eglCreateContext',ptr,[ptr,ptr,ptr,C.POINTER(I)]);bind(E,'eglMakeCurrent',U,[ptr,ptr,ptr,ptr]);bind(E,'eglTerminate',U,[ptr])
w,h=(3840,2160) if ('--full' in sys.argv or '--quality-check' in sys.argv) else (1600,900)
d=E.eglGetDisplay(None);major=I();minor=I();assert E.eglInitialize(d,C.byref(major),C.byref(minor));assert E.eglBindAPI(0x30A2)
attrs=(I*13)(0x3033,1,0x3040,8,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038);cfg=ptr();count=I();assert E.eglChooseConfig(d,attrs,C.byref(cfg),1,C.byref(count)) and count.value
surface=E.eglCreatePbufferSurface(d,cfg,(I*5)(0x3057,w,0x3056,h,0x3038));context=E.eglCreateContext(d,cfg,None,(I*1)(0x3038));assert E.eglMakeCurrent(d,surface,surface,context)
for name,ret,args in [('glCreateShader',U,[U]),('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),C.POINTER(I)]),('glCompileShader',None,[U]),('glGetShaderiv',None,[U,U,C.POINTER(I)]),('glGetShaderInfoLog',None,[U,I,C.POINTER(I),C.c_char_p]),('glCreateProgram',U,[]),('glAttachShader',None,[U,U]),('glLinkProgram',None,[U]),('glGetProgramiv',None,[U,U,C.POINTER(I)]),('glUseProgram',None,[U]),('glGetUniformLocation',I,[U,C.c_char_p]),('glUniform1f',None,[I,F]),('glUniform2f',None,[I,F,F]),('glViewport',None,[I,I,I,I]),('glBegin',None,[U]),('glVertex2f',None,[F,F]),('glEnd',None,[]),('glFinish',None,[]),('glReadPixels',None,[I,I,I,I,U,U,ptr])]:bind(G,name,ret,args)
def shader(kind,source):
 s=G.glCreateShader(kind);v=C.c_char_p(source.encode());G.glShaderSource(s,1,C.byref(v),None);G.glCompileShader(s);ok=I();G.glGetShaderiv(s,0x8B81,C.byref(ok))
 if not ok.value:
  buf=C.create_string_buffer(4096);G.glGetShaderInfoLog(s,4096,None,buf);raise RuntimeError(buf.value.decode())
 return s
frag=Path(__file__).with_name('flow.frag').read_text().replace('precision highp float;','')
program=G.glCreateProgram();G.glAttachShader(program,shader(0x8B31,'#version 120\nvoid main(){gl_Position=gl_Vertex;}'));G.glAttachShader(program,shader(0x8B30,'#version 120\n'+frag));G.glLinkProgram(program);ok=I();G.glGetProgramiv(program,0x8B82,C.byref(ok));assert ok.value;G.glUseProgram(program);G.glViewport(0,0,w,h);G.glUniform2f(G.glGetUniformLocation(program,b'u_resolution'),w,h);time_loc=G.glGetUniformLocation(program,b'u_time');pixels=(B*(w*h*3))()
def frame(t):
 G.glUniform1f(time_loc,t);G.glBegin(0x0007)
 for x,y in [(-1,-1),(1,-1),(1,1),(-1,1)]:G.glVertex2f(x,y)
 G.glEnd();G.glFinish();G.glReadPixels(0,0,w,h,0x1907,0x1401,pixels);return bytes(pixels)
from PIL import Image
output=Path(os.environ.get('NEXFLOW_PREVIEW_DIR','/tmp/nexflow-original-quality'));output.mkdir(parents=True,exist_ok=True)
if '--full' not in sys.argv:
 start=time.time()
 for t in [0,2.5,5,7.5,10]:
  Image.frombytes('RGB',(w,h),frame(t)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(output/f'frame-{t}.png')
  print(f'Checked {t}s ({time.time()-start:.1f}s)',flush=True)
 print('Original artwork quality check ready:',output,flush=True)
else:
 target=Path(__file__).resolve().parent.parent/'public/assets/hero-flow-original-hq.mp4'
 command=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{w}x{h}','-framerate','30','-i','-','-vf','vflip,scale=2560:1440:flags=lanczos:out_color_matrix=bt709','-c:v','libx264','-preset','medium','-crf','17','-threads','3','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-pix_fmt','yuv420p','-movflags','+faststart','-an',str(target)]
 process=subprocess.Popen(command,stdin=subprocess.PIPE);start=time.time()
 for i in range(300):
  data=frame(i/30);process.stdin.write(data)
  if i==0:Image.frombytes('RGB',(w,h),data).transpose(Image.Transpose.FLIP_TOP_BOTTOM).resize((2560,1440),Image.Resampling.LANCZOS).save(target.with_name('hero-flow-original-poster.jpg'),quality=94)
  if i%30==0:print(f'Rendered {i}/300 frames ({time.time()-start:.0f}s)',flush=True)
 process.stdin.close();assert process.wait()==0
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(target),'-vf','scale=1280:720:flags=lanczos','-c:v','libx264','-preset','medium','-crf','18','-threads','3','-pix_fmt','yuv420p','-movflags','+faststart','-an',str(target.with_name('hero-flow-original-mobile.mp4'))],check=True)
 print('Original artwork desktop and mobile loops ready:',target,flush=True)
E.eglTerminate(d)
