"use client";

import {useEffect, useState, type CSSProperties} from "react";
import {Menu, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {AnimatedBrandLogo} from "@/components/animated-brand-logo";
import {Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";

const links = [{title: "Soluções", id: "solucoes"}, {title: "Como trabalhamos", id: "metodo"}, {title: "Aplicações", id: "aplicacoes"}];

export function SiteNavigation() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width:761px)");
    const close = () => {if (desktop.matches) setOpen(false)};
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  function logo(paused = false) {return <AnimatedBrandLogo onClick={() => setOpen(false)} paused={paused}/>}
  return <Sheet open={open} onOpenChange={setOpen}><header className="header nexflow-hero-header">{logo(open)}<nav className="nav" aria-label="Navegação principal">{links.map(link => <a href={`#${link.id}`} key={link.id}>{link.title}</a>)}<a href="#contato" className="nav-contact">Vamos conversar</a></nav><SheetTrigger asChild><Button className="menu-button" variant="ghost" aria-label="Abrir menu de navegação"><Menu/></Button></SheetTrigger></header><SheetContent side="right" showCloseButton={false} className="nexflow-mobile-sheet"><SheetHeader className="nexflow-sheet-heading"><SheetTitle className="sr-only">Navegação NexFlow</SheetTitle><SheetDescription className="sr-only">Escolha uma seção do site ou converse sobre seu projeto.</SheetDescription><div>{logo()}<SheetClose asChild><Button type="button" variant="ghost" className="nexflow-sheet-close" aria-label="Fechar menu de navegação"><X/></Button></SheetClose></div></SheetHeader><nav className="nexflow-sheet-links" aria-label="Navegação no celular">{links.map((link, index) => <a href={`#${link.id}`} key={link.id} onClick={() => setOpen(false)} style={{"--nav-delay": `${.18 + index * .07}s`} as CSSProperties}>{link.title}</a>)}</nav><div className="nexflow-sheet-actions"><a href="#contato" onClick={() => setOpen(false)} className="cta primary">Vamos conversar</a></div></SheetContent></Sheet>;
}
