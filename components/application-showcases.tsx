"use client";

import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs,TabsContent,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {Progress} from "@/components/ui/progress";
import {Dialog,DialogClose,DialogContent,DialogDescription,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import {advanceOperation,operationLabels,operationSummary,searchOperations,seedOperations,type OperationRecord,type OperationType} from "@/lib/operational-demo";

const examples=[{type:"portal" as const,title:"Portal de atendimento",kind:"APLICATIVO WEB",text:"Um espaço para o cliente acompanhar solicitações e próximos passos.",detail:"Selecione uma solicitação, acompanhe as etapas e experimente criar um novo pedido."},{type:"system" as const,title:"Gestão da operação",kind:"SISTEMA WEB",text:"Uma visão organizada do trabalho que passa pela equipe.",detail:"Selecione uma tarefa, avance a etapa e acompanhe a atualização do painel."}];
type View="overview"|"records"|"team"|"history";
type DemoModel={type:OperationType,records:OperationRecord[],selected:string,view:View,query:string,creating:boolean,title:string,running:boolean,notice:string,setView:(view:View)=>void,setQuery:(query:string)=>void,setCreating:(creating:boolean)=>void,setTitle:(title:string)=>void,select:(id:string)=>void,advance:()=>void,create:()=>void,play:()=>void,reset:()=>void};

function DemoIcon({name}:{name:"play"|"pause"|"search"|"expand"|"check"|"reset"}){
 const paths={play:"M9 5l10 7-10 7V5Z",pause:"M8 5v14M16 5v14",search:"M21 21l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",expand:"M9 3H3v6M15 3h6v6M21 15v6h-6M9 21H3v-6",check:"M5 12l4 4L19 6",reset:"M4 10a8 8 0 1 1 1 8M4 4v6h6"};
 return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d={paths[name]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function OperationsSurface({model,prefix}:{model:DemoModel,prefix:string}){
 const {type,records,selected,view,query,creating,title,running,notice}=model;
 const summary=operationSummary(records),labels=operationLabels(type),record=records.find(item=>item.id===selected)||records[0];
 const visible=searchOperations(records,query);
 const row=(item:OperationRecord)=><button className={`ops-record ${item.id===selected?"is-selected":""}`} key={item.id} onClick={()=>model.select(item.id)} aria-pressed={item.id===selected}><span className="ops-record-symbol" aria-hidden="true">{item.step===2?<DemoIcon name="check"/>:item.id.slice(-2)}</span><span><strong>{item.title}</strong><small>{item.id} · {item.team}</small></span><em className={`ops-status ops-status-${item.step}`}>{labels[item.step]}</em></button>;
 const detail=<div className="ops-detail"><div className="ops-detail-heading"><span>{record.id}</span><em className={`ops-status ops-status-${record.step}`}>{labels[record.step]}</em></div><h5>{record.title}</h5><p>{record.description}</p><div className="ops-timeline" aria-label={`Etapa atual: ${labels[record.step]}`}><Progress value={record.step/2*100} aria-label={`Progresso de ${record.title}`}/>{labels.map((label,index)=><div className={index<=record.step?"is-done":""} key={label}><span>{index<record.step?<DemoIcon name="check"/>:String(index+1).padStart(2,"0")}</span><small>{label}</small></div>)}</div><div className="ops-detail-bottom"><span>Responsável<br/><b>{record.team}</b></span><Button className="ops-advance" onClick={model.advance} disabled={record.step===2||running}>{record.step===2?"Etapas concluídas":"Avançar etapa"}</Button></div></div>;
 return <div className={`ops-screen ops-${type} ${running?"ops-is-running":""}`}>
  <div className="ops-app-bar"><span><b>NexFlow</b><small>/ demonstração</small></span><span className="ops-avatar" aria-hidden="true">NF</span></div>
  <div className="ops-screen-content">
   <div className="ops-screen-heading"><div><p>{type==="portal"?"ÁREA DO CLIENTE":"PAINEL DA EQUIPE"}</p><h4>{type==="portal"?"Meu atendimento":"Sua operação"}</h4></div><Button className="ops-new" variant="outline" disabled={running} onClick={()=>model.setCreating(!creating)} aria-expanded={creating} aria-controls={`${prefix}-create`}>{creating?"Cancelar":type==="portal"?"Nova solicitação":"Nova atividade"}</Button></div>
   {creating&&<form id={`${prefix}-create`} className="ops-create" onSubmit={event=>{event.preventDefault();if(title.trim().length>=3)model.create();else{const input=event.currentTarget.querySelector("input");input?.setCustomValidity("Descreva o pedido com pelo menos três caracteres.");input?.reportValidity();}}}><Label htmlFor={`${prefix}-title`}>{type==="portal"?"O que você precisa?":"Qual atividade deseja organizar?"}</Label><div><Input id={`${prefix}-title`} value={title} onChange={event=>{event.currentTarget.setCustomValidity("");model.setTitle(event.target.value);}} minLength={3} maxLength={70} pattern=".*\S.*" required placeholder={type==="portal"?"Ex.: atualizar meu cadastro":"Ex.: conferir documentos"}/><Button type="submit" className="ops-advance">Adicionar</Button></div><p>Um registro de exemplo será criado somente nesta demonstração.</p></form>}
   <div className="ops-summary" aria-label="Resumo da demonstração"><div><small>{type==="portal"?"Em aberto":"A fazer e em andamento"}</small><strong key={`open-${summary.open}`}>{String(summary.open).padStart(2,"0")}</strong></div><div><small>{labels[1]}</small><strong key={`progress-${summary.inProgress}`}>{String(summary.inProgress).padStart(2,"0")}</strong></div><div className="ops-summary-complete"><small>Concluídas</small><strong key={`complete-${summary.completed}`}>{String(summary.completed).padStart(2,"0")}</strong></div></div>
   <Tabs value={view} onValueChange={value=>model.setView(value as View)} className="ops-tabs">
    <TabsList className="ops-tabs-list" aria-label={type==="portal"?"Áreas do portal demonstrativo":"Áreas do painel demonstrativo"}>{[["overview",type==="portal"?"Visão geral":"Painel"],["records",type==="portal"?"Solicitações":"Atividades"],["team","Equipe"],["history","Histórico"]].map(([value,text])=><TabsTrigger value={value} key={value}>{text}</TabsTrigger>)}</TabsList>
    <TabsContent value="overview" className="ops-view">
     {type==="portal"?<div className="ops-overview"><div className="ops-record-list"><div className="ops-section-label">Últimas solicitações <span>{records.length}</span></div>{records.slice(0,3).map(row)}</div>{detail}</div>:<><div className="ops-board" aria-label="Atividades organizadas por etapa">{labels.map((label,index)=><div className="ops-board-column" key={label}><div><h5>{label}</h5><span>{records.filter(item=>item.step===index).length}</span></div><div className="ops-board-stack">{records.filter(item=>item.step===index).slice(0,3).map(item=><button className={`ops-task ${item.id===selected?"is-selected":""}`} key={item.id} onClick={()=>model.select(item.id)} aria-pressed={item.id===selected}><small>{item.id}</small><strong>{item.title}</strong><span>{item.team}</span>{item.step===2&&<DemoIcon name="check"/>}</button>)}{!records.some(item=>item.step===index)&&<p className="ops-column-empty">Nenhuma atividade nesta etapa.</p>}</div></div>)}</div>{detail}</>}
    </TabsContent>
    <TabsContent value="records" className="ops-view"><div className="ops-search"><DemoIcon name="search"/><Input value={query} onChange={event=>model.setQuery(event.target.value)} aria-label={type==="portal"?"Buscar solicitação":"Buscar atividade"} placeholder={type==="portal"?"Buscar solicitação…":"Buscar atividade…"}/></div><div className="ops-list-scroll">{visible.map(row)}{visible.length===0&&<p className="ops-empty">Nenhum registro corresponde à busca.</p>}</div>{detail}</TabsContent>
    <TabsContent value="team" className="ops-view"><div className="ops-team-grid">{["Atendimento","Operação"].map(team=>{const assigned=records.filter(item=>item.team===team),done=assigned.filter(item=>item.step===2).length;return <div className="ops-team" key={team}><span>{team==="Atendimento"?"AT":"OP"}</span><h5>{team}</h5><p>{assigned.length} registros · {done} concluídos</p><Progress value={assigned.length?done/assigned.length*100:0} aria-label={`Conclusão dos registros da equipe de ${team}`}/><Button variant="ghost" onClick={()=>{model.setQuery(team);model.setView("records");}}>Ver registros</Button></div>;})}</div><div className="ops-team-note"><span>EQUIPES DEMONSTRATIVAS</span><p>Cada registro tem um responsável e uma etapa visível.</p></div></TabsContent>
    <TabsContent value="history" className="ops-view"><div className="ops-section-label">Registros concluídos <span>{summary.completed}</span></div><div className="ops-list-scroll">{records.filter(item=>item.step===2).map(row)}{summary.completed===0&&<p className="ops-empty">As atividades concluídas aparecerão aqui.</p>}</div><p className="ops-history-note">Avance as etapas de um registro para acompanhar sua entrada no histórico.</p></TabsContent>
   </Tabs>
   <div className="ops-feedback" role="status" aria-live="polite"><span className={running?"is-pulsing":""} aria-hidden="true">{running?<DemoIcon name="play"/>:<DemoIcon name="check"/>}</span><p>{notice||"Selecione um registro e experimente avançar uma etapa."}</p></div>
  </div>
  <div className="ops-playback"><Button className="ops-play" onClick={model.play} aria-pressed={running}><DemoIcon name={running?"pause":"play"}/>{running?"Pausar fluxo":"Reproduzir fluxo"}</Button><Button variant="ghost" className="ops-reset" onClick={model.reset}><DemoIcon name="reset"/><span>Reiniciar</span></Button></div>
 </div>;
}

function ApplicationExample({example,onContact}:{example:typeof examples[number],onContact:(title:string)=>void}){
 const root=useRef<HTMLElement>(null),scene=useRef<HTMLDivElement>(null),timers=useRef<number[]>([]),nextId=useRef(107),pointerFrame=useRef(0);
 const [records,setRecords]=useState(()=>seedOperations(example.type)),[selected,setSelected]=useState("NF-101"),[view,setView]=useState<View>("overview"),[query,setQuery]=useState(""),[creating,setCreating]=useState(false),[title,setTitle]=useState(""),[running,setRunning]=useState(false),[notice,setNotice]=useState(""),[expanded,setExpanded]=useState(false);
 const stop=()=>{timers.current.forEach(timer=>window.clearTimeout(timer));timers.current=[];setRunning(false);};
 const select=(id:string)=>{stop();setSelected(id);setNotice("");};
 const advance=()=>{setRecords(current=>advanceOperation(current,selected));setNotice("Etapa atualizada. O painel e o histórico acompanham a mudança.");};
 const create=()=>{const id=`NF-${nextId.current++}`;setRecords(current=>[{id,title:title.trim(),description:"Registro criado para experimentar o fluxo da demonstração.",step:0,team:"Atendimento"},...current]);setSelected(id);setTitle("");setCreating(false);setView("overview");setQuery("");setNotice("Registro adicionado. Selecione Avançar etapa para continuar.");};
 const reset=()=>{stop();setRecords(seedOperations(example.type));setSelected("NF-101");nextId.current=107;setView("overview");setQuery("");setCreating(false);setTitle("");setNotice("Demonstração reiniciada.");};
 const play=()=>{
  if(running){stop();setNotice("Fluxo pausado. Você pode continuar manualmente.");return;}
  stop();setCreating(false);setView("overview");setRunning(true);setNotice("Recebendo e organizando o registro…");
  setRecords(current=>current.map(item=>item.id===selected?{...item,step:0}:item));
  timers.current=[window.setTimeout(()=>{setRecords(current=>advanceOperation(current,selected));setNotice(example.type==="portal"?"Solicitação encaminhada para análise.":"Atividade em andamento com a equipe responsável.");},950),window.setTimeout(()=>{setRecords(current=>advanceOperation(current,selected));setNotice("Fluxo concluído. Consulte o resultado no histórico.");setRunning(false);timers.current=[];},2100)];
 };
 const model:DemoModel={type:example.type,records,selected,view,query,creating,title,running,notice,setView,setQuery,setCreating,setTitle,select,advance,create,play,reset};
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{element.classList.toggle("ops-in-view",entry.isIntersecting);if(entry.isIntersecting&&!reduced.matches)element.classList.add("ops-arrived");if(!entry.isIntersecting){timers.current.forEach(timer=>window.clearTimeout(timer));timers.current=[];setRunning(false);}}),{threshold:.04});observer.observe(element);
  return()=>{observer.disconnect();timers.current.forEach(timer=>window.clearTimeout(timer));cancelAnimationFrame(pointerFrame.current);};
 },[]);
 function reflect(event:React.PointerEvent<HTMLDivElement>){
  if(event.pointerType!=="mouse"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const element=scene.current;if(!element)return;
  const rect=element.getBoundingClientRect(),x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
  cancelAnimationFrame(pointerFrame.current);pointerFrame.current=requestAnimationFrame(()=>{element.style.setProperty("--ops-light-x",`${x*100}%`);element.style.setProperty("--ops-light-y",`${y*100}%`);element.style.setProperty("--ops-rotate-x",`${(y-.5)*-2.5}deg`);element.style.setProperty("--ops-rotate-y",`${(x-.5)*3}deg`);});
 }
 function clearReflection(){cancelAnimationFrame(pointerFrame.current);scene.current?.style.setProperty("--ops-rotate-x","0deg");scene.current?.style.setProperty("--ops-rotate-y","0deg");}
 return <article className={`example interactive-example mosaic-enter ops-example-${example.type}`} ref={root}>
  <div className="example-preview operational-preview" data-mask><div className="ops-demo-label"><span>DEMONSTRAÇÃO INTERATIVA</span><small>DADOS FICTÍCIOS</small></div><div className="ops-scene" ref={scene} onPointerMove={reflect} onPointerLeave={clearReflection}><OperationsSurface model={model} prefix={`example-${example.type}`}/></div><div className="ops-frame-bottom"><span className="ops-flow-line" aria-hidden="true"><i/><i/><i/></span><Button variant="ghost" className="ops-expand" onClick={()=>setExpanded(true)}><DemoIcon name="expand"/>Ampliar demonstração</Button></div></div>
  <div className="example-description"><span className="eyebrow dark">{example.kind}</span><h3>{example.title}</h3><p>{example.text}</p><span className="ops-instruction">{example.type==="portal"?"Crie um pedido e acompanhe suas etapas.":"Mova uma atividade e veja o painel se atualizar."}</span></div>
  <Dialog open={expanded} onOpenChange={open=>{setExpanded(open);if(!open){stop();if(running)setNotice("Fluxo pausado. Você pode continuar manualmente.");}}}><DialogContent className="operations-dialog" showCloseButton={false}><DialogClose className="ops-dialog-close" aria-label="Fechar demonstração">×</DialogClose><DialogHeader><DialogTitle>{example.title}</DialogTitle><DialogDescription>{example.detail}</DialogDescription></DialogHeader><div className="ops-expanded-surface"><OperationsSurface model={model} prefix={`expanded-${example.type}`}/></div><div className="ops-dialog-footer"><p>Dados fictícios. Alterações ficam somente nesta demonstração.</p><Button className="cta primary" asChild><a href="#contato" onClick={()=>{stop();setExpanded(false);onContact(example.type==="portal"?"Aplicativos web":"Sistemas web");}}>Conversar sobre uma solução</a></Button></div></DialogContent></Dialog>
 </article>;
}

export function ApplicationShowcases({onContact}:{onContact:(title:string)=>void}){return <div className="application-grid">{examples.map(example=><ApplicationExample key={example.type} example={example} onContact={onContact}/>)}</div>;}
