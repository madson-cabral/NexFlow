"use client";

import {useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent} from "react";
import {Bar, BarChart, CartesianGrid, XAxis, YAxis} from "recharts";
import {Bell, BriefcaseBusiness, Check, CheckCheck, Clock3, Expand, FileStack, FolderKanban, LayoutDashboard, ListTodo, Pause, Play, Plus, RotateCcw, Search, Settings2, Users, X, ChartNoAxesCombined, Boxes} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import {Checkbox} from "@/components/ui/checkbox";
import {Switch} from "@/components/ui/switch";
import {Progress} from "@/components/ui/progress";
import {ChartContainer, ChartTooltip, ChartTooltipContent} from "@/components/ui/chart";
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider} from "@/components/ui/sidebar";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {changeProjectStatus, filterProjects, makeProjectTasks, projectCompletion, projectDate, projectMembers, projectStatusLabels, projectSummary, seedProjects, toggleProjectTask, type DemoProject, type ProjectStatus} from "@/lib/project-dashboard-demo";

type View = "overview" | "projects" | "tasks" | "analytics" | "time" | "resources" | "team" | "templates" | "settings";
type Draft = {name: string; owner: string; due: string; status: ProjectStatus};
type TimeEntry = {id: number; project: string; milliseconds: number};
const navigation = [
  {id: "overview", label: "Visão geral", Icon: LayoutDashboard}, {id: "projects", label: "Projetos", Icon: BriefcaseBusiness},
  {id: "tasks", label: "Tarefas", Icon: ListTodo}, {id: "analytics", label: "Análises", Icon: ChartNoAxesCombined},
  {id: "time", label: "Tempo", Icon: Clock3}, {id: "resources", label: "Recursos", Icon: Boxes},
  {id: "team", label: "Equipe", Icon: Users}, {id: "templates", label: "Modelos", Icon: FileStack},
] as const;
const emptyDraft = (): Draft => ({name: "", owner: projectMembers[0].id, due: "2026-11-02", status: "pending"});
const initials = (name: string) => name.split(" ").map(part => part[0]).slice(0, 2).join("");
const duration = (milliseconds: number) => {const seconds = Math.floor(milliseconds / 1000); return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, "0")).join(":")};

