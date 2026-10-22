"use client";

import {useEffect, useId, useRef, useState, type CSSProperties} from "react";
import {BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip} from "recharts";
import {Dialog as SheetPrimitive} from "radix-ui";
import {LayoutDashboard, CreditCard, Users, Layers3, Receipt, ChartNoAxesCombined, ShieldCheck, LogOut, Search, Bell, CalendarDays, X, Check, RotateCcw, TrendingUp, Banknote, Clock3, Pause, Play} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import {ChartContainer} from "@/components/ui/chart";
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider} from "@/components/ui/sidebar";
import {Table, TableHeader, TableBody, TableHead, TableRow, TableCell} from "@/components/ui/table";
import {Sheet, SheetClose, SheetDescription, SheetTitle} from "@/components/ui/sheet";
import {brl, demoMonths, demoPlans, filterSubscriptions, initialSubscriptions, planFor, statusLabels, subscriptionMetrics, subscriptionTrend, type DemoPlan, type DemoSubscription} from "@/lib/subscription-demo";

type View = "overview" | "subscriptions" | "customers" | "plans" | "billing" | "analytics" | "security";
const navigation = [
  {id: "overview" as const, name: "Visão geral", Icon: LayoutDashboard},
  {id: "subscriptions" as const, name: "Assinaturas", Icon: CreditCard},
  {id: "customers" as const, name: "Clientes", Icon: Users},
  {id: "plans" as const, name: "Planos", Icon: Layers3},
  {id: "billing" as const, name: "Cobranças", Icon: Receipt},
  {id: "analytics" as const, name: "Análises", Icon: ChartNoAxesCombined},
];

function AnimatedMetric({value, money = false, visible}: {value: number; money?: boolean; visible: boolean}) {
  const current = useRef(0);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (!visible) {setDisplay(value); return}
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {setDisplay(value); current.current = value; return}
    const from = current.current, start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 650);
      current.current = Math.round(from + (value - from) * (1 - (1 - progress) ** 3));
      setDisplay(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, visible]);
  const format = (amount: number) => money ? brl(amount) : amount.toLocaleString("pt-BR");
  return <><span aria-hidden="true">{format(display)}</span><span className="sr-only">{format(value)}</span></>;
}

function DotColumn({x = 0, y = 0, width = 0, height = 0, fill = "#53565b"}: {x?: number; y?: number; width?: number; height?: number; fill?: string}) {
  if (width <= 0 || height <= 0) return null;
  const count = Math.max(1, Math.floor(height / 11)), columns = Math.min(3, Math.max(1, Math.floor(width / 12)));
  return <g aria-hidden="true">{Array.from({length: count * columns}, (_, index) => <circle key={index} cx={x + width / 2 + (index % columns - (columns - 1) / 2) * 11} cy={y + height - 4 - Math.floor(index / columns) * 11} r={3.8} fill={fill}/>)}</g>;
}

