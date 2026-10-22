"use client";

import {useEffect, useRef} from "react";

export function ReferenceHero({onContact}: {onContact: (detail: {station: number; name: string}) => void}) {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const callback = useRef(onContact);
  const visible = useRef(true);
  callback.current = onContact;

  function syncVisibility() {
    frame.current?.contentWindow?.postMessage({type: "nexflow:hero-visibility", active: visible.current && !document.hidden}, "*");
  }

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== "nexflow:hero-action") return;
      if (event.data.action === "contact") {
        const station = Number.isInteger(event.data.station) && event.data.station >= 0 && event.data.station <= 6 ? event.data.station : 0;
        const name = typeof event.data.name === "string" ? event.data.name.trim().slice(0, 100) : "";
        callback.current({station, name});
        requestAnimationFrame(() => {
          document.getElementById("contato")?.scrollIntoView({block: "start"});
          document.getElementById("contact")?.focus({preventScroll: true});
        });
      } else if (event.data.action === "explore") {
        document.getElementById("rotina")?.scrollIntoView({block: "start"});
      }
    };
    const observer = new IntersectionObserver(entries => {
      visible.current = entries.some(entry => entry.isIntersecting);
      syncVisibility();
    }, {threshold: .01});
    if (section.current) observer.observe(section.current);
    window.addEventListener("message", receive);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      observer.disconnect();
      window.removeEventListener("message", receive);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  return <section id="inicio" className="nexflow-reference-hero" ref={section} aria-label="NexFlow: ecossistema interativo em 3D">
    <h1 className="sr-only">Menos trabalho manual. Mais controle da operação.</h1>
    <iframe ref={frame} src="/assets/hero-immersive/index.html" title="NexFlow — sete estações do ecossistema 3D" className="nexflow-reference-frame" sandbox="allow-scripts allow-same-origin" allow="autoplay; fullscreen" loading="eager" onLoad={syncVisibility}/>
    <a className="nexflow-reference-skip" href="#rotina">Continuar para o conteúdo do site</a>
  </section>;
}
