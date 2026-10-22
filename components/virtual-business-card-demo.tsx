"use client";

import {useEffect, useId, useRef, useState, type CSSProperties} from "react";
import {CalendarDays, Camera, Check, ChevronRight, Heart, MapPin, MessageCircle, Sparkles, X} from "lucide-react";
import {Dialog as SheetPrimitive} from "radix-ui";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Sheet, SheetClose, SheetDescription, SheetTitle} from "@/components/ui/sheet";

type Panel = "booking" | "services" | "about" | "contact" | "instagram" | "location";
const services = [
  {id: "manicure", name: "Manicure", description: "Cuidado e acabamento para as unhas naturais."},
  {id: "gel", name: "Esmaltação em gel", description: "Escolha de cor e acabamento em gel."},
  {id: "extension", name: "Alongamento", description: "Formato e comprimento definidos com você."},
];
const times = ["09:00", "11:00", "14:00", "16:00"];
const titles: Record<Panel, string> = {
  booking: "Agendamento", services: "Serviços", about: "Sobre mim",
  contact: "Vamos conversar", instagram: "Instagram", location: "Como chegar",
};
const descriptions: Record<Panel, string> = {
  booking: "Escolha um serviço, uma data e um horário para experimentar o agendamento.",
  services: "Opções de exemplo para explorar este cartão de visita.",
  about: "Larissa Almeida · Beauty designer",
  contact: "Prepare uma mensagem para o WhatsApp com sua dúvida ou pedido.",
  instagram: "Uma conexão entre o perfil e o cartão de visita.",
  location: "Informações para planejar sua visita.",
};
const links = [
  {panel: "booking" as const, title: "Agendamento", description: "Agende seu horário e transforme suas unhas.", Icon: CalendarDays},
  {panel: "services" as const, title: "Serviços", description: "Conheça os serviços disponíveis para você.", Icon: Sparkles},
  {panel: "about" as const, title: "Sobre mim", description: "Conheça minha apresentação e meu trabalho.", Icon: Heart},
  {panel: "contact" as const, title: "Fale conosco", description: "Tire dúvidas ou prepare seu pedido pelo WhatsApp.", Icon: MessageCircle},
];

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function VirtualBusinessCardDemo() {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);
  const [minDate, setMinDate] = useState("");
  const [service, setService] = useState("manicure");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [booking, setBooking] = useState<{service: string; date: string; time: string} | null>(null);
  const [draft, setDraft] = useState<{name: string; message: string} | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const slot = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  useEffect(() => {
    const today = new Date();
    setMinDate(localDate(today));
    today.setDate(today.getDate() + 1);
    setDate(localDate(today));
    const element = slot.current;
    if (!element) return;
    const measure = () => element.style.setProperty("--business-card-scale", String(Math.max(.1, Math.min(.86, element.clientWidth / 390))));
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    measure();
    let inView = false;
    const sync = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(entries => {
      inView = entries[0]?.isIntersecting ?? false;
      if (inView) setVisible(true);
      sync();
    }, {threshold: .05});
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => {resize.disconnect(); observer.disconnect(); document.removeEventListener("visibilitychange", sync)};
  }, []);

  function open(next: Panel, button: HTMLButtonElement) {
    trigger.current = button;
    setBooking(null);
    setDraft(null);
    setPanel(next);
  }

  function show(next: Panel) {
    setPanel(next);
    setBooking(null);
    setDraft(null);
    host?.querySelector<HTMLElement>(".business-card-sheet")?.scrollTo({top: 0});
    requestAnimationFrame(() => close.current?.focus({preventScroll: true}));
  }

  return <div className="business-card-demo">
    <div className="business-card-stage">
      <div ref={slot} className={`business-card-slot ${visible ? "business-card-visible" : ""} ${active ? "business-card-active" : ""}`}>
        <div className="business-card-phone" ref={setHost}>
          <div className="business-card-screen" inert={panel !== null} tabIndex={panel ? -1 : 0} aria-label="Cartão de visita de Larissa Almeida. Conteúdo rolável.">
            <div className="business-card-hero">
              <img className="business-card-reference" src="/assets/bio-card/reference.png" width="1044" height="2048" loading="lazy" alt="Larissa Almeida, beauty designer. Unhas que realçam sua beleza e elevam a sua autoestima."/>
              <div className="business-card-light" aria-hidden="true"/>
            </div>
            <div className="business-card-socials" aria-label="Contatos do cartão">
              <span className="business-card-divider" aria-hidden="true"/>
              <Button variant="ghost" type="button" aria-label="Explorar Instagram" onClick={event => open("instagram", event.currentTarget)}><Camera/></Button>
              <Button variant="ghost" type="button" aria-label="Preparar mensagem de contato" onClick={event => open("contact", event.currentTarget)}><MessageCircle/></Button>
              <Button variant="ghost" type="button" aria-label="Ver localização" onClick={event => open("location", event.currentTarget)}><MapPin/></Button>
              <span className="business-card-divider" aria-hidden="true"/>
            </div>
            <h2 className="business-card-slogan">Sua melhor versão,<br/>até nas unhas.</h2>
            <nav className="business-card-links" aria-label="Explore o cartão de visita">
              {links.map(({panel: next, title, description, Icon}, index) => <Button key={next} type="button" variant="ghost" className="business-card-link" style={{"--card-delay": `${220 + index * 90}ms`} as CSSProperties} onClick={event => open(next, event.currentTarget)}>
                <span className="business-card-link-icon"><Icon/></span>
                <span className="business-card-link-copy"><strong>{title}</strong><span>{description}</span></span>
                <span className="business-card-chevron"><ChevronRight/></span>
              </Button>)}
            </nav>
            <div className="business-card-work-photo" role="img" aria-label="Cuidado e acabamento de unhas no atendimento"><img className="business-card-reference" src="/assets/bio-card/reference.png" width="1044" height="2048" loading="lazy" alt=""/></div>
            <footer className="business-card-footer">2026 Larissa Almeida · Beauty designer</footer>
          </div>
          {/* Keep the installed Sheet primitives, but target this phone rather than
              the page-wide portal used by the default SheetContent wrapper. */}
          <Sheet open={panel !== null} modal={false} onOpenChange={isOpen => {if (!isOpen) setPanel(null)}}>
            {host && panel && <SheetPrimitive.Portal container={host}>
              <div className="business-card-panel-backdrop" aria-hidden="true"/>
              <SheetPrimitive.Content className="business-card-sheet" onInteractOutside={event => event.preventDefault()} onOpenAutoFocus={event => {event.preventDefault(); close.current?.focus({preventScroll: true})}} onCloseAutoFocus={event => {event.preventDefault(); requestAnimationFrame(() => trigger.current?.focus({preventScroll: true}))}}>
                <header className="business-card-sheet-header"><div><span className="business-card-eyebrow">LARISSA ALMEIDA</span><SheetTitle>{titles[panel]}</SheetTitle></div><SheetClose asChild><Button ref={close} variant="ghost" type="button" className="business-card-close" aria-label="Fechar painel"><X/></Button></SheetClose></header>
                <SheetDescription>{descriptions[panel]}</SheetDescription>
                <div className="business-card-sheet-body" key={panel}>
                  {panel === "booking" && (booking ? <div className="business-card-feedback" role="status"><Check/><h3>Seu horário de exemplo</h3><dl><div><dt>Serviço</dt><dd>{booking.service}</dd></div><div><dt>Data</dt><dd>{booking.date.split("-").reverse().join("/")}</dd></div><div><dt>Horário</dt><dd>{booking.time}</dd></div></dl><p>Simulação concluída. Nenhuma reserva foi feita.</p><Button type="button" className="business-card-primary" onClick={() => setBooking(null)}>Escolher outro horário</Button></div> : <form className="business-card-form" onSubmit={event => {event.preventDefault(); if (!date || date < localDate(new Date())) return; setBooking({service: services.find(option => option.id === service)!.name, date, time})}}>
                    <fieldset><legend>O que você procura?</legend><RadioGroup value={service} onValueChange={setService} className="business-card-service-options" aria-label="Serviço">{services.map(option => <Label key={option.id} className="business-card-service-option" htmlFor={`${id}-${option.id}`}><RadioGroupItem id={`${id}-${option.id}`} value={option.id}/><span>{option.name}</span></Label>)}</RadioGroup></fieldset>
                    <div><Label htmlFor={`${id}-date`}>Escolha uma data</Label><Input id={`${id}-date`} type="date" value={date} min={minDate || undefined} required onChange={event => setDate(event.target.value)}/></div>
                    <fieldset><legend>Horários de exemplo</legend><RadioGroup value={time} onValueChange={setTime} className="business-card-time-options" aria-label="Horário">{times.map(value => <Label key={value} htmlFor={`${id}-time-${value}`} className="business-card-time-option"><RadioGroupItem id={`${id}-time-${value}`} value={value}/><span>{value}</span></Label>)}</RadioGroup></fieldset>
                    <Button type="submit" className="business-card-primary">Simular agendamento</Button><p className="business-card-form-note">Prévia interativa, sem reserva real.</p>
                  </form>)}
                  {panel === "services" && <div className="business-card-service-list">{services.map(option => <article key={option.id}><Sparkles/><h3>{option.name}</h3><p>{option.description}</p><Button type="button" className="business-card-primary" onClick={() => {setService(option.id); show("booking")}}>Escolher serviço<ChevronRight/></Button></article>)}</div>}
                  {panel === "about" && <div className="business-card-about"><div className="business-card-about-photo" role="img" aria-label="Larissa Almeida"><img src="/assets/bio-card/reference.png" width="1044" height="2048" alt=""/></div><h3>Sua melhor versão,<br/>até nas unhas.</h3><p>Unhas que realçam sua beleza e elevam a sua autoestima.</p><Button type="button" className="business-card-primary" onClick={() => show("services")}>Conhecer os serviços</Button></div>}
                  {panel === "contact" && (draft ? <div className="business-card-feedback" role="status"><MessageCircle/><h3>Sua mensagem está pronta</h3><div className="business-card-message"><strong>{draft.name}</strong><p>{draft.message}</p></div><p>Esta é uma prévia. Nenhuma mensagem foi enviada.</p><Button type="button" className="business-card-primary" onClick={() => setDraft(null)}>Editar mensagem</Button></div> : <form className="business-card-form" onSubmit={event => {event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get("name") || "").trim(), message = String(data.get("message") || "").trim(); if (name && message) setDraft({name, message})}}>
                    <div><Label htmlFor={`${id}-name`}>Seu nome</Label><Input id={`${id}-name`} name="name" value={contactName} onChange={event => setContactName(event.target.value)} required maxLength={60} autoComplete="off" placeholder="Como você se chama?"/></div>
                    <div><Label htmlFor={`${id}-message`}>Sua mensagem</Label><Textarea id={`${id}-message`} name="message" value={contactMessage} onChange={event => setContactMessage(event.target.value)} required maxLength={600} rows={5} placeholder="Qual serviço você gostaria de conhecer?"/></div>
                    <Button type="submit" className="business-card-primary"><MessageCircle/>Preparar mensagem</Button><p className="business-card-form-note">Teste local. Seus dados não são enviados.</p>
                  </form>)}
                  {panel === "instagram" && <div className="business-card-social-preview"><Camera/><h3>Beleza em cada detalhe.</h3><div className="business-card-work-photo" role="img" aria-label="Prévia do trabalho de unhas"><img className="business-card-reference" src="/assets/bio-card/reference.png" width="1044" height="2048" alt=""/></div><p>O perfil do Instagram não foi informado para este modelo.</p><Button type="button" className="business-card-primary" onClick={() => show("services")}>Explorar os serviços</Button></div>}
                  {panel === "location" && <div className="business-card-location"><MapPin/><h3>Planeje seu atendimento.</h3><p>O endereço não foi informado para este modelo.</p><Button type="button" className="business-card-primary" onClick={() => show("contact")}>Perguntar sobre atendimento</Button></div>}
                </div>
              </SheetPrimitive.Content>
            </SheetPrimitive.Portal>}
          </Sheet>
          <div className="business-card-phone-rim" aria-hidden="true"/>
        </div>
      </div>
    </div>
    <div className="bio-caption business-card-caption"><p>Um cartão de visita que você pode explorar.</p><span>Abra os serviços, simule um horário e prepare uma mensagem. Modelo demonstrativo inspirado na referência enviada.</span></div>
  </div>;
}