export function SubscriptionDashboardDemo() {
  const [view, setView] = useState<View>("overview");
  const [rows, setRows] = useState<DemoSubscription[]>(initialSubscriptions);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"), [planFilter, setPlanFilter] = useState("all");
  const [month, setMonth] = useState("10");
  const [notice, setNotice] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [closed, setClosed] = useState(false);
  const [visible, setVisible] = useState(false), [reduced, setReduced] = useState(false);
  const [selected, setSelected] = useState<string | null>(null), [selectedPlan, setSelectedPlan] = useState<DemoPlan>("starter");
  const [paid, setPaid] = useState<string[]>(["NF-1001", "NF-1002", "NF-1004"]);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement>(null), main = useRef<HTMLElement>(null), close = useRef<HTMLButtonElement>(null), lastTrigger = useRef<HTMLButtonElement | null>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const metrics = subscriptionMetrics(rows), trend = subscriptionTrend(rows);
  const found = filterSubscriptions(rows, query, status, planFilter);
  const record = rows.find(row => row.id === selected);
  const selectedMonth = trend.find(period => period.month === Number(month))!;

  useEffect(() => {
    const element = stage.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches); sync(); media.addEventListener("change", sync);
    const observer = new IntersectionObserver(entries => {if (entries.some(entry => entry.isIntersecting)) {setVisible(true); observer.disconnect()}}, {threshold: .1});
    if (element) observer.observe(element);
    return () => {observer.disconnect(); media.removeEventListener("change", sync)};
  }, []);

  function navigate(next: View) {
    setView(next); setNotifications(false); setStatus("all"); setPlanFilter("all"); setQuery(""); setNotice("");
    main.current?.scrollTo({top: 0, behavior: "auto"});
  }
  function inspect(row: DemoSubscription, button: HTMLButtonElement) {lastTrigger.current = button; setSelectedPlan(row.plan); setSelected(row.id)}
  function reset() {setRows(initialSubscriptions); setPaid(["NF-1001", "NF-1002", "NF-1004"]); setSelected(null); setClosed(false); navigate("overview"); setNotice("A demonstração voltou ao estado inicial.")}

  function renderRevenueChart() {
    return <article className="sub-demo-card sub-demo-revenue"><header><h4>Receita recorrente</h4><span>2026</span></header><p className="sub-demo-chart-readout">{selectedMonth.label} · <strong>{brl(selectedMonth.revenue)}</strong></p>
      <ChartContainer config={{revenue: {label: "Receita mensal", color: "#20d6c7"}}} className="sub-demo-chart" aria-label="Receita mensal acumulada das assinaturas ativas, de maio a outubro">
        <BarChart data={trend} margin={{top: 8, right: 6, bottom: 0, left: 0}} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="#ffffff0a"/>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fill: "#aaa", fontSize: 12}}/>
          <YAxis tickLine={false} axisLine={false} width={47} tick={{fill: "#888", fontSize: 12}} tickFormatter={value => value >= 1000 ? `${(value / 1000).toLocaleString("pt-BR")} mil` : String(value)}/>
          <Tooltip cursor={false} content={({active, payload}) => active && payload?.length ? <div className="sub-demo-chart-tip">{String(payload[0].payload.label)} · {brl(Number(payload[0].value))}</div> : null}/>
          <Bar dataKey="revenue" isAnimationActive={visible && !reduced} animationDuration={800} shape={(props: unknown) => {const column = props as {x: number; y: number; width: number; height: number; payload: {month: number}}; return <DotColumn {...column} fill={column.payload.month === Number(month) ? "#20d6c7" : "#53565b"}/>}}/>
        </BarChart>
      </ChartContainer>
      <div className="sub-demo-chart-months" aria-label="Destaque um mês">{demoMonths.map(period => <Button variant="ghost" type="button" key={period.month} aria-pressed={Number(month) === period.month} onClick={() => setMonth(String(period.month))}>{period.label}</Button>)}</div>
    </article>;
  }

  function renderHealthChart() {
    const segments = [{value: metrics.active, label: "Ativas", color: "#20d6c7"}, {value: metrics.trial, label: "Em teste", color: "#efb45c"}, {value: metrics.paused, label: "Pausadas", color: "#ed776a"}];
    let offset = 0;
    return <article className="sub-demo-card sub-demo-health"><header><h4>Suas assinaturas</h4><Users size={18}/></header><div className="sub-demo-gauge"><svg viewBox="0 0 240 230" role="img" aria-label={`${metrics.active} assinaturas ativas, ${metrics.trial} em teste e ${metrics.paused} pausadas`}><circle cx="120" cy="116" r="92" pathLength="100" fill="none" stroke="#323437" strokeWidth="7" strokeDasharray="75 25" transform="rotate(135 120 116)"/>{segments.map(segment => {const portion = metrics.total ? segment.value / metrics.total * 75 : 0, start = offset; offset += portion; return <circle className="sub-demo-gauge-arc" key={segment.label} cx="120" cy="116" r="92" pathLength="100" fill="none" stroke={segment.color} strokeWidth="7" strokeDasharray={`${portion} ${100 - portion}`} strokeDashoffset={-start} transform="rotate(135 120 116)"/>})}</svg><div><strong><AnimatedMetric value={metrics.total} visible={visible}/></strong><span>assinaturas</span></div></div><ul>{segments.map(segment => <li key={segment.label}><span><i style={{background: segment.color}}/>{segment.label}</span><strong>{metrics.total ? (segment.value / metrics.total * 100).toLocaleString("pt-BR", {maximumFractionDigits: 1}) : "0"}%</strong></li>)}</ul></article>;
  }

  function renderPlanCards({full = false}: {full?: boolean}) {
    return <div className={`sub-demo-plan-grid ${full ? "sub-demo-plan-full" : ""}`}>{demoPlans.map((plan, index) => <article className="sub-demo-plan" key={plan.id}><h4><Layers3/>{plan.name}</h4><strong>{brl(plan.price)}<small>/mês</small></strong><p>{plan.description}</p><span><Users size={15}/>{rows.filter(row => row.plan === plan.id).length} clientes</span><span><Banknote size={15}/>{brl(subscriptionMetrics(rows.filter(row => row.plan === plan.id)).mrr)} recorrentes</span><Button variant="ghost" type="button" onClick={() => {navigate("subscriptions"); setPlanFilter(plan.id); setNotice(`Assinaturas do plano ${plan.name}.`)}}>Ver assinaturas</Button></article>)}</div>;
  }

  function renderRecordList({compact = false, customer = false}: {compact?: boolean; customer?: boolean}) {
    const records = compact ? found.slice(-5).reverse() : [...found].reverse();
    return records.length ? <ul className="sub-demo-records">{records.map((row, index) => <li key={row.id}><Button variant="ghost" type="button" className="sub-demo-record" onClick={event => inspect(row, event.currentTarget)}><span className="sub-demo-avatar" style={{"--avatar": ["#b16851", "#426b76", "#647449", "#83609b"][index % 4]} as CSSProperties}>{row.name.charAt(0)}</span><span className="sub-demo-record-name"><strong>{row.name}</strong><small>{customer ? row.id : planFor(row.plan).name}</small></span><span className="sub-demo-record-price">{brl(planFor(row.plan).price)}<small>/mês</small></span><span className={`sub-demo-status sub-demo-status-${row.status}`}>{statusLabels[row.status]}</span></Button></li>)}</ul> : <div className="sub-demo-empty"><Search/><p>Nenhum resultado para esses filtros.</p><Button variant="ghost" type="button" onClick={() => {setQuery(""); setStatus("all"); setPlanFilter("all")}}>Limpar filtros</Button></div>;
  }

  return <div className={`subscription-demo ${visible ? "sub-demo-visible" : ""}`} ref={stage}>
    <div className="sub-demo-toolbar"><b>NexFlow <span>/ aplicativo web</span></b><span>PRÉVIA INTERATIVA</span></div>
    <div className="sub-demo-frame" ref={setHost}>
      {closed ? <div className="sub-demo-closed"><LayoutDashboard/><h3>Prévia encerrada.</h3><Button type="button" className="sub-demo-primary" onClick={() => {setClosed(false); setNotice("")}}>Reabrir aplicativo</Button></div> : <SidebarProvider className="sub-demo-workspace" inert={!!selected}>
        <Sidebar collapsible="none" className="sub-demo-sidebar">
          <SidebarHeader className="sub-demo-brand"><span><Layers3/></span><div><strong>NexFlow</strong><small>Gestão de assinaturas</small></div></SidebarHeader>
          <SidebarContent><nav aria-label="Menu do aplicativo demonstrativo"><SidebarMenu>{navigation.map(({id: destination, name, Icon}) => <SidebarMenuItem key={destination}><SidebarMenuButton isActive={view === destination} aria-current={view === destination ? "page" : undefined} onClick={() => navigate(destination)}><Icon/><span>{name}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></nav></SidebarContent>
          <SidebarFooter><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive={view === "security"} onClick={() => navigate("security")}><ShieldCheck/><span>Segurança</span></SidebarMenuButton></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton onClick={() => {setClosed(true); setNotifications(false)}}><LogOut/><span>Encerrar prévia</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarFooter>
        </Sidebar>
        <main className="sub-demo-main" ref={main} tabIndex={0} aria-label="Conteúdo rolável do aplicativo demonstrativo">
          <div className="sub-demo-topbar"><div className="sub-demo-search"><Search size={18}/><Input aria-label="Buscar clientes ou planos na demonstração" value={query} onChange={event => {setQuery(event.target.value); if (view !== "overview" && view !== "subscriptions" && view !== "customers" && view !== "billing") setView("customers")}} placeholder="Buscar clientes ou planos…"/>{query && <Button type="button" variant="ghost" aria-label="Limpar busca" onClick={() => setQuery("")}><X size={16}/></Button>}</div><Button variant="ghost" type="button" className="sub-demo-notification-button" aria-expanded={notifications} aria-label="Abrir notificações de exemplo" onClick={() => setNotifications(!notifications)}><Bell size={19}/><i aria-hidden="true"/></Button></div>
          {notifications && <div className="sub-demo-notifications"><strong>{metrics.trial} assinaturas em teste</strong><p>Acompanhe os clientes que ainda estão experimentando o plano.</p><Button variant="ghost" type="button" onClick={() => {navigate("subscriptions"); setStatus("trial")}}>Ver assinaturas em teste</Button></div>}
          <div className="sub-demo-page-header"><h3>{view === "security" ? "Segurança" : navigation.find(item => item.id === view)?.name}</h3><span>Dados demonstrativos</span></div>
          <div key={view} className="sub-demo-view">
            {(view === "overview" || view === "analytics") && <><div className="sub-demo-metrics">{[{title: "Receita mensal", value: metrics.mrr, money: true, detail: "Assinaturas ativas", Icon: Banknote}, {title: "Receita anual estimada", value: metrics.arr, money: true, detail: "Receita mensal × 12", Icon: TrendingUp}, {title: "Clientes ativos", value: metrics.active, money: false, detail: `${metrics.total} clientes no total`, Icon: Users}, {title: "Em teste", value: metrics.trial, money: false, detail: "Acompanhe a ativação", Icon: Clock3}].map(({title, value, money, detail, Icon}) => <article className="sub-demo-card sub-demo-metric" key={title}><div><span>{title}</span><Icon size={19}/></div><strong><AnimatedMetric value={value} money={money} visible={visible}/></strong><p>{detail}</p></article>)}</div><div className="sub-demo-chart-filter"><CalendarDays size={16}/><Label htmlFor={`${id}-month`}>Mês em destaque</Label><NativeSelect id={`${id}-month`} value={month} onChange={event => setMonth(event.target.value)}>{demoMonths.map(period => <NativeSelectOption key={period.month} value={String(period.month)}>{period.label} de 2026</NativeSelectOption>)}</NativeSelect></div><div className="sub-demo-charts">{renderRevenueChart()}{renderHealthChart()}</div></>}
            {view === "overview" && <div className="sub-demo-bottom"><article className="sub-demo-card"><header><h4>Planos e receita</h4><Button type="button" variant="ghost" onClick={() => navigate("plans")}>Ver todos</Button></header>{renderPlanCards({})}</article><article className="sub-demo-card"><header><h4>Assinaturas recentes</h4><Button type="button" variant="ghost" onClick={() => navigate("subscriptions")}>Ver todas</Button></header>{renderRecordList({compact: true})}</article></div>}
            {(view === "subscriptions" || view === "customers" || view === "billing") && <><div className="sub-demo-filters"><div><Label htmlFor={`${id}-status`}>Situação</Label><NativeSelect id={`${id}-status`} value={status} onChange={event => setStatus(event.target.value)}><NativeSelectOption value="all">Todas</NativeSelectOption><NativeSelectOption value="active">Ativas</NativeSelectOption><NativeSelectOption value="trial">Em teste</NativeSelectOption><NativeSelectOption value="paused">Pausadas</NativeSelectOption></NativeSelect></div><div><Label htmlFor={`${id}-plan`}>Plano</Label><NativeSelect id={`${id}-plan`} value={planFilter} onChange={event => setPlanFilter(event.target.value)}><NativeSelectOption value="all">Todos</NativeSelectOption>{demoPlans.map(plan => <NativeSelectOption key={plan.id} value={plan.id}>{plan.name}</NativeSelectOption>)}</NativeSelect></div><span>{found.length} {found.length === 1 ? "resultado" : "resultados"}</span></div>{view === "billing" ? <article className="sub-demo-card sub-demo-invoices">{found.length ? <Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Valor mensal</TableHead><TableHead>Situação</TableHead><TableHead><span className="sr-only">Ação</span></TableHead></TableRow></TableHeader><TableBody>{found.map(row => <TableRow key={row.id}><TableCell><strong>{row.name}</strong><small>{row.id}</small></TableCell><TableCell>{brl(planFor(row.plan).price)}</TableCell><TableCell><span className={`sub-demo-status ${paid.includes(row.id) ? "sub-demo-status-active" : "sub-demo-status-trial"}`}>{paid.includes(row.id) ? "Paga" : "Pendente"}</span></TableCell><TableCell><Button type="button" variant="ghost" disabled={paid.includes(row.id)} onClick={() => {setPaid(previous => [...previous, row.id]); setNotice(`Pagamento de ${row.name} simulado. Nenhuma cobrança real foi feita.`)}}>{paid.includes(row.id) ? <><Check size={15}/>Paga</> : "Simular pagamento"}</Button></TableCell></TableRow>)}</TableBody></Table> : renderRecordList({})}<p className="sub-demo-table-note">Cobranças de exemplo. Os botões alteram somente esta prévia.</p></article> : <article className="sub-demo-card">{renderRecordList({customer: view === "customers"})}</article>}</>}
            {view === "plans" && <>{renderPlanCards({full: true})}<p className="sub-demo-plan-note">Preços de um serviço fictício de assinaturas. Não são planos comerciais da NexFlow.</p></>}
            {view === "analytics" && <article className="sub-demo-card sub-demo-analysis"><h4>Receita por plano</h4>{demoPlans.map(plan => {const value = subscriptionMetrics(rows.filter(row => row.plan === plan.id)).mrr; return <div key={plan.id}><span>{plan.name}</span><div><i style={{width: `${metrics.mrr ? value / metrics.mrr * 100 : 0}%`}}/></div><strong>{brl(value)}</strong></div>})}<p>Considera somente as assinaturas ativas desta demonstração.</p></article>}
            {view === "security" && <article className="sub-demo-card sub-demo-security"><ShieldCheck/><h4>Explore com tranquilidade.</h4><p>Este painel usa dados fictícios. As alterações ficam na prévia e são descartadas ao recarregar a página.</p><ul><li><Check/>Nenhum pagamento real</li><li><Check/>Nenhuma mensagem enviada</li><li><Check/>Nenhuma conta pessoal necessária</li></ul><Button type="button" className="sub-demo-primary" onClick={reset}>Restaurar demonstração</Button></article>}
          </div>
        </main>
      </SidebarProvider>}
      <Sheet open={!!record} modal={false} onOpenChange={open => {if (!open) setSelected(null)}}>{host && record && <SheetPrimitive.Portal container={host}><div className="sub-demo-detail-shade" aria-hidden="true"/><SheetPrimitive.Content className="sub-demo-detail" onInteractOutside={event => event.preventDefault()} onOpenAutoFocus={event => {event.preventDefault(); close.current?.focus({preventScroll: true})}} onCloseAutoFocus={event => {event.preventDefault(); requestAnimationFrame(() => lastTrigger.current?.focus({preventScroll: true}))}}><header><span className="sub-demo-avatar">{record.name.charAt(0)}</span><SheetClose asChild><Button ref={close} type="button" variant="ghost" aria-label="Fechar detalhes"><X/></Button></SheetClose></header><SheetTitle>{record.name}</SheetTitle><SheetDescription>{record.id} · cliente demonstrativo</SheetDescription><dl><div><dt>Situação</dt><dd>{statusLabels[record.status]}</dd></div><div><dt>Cliente desde</dt><dd>{record.date.split("-").reverse().join("/")}</dd></div><div><dt>Mensalidade</dt><dd>{brl(planFor(record.plan).price)}</dd></div></dl><div className="sub-demo-plan-picker"><Label htmlFor={`${id}-edit-plan`}>Alterar plano na prévia</Label><NativeSelect id={`${id}-edit-plan`} value={selectedPlan} onChange={event => setSelectedPlan(event.target.value as DemoPlan)}>{demoPlans.map(plan => <NativeSelectOption value={plan.id} key={plan.id}>{plan.name} · {brl(plan.price)}/mês</NativeSelectOption>)}</NativeSelect><Button type="button" className="sub-demo-primary" onClick={() => {setRows(previous => previous.map(row => row.id === record.id ? {...row, plan: selectedPlan} : row)); setNotice(`Plano de ${record.name} alterado na demonstração.`); setSelected(null)}}>Salvar alteração</Button></div><Button type="button" variant="ghost" className="sub-demo-status-action" onClick={() => {const next = record.status === "active" ? "paused" : "active"; setRows(previous => previous.map(row => row.id === record.id ? {...row, status: next} : row)); setNotice(`Assinatura de ${record.name} ${next === "active" ? "ativada" : "pausada"} na demonstração.`); setSelected(null)}}>{record.status === "active" ? <Pause size={16}/> : <Play size={16}/>} {record.status === "active" ? "Pausar assinatura" : "Ativar assinatura"}</Button><p>As mudanças atualizam os indicadores deste painel.</p></SheetPrimitive.Content></SheetPrimitive.Portal>}</Sheet>
    </div>
    <div className="sub-demo-caption"><p>Navegue pelos menus, filtre clientes e altere um plano para ver os indicadores mudarem.</p><Button variant="ghost" type="button" onClick={reset}><RotateCcw size={16}/>Reiniciar prévia</Button><span className="sub-demo-notice" role="status" aria-live="polite">{notice}</span></div>
  </div>;
}