function MetricNumber({value, animate}: {value: number; animate: boolean}) {
  const current = useRef(0), [display, setDisplay] = useState(value);
  useEffect(() => {
    if (!animate) {setDisplay(value); return}
    const from = current.current, start = performance.now(); let frame = 0;
    const tick = (now: number) => {const p = Math.min(1, (now - start) / 800); current.current = Math.round(from + (value - from) * (1 - (1 - p) ** 3)); setDisplay(current.current); if (p < 1) frame = requestAnimationFrame(tick)};
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [value, animate]);
  return <><span aria-hidden="true">{display.toLocaleString("pt-BR")}</span><span className="sr-only">{value.toLocaleString("pt-BR")}</span></>;
}

function MetricRing({value, color}: {value: number; color: string}) {
  return <svg className="proj-metric-ring" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeOpacity=".13" strokeWidth="6"/><circle className="proj-ring-value" cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="6" pathLength="100" strokeDasharray={`${value} 100`} transform="rotate(-90 26 26)" strokeLinecap="round"/><circle cx="26" cy="26" r="3" fill={color}/></svg>;
}

export function ProjectDashboardDemo() {
  const [projects, setProjects] = useState(seedProjects), [view, setView] = useState<View>("overview"), [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all"), [statusFilter, setStatusFilter] = useState("all"), [month, setMonth] = useState("all"), [taskProject, setTaskProject] = useState("PR-009");
  const [editorOpen, setEditorOpen] = useState(false), [editing, setEditing] = useState<string | null>(null), [draft, setDraft] = useState<Draft>(emptyDraft);
  const [expanded, setExpanded] = useState(false), [notifications, setNotifications] = useState(false), [notice, setNotice] = useState("");
  const [visible, setVisible] = useState(false), [documentVisible, setDocumentVisible] = useState(true), [reduced, setReduced] = useState(false), [motion, setMotion] = useState(true), [playing, setPlaying] = useState(true), [spotlight, setSpotlight] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false), [timerStarted, setTimerStarted] = useState(0), [timerAccumulated, setTimerAccumulated] = useState(0), [timerNow, setTimerNow] = useState(0), [timerProject, setTimerProject] = useState("PR-009"), [sessions, setSessions] = useState<TimeEntry[]>([]);
  const root = useRef<HTMLDivElement>(null), scene = useRef<HTMLDivElement>(null), main = useRef<HTMLElement>(null), editorTrigger = useRef<HTMLButtonElement | null>(null), expandTrigger = useRef<HTMLButtonElement | null>(null), pointerFrame = useRef(0), nextId = useRef(25), nextSession = useRef(1);
  const prefix = `proj-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const filtered = filterProjects(projects, query, ownerFilter, statusFilter).filter(project => month === "all" || project.due.slice(0, 7) === month);
  const summary = projectSummary(filtered), selectedTaskProject = projects.find(project => project.id === taskProject) || projects[0], editingProject = projects.find(project => project.id === editing);
  const contributors = projectMembers.filter(member => filtered.some(project => project.owner === member.id));
  const elapsed = timerAccumulated + (timerRunning ? Math.max(0, timerNow - timerStarted) : 0);
  const animate = visible && motion && !reduced;
  const workload = ["Produto", "Design", "Desenvolvimento"].map(team => ({team, open: filtered.filter(project => projectMembers.find(member => member.id === project.owner)?.team === team).reduce((total, project) => total + project.tasks.filter(task => !task.completed).length, 0)}));

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {setReduced(preference.matches); if (preference.matches) setPlaying(false)};
    const visibility = () => setDocumentVisible(!document.hidden); sync(); visibility();
    preference.addEventListener("change", sync); document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)), {threshold: .03});
    if (root.current) observer.observe(root.current);
    return () => {observer.disconnect(); preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", visibility); cancelAnimationFrame(pointerFrame.current)};
  }, []);
  useEffect(() => {
    if (!playing || !animate || !documentVisible || editorOpen || expanded || view !== "overview") return;
    const timer = window.setInterval(() => setSpotlight(current => (current + 1) % 4), 3200); return () => window.clearInterval(timer);
  }, [playing, animate, documentVisible, editorOpen, expanded, view]);
  useEffect(() => {
    if (!playing || !animate || !documentVisible || editorOpen || expanded || view !== "overview") return;
    const container = main.current, panel = container?.querySelector<HTMLElement>(".proj-spotlight");
    if (container && panel) container.scrollTo({top: Math.max(0, container.scrollTop + panel.getBoundingClientRect().top - container.getBoundingClientRect().top - 20), behavior: "smooth"});
  }, [spotlight, playing, animate, documentVisible, editorOpen, expanded, view]);
  useEffect(() => {
    if (!timerRunning || !visible || !documentVisible) return;
    setTimerNow(Date.now()); const timer = window.setInterval(() => setTimerNow(Date.now()), 1000); return () => window.clearInterval(timer);
  }, [timerRunning, visible, documentVisible]);

  function clearFilters() {setQuery(""); setOwnerFilter("all"); setStatusFilter("all"); setMonth("all")}
  function navigate(next: View) {setView(next); setPlaying(false); setNotifications(false); setNotice(""); main.current?.scrollTo({top: 0, behavior: "auto"})}
  function openEditor(project: DemoProject | null, button: HTMLButtonElement, template = "") {
    editorTrigger.current = button; setPlaying(false); setEditing(project?.id || null);
    setDraft(project ? {name: project.name, owner: project.owner, due: project.due, status: project.status} : {...emptyDraft(), name: template}); setEditorOpen(true);
  }
  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const name = draft.name.trim();
    if (name.length < 3) {const input = event.currentTarget.querySelector<HTMLInputElement>("input"); input?.setCustomValidity("Use pelo menos três caracteres no nome do projeto."); input?.reportValidity(); return}
    if (!projectMembers.some(member => member.id === draft.owner) || !/^\d{4}-\d{2}-\d{2}$/.test(draft.due)) return;
    if (editing) {setProjects(current => current.map(project => project.id === editing ? changeProjectStatus({...project, name, owner: draft.owner, due: draft.due}, draft.status) : project)); setNotice("Projeto atualizado. Os indicadores acompanham a alteração.")}
    else {const id = `PR-${String(nextId.current++).padStart(3, "0")}`; setProjects(current => [...current, changeProjectStatus({id, ...draft, name, tasks: makeProjectTasks(id)}, draft.status)]); setTaskProject(id); clearFilters(); setNotice("Projeto criado. As cinco etapas estão disponíveis em Tarefas.")}
    setEditorOpen(false);
  }
  function toggleTask(projectId: string, taskId: string) {
    const next = toggleProjectTask(projects, projectId, taskId); setProjects(next); setPlaying(false);
    if (editing === projectId) {const project = next.find(item => item.id === projectId); if (project) setDraft(current => ({...current, status: project.status}))}
    setNotice("Tarefa atualizada. Progresso, totais e status foram recalculados.");
  }
  function toggleTimer() {
    const now = Date.now();
    if (timerRunning) {setTimerAccumulated(current => current + now - timerStarted); setTimerRunning(false)}
    else {setTimerStarted(now); setTimerNow(now); setTimerRunning(true)}
  }
  function reset() {
    setProjects(seedProjects()); nextId.current = 25; nextSession.current = 1; clearFilters(); setTaskProject("PR-009"); setEditorOpen(false); setTimerRunning(false); setTimerStarted(0); setTimerAccumulated(0); setTimerNow(0); setTimerProject("PR-009"); setSessions([]); navigate("overview"); setNotice("Demonstração reiniciada.");
  }
  function reflect(event: PointerEvent<HTMLDivElement>) {
    if (!animate || expanded || event.pointerType !== "mouse") return;
    const element = scene.current; if (!element) return; const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    cancelAnimationFrame(pointerFrame.current); pointerFrame.current = requestAnimationFrame(() => {element.style.setProperty("--proj-rotate-x", `${(.5 - y) * 1.2}deg`); element.style.setProperty("--proj-rotate-y", `${(x - .5) * 1.5}deg`)});
  }
  function clearReflection() {cancelAnimationFrame(pointerFrame.current); scene.current?.style.setProperty("--proj-rotate-x", "0deg"); scene.current?.style.setProperty("--proj-rotate-y", "0deg")}

  function projectTable(compact = false) {
    const records = compact ? filtered.slice(-4).reverse() : filtered;
    return records.length ? <div className="proj-table"><Table><TableHeader><TableRow><TableHead>Projeto</TableHead><TableHead className="proj-table-extra">Responsável</TableHead><TableHead className="proj-table-extra">Entrega</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{records.map(project => {const owner = projectMembers.find(member => member.id === project.owner)!; return <TableRow key={project.id}><TableCell><Button variant="ghost" className="proj-project-link" onClick={event => openEditor(project, event.currentTarget)}><span className="proj-project-symbol"><FolderKanban size={17}/></span><span><strong>{project.name}</strong><small>{project.id}<span className="proj-mobile-project-meta"> · {owner.name} · {projectDate(project.due)}</span></small></span></Button></TableCell><TableCell className="proj-table-extra">{owner.name}</TableCell><TableCell className="proj-table-extra">{projectDate(project.due)}</TableCell><TableCell><span className={`proj-status proj-status-${project.status}`}>{projectStatusLabels[project.status]}</span></TableCell></TableRow>})}</TableBody></Table></div> : <div className="proj-empty"><Search size={28}/><p>Nenhum projeto corresponde a esses filtros.</p><Button variant="outline" onClick={clearFilters}>Limpar filtros</Button></div>;
  }
  function taskList(project: DemoProject, compact = false, scope = "workspace") {
    const tasks = compact ? project.tasks.slice(-3) : project.tasks;
    return <ul className="proj-task-list">{tasks.map(task => <li className={task.completed ? "is-complete" : ""} key={task.id}><Checkbox id={`${prefix}-${scope}-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTask(project.id, task.id)}/><Label htmlFor={`${prefix}-${scope}-${task.id}`}><span>{task.title}</span><small>{project.name}</small></Label><span className="proj-task-state">{task.completed ? <Check size={17} aria-label="Concluída"/> : "A fazer"}</span></li>)}</ul>;
  }
  const filters = <div className="proj-filters"><Label className="sr-only" htmlFor={`${prefix}-owner`}>Filtrar responsável</Label><NativeSelect id={`${prefix}-owner`} value={ownerFilter} onChange={event => {setOwnerFilter(event.target.value); setPlaying(false)}}><NativeSelectOption value="all">Responsável</NativeSelectOption>{projectMembers.map(member => <NativeSelectOption key={member.id} value={member.id}>{member.name}</NativeSelectOption>)}</NativeSelect><Label className="sr-only" htmlFor={`${prefix}-status`}>Filtrar status</Label><NativeSelect id={`${prefix}-status`} value={statusFilter} onChange={event => {setStatusFilter(event.target.value); setPlaying(false)}}><NativeSelectOption value="all">Todos os status</NativeSelectOption>{Object.entries(projectStatusLabels).map(([value, label]) => <NativeSelectOption value={value} key={value}>{label}</NativeSelectOption>)}</NativeSelect>{(query || ownerFilter !== "all" || statusFilter !== "all" || month !== "all") && <Button variant="ghost" onClick={clearFilters}>Limpar</Button>}</div>;

  const metrics = <div className={`proj-metrics ${playing && spotlight === 0 ? "proj-spotlight" : ""}`}>{[
    {label: "Projetos", value: summary.total, ring: summary.total ? 100 : 0, color: "#6350ed"}, {label: "Em andamento", value: summary.active, ring: summary.total ? summary.active / summary.total * 100 : 0, color: "#ed8396"},
    {label: "Tarefas concluídas", value: summary.completedTasks, ring: summary.progress, color: "#36bca2"}, {label: "Pessoas envolvidas", value: contributors.length, ring: contributors.length / projectMembers.length * 100, color: "#b875da"},
  ].map(metric => <article className="proj-metric proj-panel" key={metric.label}><MetricRing value={metric.ring} color={metric.color}/><div><span>{metric.label}</span><strong><MetricNumber value={metric.value} animate={animate}/></strong></div></article>)}</div>;
  const gauge = <article className={`proj-panel proj-gauge ${playing && spotlight === 2 ? "proj-spotlight" : ""}`}><header><h4>Progresso dos projetos</h4><ChartNoAxesCombined size={18}/></header><div className="proj-gauge-art"><svg viewBox="0 0 280 180" role="img" aria-label={`${summary.progress}% das tarefas concluídas`}><path d="M30 140 A110 110 0 0 1 250 140" fill="none" stroke="#e3e2ec" strokeWidth="17" strokeLinecap="round"/><path className="proj-gauge-fill" d="M30 140 A110 110 0 0 1 250 140" fill="none" stroke="#6350ed" strokeWidth="17" strokeLinecap="round" pathLength="100" strokeDasharray={`${summary.progress} 100`}/><g className="proj-gauge-needle" transform={`rotate(${summary.progress * 1.8} 140 140)`}><path d="M140 147 L52 140 L140 133 Z" fill="#6350ed"/><circle cx="140" cy="140" r="9" fill="#6350ed"/><circle cx="140" cy="140" r="3.5" fill="white"/></g><text x="22" y="170">0</text><text x="234" y="170">100</text></svg><strong>{summary.progress}%</strong></div><div className="proj-gauge-summary">{[[summary.completed, "Concluídos", "completed"], [summary.active, "Em andamento", "active"], [summary.pending + summary.paused, "Aguardando", "pending"]].map(([value, label, status]) => <div className={`proj-total-${status}`} key={String(label)}><strong>{value}</strong><span>{label}</span></div>)}</div><p>{summary.completedTasks} de {summary.tasks} tarefas concluídas.</p></article>;
  const workloadPanel = <article className={`proj-panel proj-workload ${playing && spotlight === 3 ? "proj-spotlight" : ""}`}><header><h4>Tarefas por equipe</h4><Users size={18}/></header><ChartContainer className="proj-workload-chart" config={{open: {label: "Tarefas abertas", color: "#b875da"}}}><BarChart data={workload} layout="vertical" margin={{top: 8, right: 16, left: 0, bottom: 0}} accessibilityLayer><CartesianGrid horizontal={false} stroke="#ebe9f2"/><XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize: 12}}/><YAxis type="category" dataKey="team" width={110} tickLine={false} axisLine={false} tick={{fontSize: 12, fill: "#676476"}}/><ChartTooltip content={<ChartTooltipContent/>} cursor={false}/><Bar dataKey="open" fill="#b875da" radius={[0, 5, 5, 0]} barSize={18} isAnimationActive={animate} animationDuration={850}/></BarChart></ChartContainer><span className="proj-chart-caption">Tarefas ainda não concluídas.</span></article>;

  const surface = <SidebarProvider className="proj-workspace">
    <Sidebar collapsible="none" className="proj-sidebar"><SidebarHeader className="proj-brand"><span><FolderKanban size={24}/></span><div><b>NexFlow</b><small>Projetos</small></div></SidebarHeader><SidebarContent><nav aria-label="Menu do painel de projetos"><SidebarMenu>{navigation.map(item => <SidebarMenuItem key={item.id}><SidebarMenuButton isActive={view === item.id} aria-current={view === item.id ? "page" : undefined} onClick={() => navigate(item.id)}><item.Icon/><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></nav></SidebarContent><SidebarFooter><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive={view === "settings"} onClick={() => navigate("settings")}><Settings2/><span>Preferências</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu><div className="proj-sidebar-note"><span>Demonstração</span><p>Projetos, pessoas e tarefas de exemplo.</p></div></SidebarFooter></Sidebar>
    <main className="proj-main" ref={main} tabIndex={0} onWheel={() => setPlaying(false)} onTouchStart={() => setPlaying(false)} aria-label="Conteúdo rolável do painel de projetos">
      <div className="proj-topbar"><div className="proj-search"><Search size={17}/><Input value={query} onChange={event => {setQuery(event.target.value); setPlaying(false); if (view !== "overview" && view !== "projects" && view !== "analytics") setView("projects")}} aria-label="Buscar projetos ou responsáveis" placeholder="Buscar projetos…"/>{query && <Button variant="ghost" onClick={() => setQuery("")} aria-label="Limpar busca"><X size={16}/></Button>}</div><Button className="proj-bell" variant="ghost" aria-label="Notificações de projetos" aria-expanded={notifications} onClick={() => {setNotifications(!notifications); setPlaying(false)}}><Bell size={19}/></Button><span className="proj-user-avatar" aria-label="Perfil de demonstração de Ana Costa">AC</span></div>
      <div className="proj-mobile-nav"><Label htmlFor={`${prefix}-nav`}>Menu</Label><NativeSelect id={`${prefix}-nav`} value={view} onChange={event => navigate(event.target.value as View)}>{[...navigation, {id: "settings", label: "Preferências"}].map(item => <NativeSelectOption value={item.id} key={item.id}>{item.label}</NativeSelectOption>)}</NativeSelect></div>
      {notifications && <aside className="proj-notifications"><strong>{projectSummary(projects).pending} projetos aguardam início</strong><p>Confira o escopo e o responsável antes de começar.</p><Button variant="ghost" onClick={() => {navigate("projects"); clearFilters(); setStatusFilter("pending")}}>Ver projetos não iniciados</Button></aside>}
      <div className="proj-page-heading"><div><span>SEU ESPAÇO DE TRABALHO</span><h3>{view === "settings" ? "Preferências" : navigation.find(item => item.id === view)?.label}</h3></div>{(view === "overview" || view === "projects" || view === "analytics") && <div><Label className="sr-only" htmlFor={`${prefix}-month`}>Período de entrega dos projetos</Label><NativeSelect id={`${prefix}-month`} value={month} onChange={event => {setMonth(event.target.value); setPlaying(false)}}><NativeSelectOption value="all">Todas as entregas</NativeSelectOption><NativeSelectOption value="2026-10">Outubro de 2026</NativeSelectOption><NativeSelectOption value="2026-11">Novembro de 2026</NativeSelectOption></NativeSelect></div>}</div>
      <div className="proj-view" key={view}>
        {(view === "overview" || view === "analytics") && metrics}
        {view === "overview" && <><div className="proj-dashboard-grid"><article className={`proj-panel proj-recent ${playing && spotlight === 1 ? "proj-spotlight" : ""}`}><header><h4>Projetos recentes</h4><Button variant="ghost" onClick={() => navigate("projects")}>Ver todos</Button></header>{filters}{projectTable(true)}</article>{gauge}<article className="proj-panel proj-today"><header><h4>Próximas tarefas</h4><Button variant="ghost" onClick={() => navigate("tasks")}>Ver tarefas</Button></header>{taskList(selectedTaskProject, true)}</article>{workloadPanel}</div><Button className="proj-primary proj-new-button" onClick={event => openEditor(null, event.currentTarget)}><Plus size={17}/>Novo projeto</Button></>}
        {view === "projects" && <article className="proj-panel"><header><h4>{filtered.length} projetos</h4><Button className="proj-primary" onClick={event => openEditor(null, event.currentTarget)}><Plus size={17}/>Novo projeto</Button></header>{filters}{projectTable()}</article>}
        {view === "tasks" && <article className="proj-panel proj-task-view"><header><h4>Etapas da entrega</h4><CheckCheck size={18}/></header><Label htmlFor={`${prefix}-task-project`}>Projeto</Label><NativeSelect id={`${prefix}-task-project`} value={selectedTaskProject.id} onChange={event => setTaskProject(event.target.value)}>{projects.map(project => <NativeSelectOption value={project.id} key={project.id}>{project.name}</NativeSelectOption>)}</NativeSelect><div className="proj-task-progress"><span>{projectCompletion(selectedTaskProject)}% concluído</span><span className={`proj-status proj-status-${selectedTaskProject.status}`}>{projectStatusLabels[selectedTaskProject.status]}</span></div><Progress value={projectCompletion(selectedTaskProject)} aria-label={`Progresso de ${selectedTaskProject.name}`}/>{taskList(selectedTaskProject)}</article>}
        {view === "analytics" && <><div className="proj-analytics-controls">{filters}</div><div className="proj-analysis-grid">{gauge}{workloadPanel}</div><article className="proj-panel"><header><h4>Conclusão por projeto</h4><span>{filtered.length} projetos</span></header><div className="proj-progress-list">{filtered.map(project => <div key={project.id}><Button variant="ghost" onClick={event => openEditor(project, event.currentTarget)}>{project.name}</Button><Progress value={projectCompletion(project)} aria-label={`Conclusão de ${project.name}`}/><strong>{projectCompletion(project)}%</strong></div>)}{!filtered.length && <p>Nenhum projeto corresponde aos filtros.</p>}</div></article></>}
        {view === "time" && <><article className="proj-panel proj-time-panel"><header><h4>Tempo de trabalho</h4><Clock3 size={18}/></header><Label htmlFor={`${prefix}-timer-project`}>Projeto da sessão</Label><NativeSelect id={`${prefix}-timer-project`} value={timerProject} disabled={timerRunning || timerAccumulated > 0} onChange={event => setTimerProject(event.target.value)}>{projects.map(project => <NativeSelectOption value={project.id} key={project.id}>{project.name}</NativeSelectOption>)}</NativeSelect><strong className="proj-timer" aria-label={`Tempo de trabalho: ${duration(elapsed)}`}>{duration(elapsed)}</strong><div className="proj-time-actions"><Button className="proj-primary" onClick={toggleTimer}>{timerRunning ? <Pause size={17}/> : <Play size={17}/>} {timerRunning ? "Pausar" : "Iniciar"}</Button><Button variant="outline" disabled={timerRunning || elapsed < 1000} onClick={() => {setSessions(current => [...current, {id: nextSession.current++, project: timerProject, milliseconds: timerAccumulated}]); setTimerAccumulated(0); setNotice("Sessão registrada nesta demonstração.")}}>Registrar sessão</Button><Button variant="ghost" disabled={timerRunning || !elapsed} onClick={() => setTimerAccumulated(0)}>Zerar</Button></div><p>O cronômetro mede o tempo real desta sessão.</p></article><article className="proj-panel"><header><h4>Sessões registradas</h4><span>{sessions.length}</span></header>{sessions.length ? <ul className="proj-sessions">{sessions.map(session => <li key={session.id}><span>{projects.find(project => project.id === session.project)?.name}</span><b>{duration(session.milliseconds)}</b></li>)}</ul> : <p className="proj-muted">Inicie o cronômetro, pause e registre uma sessão.</p>}</article></>}
        {view === "resources" && <><div className="proj-resource-grid">{workload.map(group => {const teamProjects = filtered.filter(project => projectMembers.find(member => member.id === project.owner)?.team === group.team); return <article className="proj-panel" key={group.team}><Boxes size={24}/><h4>{group.team}</h4><strong>{group.open}</strong><p>Tarefas abertas em {teamProjects.length} projetos.</p><Button variant="ghost" onClick={() => navigate("team")}>Ver equipe</Button></article>})}</div>{workloadPanel}</>}
        {view === "team" && <div className="proj-team-grid">{projectMembers.map(member => {const assigned = projects.filter(project => project.owner === member.id), done = assigned.flatMap(project => project.tasks).filter(task => task.completed).length, total = assigned.reduce((count, project) => count + project.tasks.length, 0); return <article className="proj-panel proj-member" key={member.id}><span className="proj-member-avatar" style={{"--member-color": member.color} as CSSProperties}>{initials(member.name)}</span><h4>{member.name}</h4><p>{member.role}</p><span>{assigned.length} projetos · {done}/{total} tarefas concluídas</span><Progress value={total ? done / total * 100 : 0} aria-label={`Conclusão das tarefas de ${member.name}`}/><Button variant="ghost" onClick={() => {navigate("projects"); clearFilters(); setOwnerFilter(member.id)}}>Ver projetos</Button></article>})}</div>}
        {view === "templates" && <div className="proj-template-grid">{[{name: "Site institucional", description: "Escopo, interface, conteúdo, serviços e validação."}, {name: "Aplicativo web", description: "Cinco etapas para organizar o desenvolvimento de uma aplicação."}, {name: "Loja virtual", description: "Uma estrutura inicial para acompanhar a entrega da loja."}].map(template => <article className="proj-panel" key={template.name}><FileStack size={28}/><h4>{template.name}</h4><p>{template.description}</p><span>5 etapas · Escopo editável</span><Button className="proj-primary" onClick={event => openEditor(null, event.currentTarget, template.name)}>Usar modelo</Button></article>)}</div>}
        {view === "settings" && <article className="proj-panel proj-settings"><h4>Movimento da demonstração</h4><div><Label htmlFor={`${prefix}-motion`}>Animar indicadores e transições<small>A preferência do seu dispositivo por menos movimento é respeitada.</small></Label><Switch id={`${prefix}-motion`} checked={motion && !reduced} disabled={reduced} onCheckedChange={checked => {setMotion(checked); setPlaying(false); clearReflection()}}/></div><p>Projetos, tarefas e sessões são exemplos. As alterações ficam nesta prévia enquanto ela estiver aberta.</p><Button variant="outline" onClick={reset}><RotateCcw size={17}/>Reiniciar demonstração</Button></article>}
      </div>
      <div className="proj-feedback" role="status" aria-live="polite">{notice && <><Check size={16}/><span>{notice}</span></>}</div>
    </main>
  </SidebarProvider>;

  return <div className={`project-demo ${animate ? "proj-animated" : ""} ${playing && animate && view === "overview" ? "proj-presenting" : ""}`} ref={root}>
    <div className="proj-demo-toolbar"><b>NexFlow <span>/ aplicativo web</span></b><span>PRÉVIA INTERATIVA</span></div>
    <div className="proj-demo-scene" ref={scene} onPointerMove={reflect} onPointerLeave={clearReflection} onPointerDown={() => setPlaying(false)} onFocusCapture={() => setPlaying(false)}>
      <div className="proj-browser-bar"><span aria-hidden="true"><i/><i/><i/></span><small>workspace / projetos</small><span>NF</span></div>
      {expanded ? <div className="proj-expanded-placeholder"><Expand size={28}/><p>Painel aberto na visualização ampliada.</p></div> : surface}
    </div>
    <div className="proj-demo-footer"><span>DADOS DEMONSTRATIVOS</span><div><Button variant="ghost" aria-pressed={playing} disabled={reduced || !motion} onClick={() => {setView("overview"); setPlaying(!playing); setSpotlight(0)}}>{playing ? <Pause size={16}/> : <Play size={16}/>}<span>{playing ? "Pausar movimento" : "Ver em movimento"}</span></Button><Button variant="ghost" onClick={reset} aria-label="Reiniciar painel de projetos"><RotateCcw size={17}/></Button><Button variant="ghost" onClick={event => {expandTrigger.current = event.currentTarget; setPlaying(false); setExpanded(true); clearReflection()}}><Expand size={17}/><span>Ampliar</span></Button></div></div>
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="proj-expand-dialog" showCloseButton={false} onCloseAutoFocus={event => {event.preventDefault(); expandTrigger.current?.focus()}}><DialogHeader><DialogTitle>Gestão de projetos</DialogTitle><DialogDescription>Explore os menus, organize tarefas e acompanhe os indicadores.</DialogDescription></DialogHeader><DialogClose className="proj-dialog-close" aria-label="Fechar painel ampliado"><X size={20}/></DialogClose><div className={`project-demo proj-expanded ${animate ? "proj-animated" : ""}`}>{surface}</div></DialogContent></Dialog>
    <Dialog open={editorOpen} onOpenChange={setEditorOpen}><DialogContent className="proj-editor-dialog" showCloseButton={false} onCloseAutoFocus={event => {event.preventDefault(); editorTrigger.current?.focus()}}><DialogHeader><DialogTitle>{editing ? "Detalhes do projeto" : "Novo projeto"}</DialogTitle><DialogDescription>{editing ? `${editing} · Altere os dados ou marque as etapas concluídas.` : "Defina o projeto e acompanhe suas cinco etapas."}</DialogDescription></DialogHeader><DialogClose className="proj-dialog-close" aria-label="Fechar detalhes do projeto"><X size={20}/></DialogClose><form onSubmit={saveProject} className="proj-editor-form"><Label htmlFor={`${prefix}-name`}>Nome do projeto</Label><Input id={`${prefix}-name`} value={draft.name} onChange={event => {event.currentTarget.setCustomValidity(""); setDraft(current => ({...current, name: event.target.value}))}} required minLength={3} maxLength={80} pattern=".*\S.*"/><div className="proj-editor-fields"><div><Label htmlFor={`${prefix}-edit-owner`}>Responsável</Label><NativeSelect id={`${prefix}-edit-owner`} value={draft.owner} onChange={event => setDraft(current => ({...current, owner: event.target.value}))}>{projectMembers.map(member => <NativeSelectOption value={member.id} key={member.id}>{member.name}</NativeSelectOption>)}</NativeSelect></div><div><Label htmlFor={`${prefix}-due`}>Data de entrega</Label><Input type="date" id={`${prefix}-due`} value={draft.due} onChange={event => setDraft(current => ({...current, due: event.target.value}))} required/></div></div><Label htmlFor={`${prefix}-edit-status`}>Status</Label><NativeSelect id={`${prefix}-edit-status`} value={draft.status} onChange={event => setDraft(current => ({...current, status: event.target.value as ProjectStatus}))}>{Object.entries(projectStatusLabels).map(([value, label]) => <NativeSelectOption value={value} key={value}>{label}</NativeSelectOption>)}</NativeSelect>{editingProject && <div className="proj-editor-tasks"><h4>Etapas do projeto</h4>{taskList(editingProject, false, "editor")}</div>}<div className="proj-editor-actions"><DialogClose asChild><Button type="button" variant="outline">Fechar</Button></DialogClose><Button type="submit" className="proj-primary">{editing ? "Salvar alterações" : "Criar projeto"}</Button></div></form></DialogContent></Dialog>
  </div>;
}
