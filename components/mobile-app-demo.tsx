"use client";

import {useEffect, useId, useRef, useState, type CSSProperties} from "react";
import {ArrowLeft, BatteryFull, Bell, CalendarDays, Check, Clock3, Droplets, Heart, Home, MapPin, Scissors, Search, Share2, Signal, SlidersHorizontal, Sparkles, Star, UserRound, Users, Waves, Wifi, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {MobileFitnessDemo} from "@/components/mobile-fitness-demo";
import {MobileRiskDemo} from "@/components/mobile-risk-demo";
import {MobileDeliveryDemo} from "@/components/mobile-delivery-demo";
import {mobileBookingDays, mobileMoney, mobileServiceSearch, mobileServices, mobileStylists, mobileTimes, mobileTotal, type MobileBooking, type MobileDay} from "@/lib/mobile-app-demo";

type Screen = "intro" | "home" | "booking" | "appointments" | "stylists" | "profile";
const serviceIcons = {cut: Scissors, color: Waves, spa: Droplets, dry: Sparkles};
const menu = [{id: "home" as const, title: "Início", Icon: Home}, {id: "appointments" as const, title: "Agenda", Icon: CalendarDays}, {id: "stylists" as const, title: "Equipe", Icon: Users}, {id: "profile" as const, title: "Perfil", Icon: UserRound}];
type PhoneProps = {initial: Screen; index: number; label: string; days: MobileDay[]; appointment: MobileBooking | null; onBooking: (booking: MobileBooking | null) => void; coupon: boolean; onCoupon: () => void; name: string; onName: (name: string) => void};

function MobilePhone({initial, index, label, days, appointment, onBooking, coupon, onCoupon, name, onName}: PhoneProps) {
  const [screen, setScreen] = useState<Screen>(initial);
  const [serviceId, setServiceId] = useState("cut"), [stylistId, setStylistId] = useState("emma");
  const [dayId, setDayId] = useState(""), [time, setTime] = useState("11:00");
  const [query, setQuery] = useState(""), [category, setCategory] = useState("all");
  const [filters, setFilters] = useState(false), [notifications, setNotifications] = useState(false);
  const [notice, setNotice] = useState(""), [visible, setVisible] = useState(false);
  const slot = useRef<HTMLDivElement>(null), scroll = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const service = mobileServices.find(option => option.id === serviceId)!;
  const selectedDay = days.find(day => day.id === dayId);
  const results = mobileServiceSearch(query, category);
  const total = mobileTotal(service.price, coupon);

  useEffect(() => {if (days.length) setDayId(days[0].id)}, [days]);
  useEffect(() => {
    const element = slot.current; if (!element) return;
    const measure = () => element.style.setProperty("--mobile-scale", String(Math.max(.1, Math.min(1, element.clientWidth / 375))));
    const resize = new ResizeObserver(measure); resize.observe(element); measure();
    const observer = new IntersectionObserver(entries => {if (entries.some(entry => entry.isIntersecting)) {setVisible(true); observer.disconnect()}}, {threshold: .1}); observer.observe(element);
    return () => {resize.disconnect(); observer.disconnect()};
  }, []);
  function navigate(next: Screen) {setScreen(next); setNotifications(false); setNotice(""); scroll.current?.scrollTo({top: 0, behavior: "auto"})}
  function bookService(next: string) {setServiceId(next); navigate("booking")}
  function stylistPhoto(person: typeof mobileStylists[number]) {return <span className={`mobile-app-stylist-photo mobile-app-photo-${person.photo}`} role="img" aria-label={person.name}/>}
  function title(text: string, action: () => void, actionLabel = "Ver todos") {return <div className="mobile-app-section-title"><h5>{text}</h5><Button type="button" variant="ghost" onClick={action}>{actionLabel}</Button></div>}
  async function shareService() {
    const text = `HairAura · ${service.name} · ${mobileMoney(total)} · Prévia demonstrativa NexFlow`;
    try {if (navigator.clipboard?.writeText) {await navigator.clipboard.writeText(text); setNotice("Resumo copiado para compartilhar.")} else setNotice(text)} catch {setNotice(text)}
  }

  return <div className="mobile-app-device"><div className={`mobile-app-slot ${visible ? "mobile-app-visible" : ""}`} ref={slot} style={{"--mobile-delay": `${index * 120}ms`} as CSSProperties}><div className="mobile-app-phone">
    <div className="mobile-app-status" aria-hidden="true"><span>9:41</span><div><Signal/><Wifi/><BatteryFull/></div></div>
    <div className={`mobile-app-scroll mobile-app-screen-${screen}`} ref={scroll} tabIndex={0} aria-label={`Aplicativo de salão ${index + 1}: conteúdo rolável`}>
      <div className="mobile-app-view" key={screen}>
        {screen === "intro" && <div className="mobile-app-intro"><div className="mobile-app-intro-photo" role="img" aria-label="Cliente durante um corte de cabelo"/><div className="mobile-app-brand"><span><Scissors/></span><div><strong>HairAura</strong><small>Seu cabelo. Seu estilo.</small></div></div><div className="mobile-app-intro-copy"><h4>Seu estilo.<br/><span>Nosso cuidado.</span></h4><p>Escolha seu serviço e encontre<br/>um horário para você.</p><Button type="button" className="mobile-app-gold" onClick={() => navigate("home")}>Explorar o aplicativo</Button></div></div>}
        {screen === "home" && <div className="mobile-app-body"><header className="mobile-app-welcome"><div><h4>Olá, {name} <span aria-hidden="true">✦</span></h4><p><MapPin size={13}/>Seu salão favorito</p></div><Button type="button" variant="ghost" className="mobile-app-circle" aria-expanded={notifications} aria-label="Abrir aviso de agendamento" onClick={() => setNotifications(!notifications)}><Bell/><span className="mobile-app-badge">1</span></Button></header>
          {notifications && <div className="mobile-app-notification"><p>{appointment ? `Você tem um horário de exemplo em ${appointment.day.label}.` : "Sua agenda está livre para escolher um horário."}</p><Button variant="ghost" type="button" onClick={() => navigate("appointments")}>Abrir agenda</Button></div>}
          <div className="mobile-app-search-row"><div className="mobile-app-search"><Search/><Input aria-label="Buscar serviços no aplicativo" placeholder="Buscar serviços…" value={query} onChange={event => setQuery(event.target.value)}/>{query && <Button type="button" variant="ghost" aria-label="Limpar busca" onClick={() => setQuery("")}><X/></Button>}</div><Button type="button" variant="ghost" className="mobile-app-circle" aria-label="Filtrar serviços" aria-expanded={filters} onClick={() => setFilters(!filters)}><SlidersHorizontal/></Button></div>
          {filters && <div className="mobile-app-filter"><Label htmlFor={`${id}-category`}>Tipo de serviço</Label><NativeSelect id={`${id}-category`} value={category} onChange={event => setCategory(event.target.value)}><NativeSelectOption value="all">Todos</NativeSelectOption><NativeSelectOption value="cut">Cortes</NativeSelectOption><NativeSelectOption value="color">Coloração</NativeSelectOption><NativeSelectOption value="care">Cuidados</NativeSelectOption></NativeSelect></div>}
          {!query && category === "all" && <div className="mobile-app-promo"><div className="mobile-app-promo-photo" aria-hidden="true"/><div><small>30% NA PRIMEIRA VISITA</small><h4>Um novo<br/>visual.</h4><p>Experimente a oferta<br/>deste modelo.</p><Button type="button" variant="ghost" onClick={() => {onCoupon(); setNotice("Oferta ativada nesta prévia.")}}>{coupon ? <><Check size={14}/>Oferta ativada</> : "Usar oferta"}</Button></div></div>}
          {title("Serviços", () => {setQuery(""); setCategory("all"); setFilters(true)})}
          <div className="mobile-app-services">{results.map(option => {const Icon = serviceIcons[option.id as keyof typeof serviceIcons]; return <Button key={option.id} type="button" variant="ghost" onClick={() => bookService(option.id)}><Icon/><span>{option.short}</span></Button>})}</div>
          {!results.length && <div className="mobile-app-empty"><Search/><p>Nenhum serviço encontrado.</p><Button variant="ghost" type="button" onClick={() => {setQuery(""); setCategory("all")}}>Limpar filtros</Button></div>}
          {title("Seu próximo horário", () => navigate("appointments"))}
          {appointment ? <Button variant="ghost" type="button" className="mobile-app-appointment" onClick={() => navigate("appointments")}><span className="mobile-app-appointment-photo" aria-hidden="true"/><span><strong>{mobileServices.find(option => option.id === appointment.service)?.name}</strong><small>com {mobileStylists.find(person => person.id === appointment.stylist)?.name}</small><b>{appointment.day.label} · {appointment.time}</b></span><CalendarDays/></Button> : <Button type="button" variant="ghost" className="mobile-app-empty-book" onClick={() => bookService("cut")}>Escolher um horário</Button>}
        </div>}
        {screen === "booking" && <><div className="mobile-app-booking-photo" role="img" aria-label="Profissional durante um atendimento no salão"/><div className="mobile-app-booking-nav"><Button variant="ghost" type="button" className="mobile-app-circle" aria-label="Voltar ao início" onClick={() => navigate("home")}><ArrowLeft/></Button><Button variant="ghost" type="button" className="mobile-app-circle" aria-label="Copiar resumo do serviço para compartilhar" onClick={shareService}><Share2/></Button></div><div className="mobile-app-booking-body"><article className="mobile-app-service-detail"><div><h4>{service.name}</h4><strong>{mobileMoney(service.price)}</strong></div><p><Clock3 size={14}/>{service.minutes} min <span>· Atendimento individual</span></p><p>{service.description}</p></article>
          {title("Escolha o profissional", () => navigate("stylists"))}
          <RadioGroup className="mobile-app-stylist-choices" value={stylistId} onValueChange={setStylistId} aria-label="Profissional para o agendamento">{mobileStylists.map(person => <Label key={person.id} className="mobile-app-stylist" htmlFor={`${id}-stylist-${person.id}`}><RadioGroupItem id={`${id}-stylist-${person.id}`} value={person.id}/>{stylistPhoto(person)}<strong>{person.name}</strong><small>{person.role}</small><span><Star size={11}/>{person.rating}</span><i><Check size={13}/></i></Label>)}</RadioGroup>
          <h5 className="mobile-app-booking-label">Escolha o dia</h5><RadioGroup className="mobile-app-days" orientation="horizontal" value={dayId} onValueChange={setDayId} aria-label="Dia para o agendamento">{days.map(day => <Label key={day.id} className="mobile-app-day" htmlFor={`${id}-day-${day.id}`}><RadioGroupItem id={`${id}-day-${day.id}`} value={day.id}/><span>{day.weekday}</span><strong>{day.label}</strong></Label>)}</RadioGroup>
          <h5 className="mobile-app-booking-label">Horários de exemplo</h5><RadioGroup className="mobile-app-times" orientation="horizontal" value={time} onValueChange={setTime} aria-label="Horário para o agendamento">{mobileTimes.map(hour => <Label key={hour} className="mobile-app-time" htmlFor={`${id}-time-${hour}`}><RadioGroupItem id={`${id}-time-${hour}`} value={hour}/>{hour}</Label>)}</RadioGroup>
          {coupon && <p className="mobile-app-discount"><Check size={13}/>Oferta de 30% aplicada neste exemplo.</p>}
          <Button type="button" className="mobile-app-gold mobile-app-book-cta" disabled={!selectedDay} onClick={() => {if (!selectedDay) return; onBooking({service: serviceId, stylist: stylistId, day: selectedDay, time, total}); navigate("appointments"); setNotice("Agendamento simulado. Nenhuma reserva real foi feita.")}}>Agendar · {mobileMoney(total)}</Button><p className="mobile-app-simulation">Simulação de agendamento.</p>
        </div></>}
        {screen === "appointments" && <div className="mobile-app-body mobile-app-inner-page"><div className="mobile-app-page-heading"><CalendarDays/><h4>Minha agenda</h4><p>Seus horários nesta prévia.</p></div>{appointment ? <article className="mobile-app-agenda-card"><span className="mobile-app-appointment-photo" role="img" aria-label="Atendimento de salão"/><span className="mobile-app-agenda-badge">HORÁRIO DEMONSTRATIVO</span><h5>{mobileServices.find(option => option.id === appointment.service)?.name}</h5><p>Com {mobileStylists.find(person => person.id === appointment.stylist)?.name}</p><dl><div><dt>Dia</dt><dd>{appointment.day.label}</dd></div><div><dt>Horário</dt><dd>{appointment.time}</dd></div><div><dt>Valor de exemplo</dt><dd>{mobileMoney(appointment.total)}</dd></div></dl><Button type="button" className="mobile-app-gold" onClick={() => {setServiceId(appointment.service); setStylistId(appointment.stylist); setDayId(appointment.day.id); setTime(appointment.time); navigate("booking")}}>Alterar horário</Button><Button type="button" variant="ghost" className="mobile-app-remove" onClick={() => {onBooking(null); setNotice("Horário removido da prévia.")}}>Remover da prévia</Button></article> : <div className="mobile-app-empty"><CalendarDays/><p>Nenhum horário na sua agenda.</p><Button type="button" className="mobile-app-gold" onClick={() => bookService("cut")}>Escolher um serviço</Button></div>}<p className="mobile-app-simulation">Os horários são exemplos. Nenhuma reserva real é feita.</p></div>}
        {screen === "stylists" && <div className="mobile-app-body mobile-app-inner-page"><div className="mobile-app-page-heading"><Users/><h4>Encontre seu profissional.</h4><p>Escolha quem vai cuidar do seu atendimento.</p></div><div className="mobile-app-team-list">{mobileStylists.map(person => <article key={person.id}>{stylistPhoto(person)}<div><h5>{person.name}</h5><p>{person.role}</p><span><Star size={13}/>{person.rating}</span></div><Button type="button" className="mobile-app-gold" onClick={() => {setStylistId(person.id); navigate("booking")}}>Escolher {person.name.split(" ")[0]}</Button></article>)}</div></div>}
        {screen === "profile" && <div className="mobile-app-body mobile-app-inner-page"><div className="mobile-app-page-heading"><UserRound/><h4>Seu perfil</h4><p>Uma experiência pensada para você.</p></div><form className="mobile-app-profile" onSubmit={event => {event.preventDefault(); const next = String(new FormData(event.currentTarget).get("name") || "").trim(); if (!next) {setNotice("Informe seu nome para salvar."); return} onName(next); setNotice("Nome atualizado nesta prévia.")}}><Label htmlFor={`${id}-name`}>Como podemos chamar você?</Label><Input id={`${id}-name`} name="name" defaultValue={name} maxLength={24} required autoComplete="off"/><Button type="submit" className="mobile-app-gold">Salvar perfil</Button></form><div className="mobile-app-profile-info"><Heart/><h5>Seus cuidados, em um só lugar.</h5><p>Serviços, profissionais e horários ficam acessíveis pelos menus do aplicativo.</p><Button type="button" variant="ghost" onClick={() => navigate("appointments")}>Ver minha agenda</Button></div><p className="mobile-app-simulation">As alterações ficam apenas nesta demonstração.</p></div>}
        {notice && <div className="mobile-app-notice" role="status" aria-live="polite">{notice}</div>}
      </div>
    </div>
    {screen !== "intro" && screen !== "booking" && <nav className="mobile-app-bottom-nav" aria-label={`Menu do aplicativo ${index + 1}`}>{menu.map(({id: destination, title: name, Icon}) => <Button type="button" variant="ghost" key={destination} aria-current={screen === destination ? "page" : undefined} onClick={() => navigate(destination)}><Icon/><span>{name}</span></Button>)}</nav>}
    <div className="mobile-app-home-indicator" aria-hidden="true"/>
  </div></div><p className="mobile-app-device-label">0{index + 1} / {label}</p></div>;
}

function HairAuraMobileDemo() {
  const [days, setDays] = useState<MobileDay[]>([]), [appointment, setAppointment] = useState<MobileBooking | null>(null);
  const [coupon, setCoupon] = useState(false), [name, setName] = useState("Olívia");
  useEffect(() => {const next = mobileBookingDays(); setDays(next); setAppointment({service: "cut", stylist: "emma", day: next[0], time: "11:00", total: 90})}, []);
  return <section aria-label="Aplicativo móvel: demonstração interativa de salão"><div className="mobile-app-showcase">{[{initial: "intro" as const, label: "Apresentação"}, {initial: "home" as const, label: "Serviços"}, {initial: "booking" as const, label: "Agendamento"}].map((phone, index) => <MobilePhone key={phone.initial} {...phone} index={index} days={days} appointment={appointment} onBooking={setAppointment} coupon={coupon} onCoupon={() => setCoupon(true)} name={name} onName={setName}/>)}</div><div className="mobile-app-caption"><p>Explore os serviços, escolha um profissional e simule um horário.</p><span>Modelo HairAura inspirado na referência. Valores, oferta e agendamentos são demonstrativos.</span></div></section>;
}

export function MobileAppDemo() {
  return <section className="mobile-app-demo" aria-label="Aplicativo móvel: modelos interativos"><div className="mobile-app-toolbar"><b>NexFlow <span>/ aplicativo móvel</span></b><span>EXPERIMENTE AS TELAS</span></div><Tabs defaultValue="salon" className="mobile-app-models"><TabsList className="mobile-app-model-tabs" aria-label="Modelos de aplicativo móvel"><TabsTrigger value="salon">Salão e agendamento</TabsTrigger><TabsTrigger value="fitness">Fitness e comunidade</TabsTrigger><TabsTrigger value="risk">Gerenciamento de riscos</TabsTrigger><TabsTrigger value="delivery">App de entregas</TabsTrigger></TabsList><TabsContent value="salon" className="mobile-app-model-panel"><HairAuraMobileDemo/></TabsContent><TabsContent value="fitness" className="mobile-app-model-panel"><MobileFitnessDemo/></TabsContent><TabsContent value="risk" className="mobile-app-model-panel"><MobileRiskDemo/></TabsContent><TabsContent value="delivery" className="mobile-app-model-panel"><MobileDeliveryDemo/></TabsContent></Tabs></section>;
}
