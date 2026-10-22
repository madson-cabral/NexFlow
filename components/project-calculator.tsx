"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateEstimate, estimateRates, formatEstimate, type ServiceType, type Timeline } from "@/lib/project-estimate";

function AnimatedAmount({ value }: { value: number }) {
  const current = useRef(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = current.current;
    const startedAt = performance.now();
    let frame = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 480);
      const next = Math.round(start + (value - start) * (1 - (1 - progress) ** 3));
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <><span aria-hidden="true">{formatEstimate(display)}</span><span className="sr-only">{formatEstimate(value)}</span></>;
}

export function ProjectCalculator() {
  const uid = useId();
  const pagesField = useRef<HTMLDivElement>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("both");
  const [pages, setPages] = useState(5);
  const [needContent, setNeedContent] = useState(false);
  const [needSEO, setNeedSEO] = useState(false);
  const [timeline, setTimeline] = useState<Timeline>("regular");
  const estimate = calculateEstimate({ serviceType, pages, needContent, needSEO, timeline });
  useEffect(() => {
    const thumb = pagesField.current?.querySelector("[data-slot=slider-thumb]");
    thumb?.setAttribute("aria-label", "Número de páginas");
    thumb?.setAttribute("aria-valuetext", `${pages} ${pages === 1 ? "página" : "páginas"}`);
  }, [pages]);

  return (
    <section id="calculator-section" className="project-calculator" aria-labelledby={`${uid}-title`}>
      <header className="calculator-header">
        <p>EXPERIMENTE A CALCULADORA</p>
        <h3 id={`${uid}-title`}>Estime o investimento.</h3>
        <span>Explore o escopo e veja uma simulação em reais.</span>
      </header>
      <div className="calculator-grid">
        <div className="calculator-options">
          <div className="calculator-field">
            <h4 id={`${uid}-service`}>De qual serviço você precisa?</h4>
            <RadioGroup value={serviceType} onValueChange={v => setServiceType(v as ServiceType)} aria-labelledby={`${uid}-service`} className="calculator-radio-group">
              {([["design", "Somente design"], ["development", "Somente desenvolvimento"], ["both", "Design + desenvolvimento"]] as const).map(([value, label]) => (
                <label className="calculator-choice" key={value} data-selected={serviceType === value} htmlFor={`${uid}-${value}`}>
                  <RadioGroupItem value={value} id={`${uid}-${value}`} className="calculator-radio" />
                  <span>{label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="calculator-field" ref={pagesField}>
            <h4 id={`${uid}-pages`}>Número de páginas <span className="pages-value">{pages.toLocaleString("pt-BR")}</span></h4>
            <Slider className="calculator-slider" value={[pages]} onValueChange={v => setPages(v[0])} min={1} max={30} step={1} aria-labelledby={`${uid}-pages`} />
            <div className="calculator-range-labels" aria-hidden="true"><span>1 página</span><span>30 páginas</span></div>
          </div>
          <div className="calculator-field">
            <h4>Serviços adicionais</h4>
            <div className="calculator-addons">
              <label className="calculator-choice" data-selected={needContent} htmlFor={`${uid}-content`}>
                <Checkbox id={`${uid}-content`} checked={needContent} onCheckedChange={v => setNeedContent(v === true)} className="calculator-checkbox" />
                <span>Preciso de ajuda com o conteúdo</span><small>+{formatEstimate(estimateRates.content)}/página</small>
              </label>
              <label className="calculator-choice" data-selected={needSEO} htmlFor={`${uid}-seo`}>
                <Checkbox id={`${uid}-seo`} checked={needSEO} onCheckedChange={v => setNeedSEO(v === true)} className="calculator-checkbox" />
                <span>Quero otimizar o site para buscas (SEO)</span><small>+{formatEstimate(estimateRates.seo)}/página</small>
              </label>
            </div>
          </div>
          <div className="calculator-field">
            <h4 id={`${uid}-timeline`}>Qual prazo você tem em mente?</h4>
            <RadioGroup value={timeline} onValueChange={v => setTimeline(v as Timeline)} aria-labelledby={`${uid}-timeline`} className="calculator-radio-group">
              {([
                ["rush", "Prioridade de 7 dias", `+${formatEstimate(estimateRates.rush)}/página`],
                ["fast", "Prioridade de 14 dias", `+${formatEstimate(estimateRates.fast)}/página`],
                ["regular", "Prazo a combinar", "Sem adicional"],
              ] as const).map(([value, label, extra]) => (
                <label className="calculator-choice" key={value} data-selected={timeline === value} htmlFor={`${uid}-${value}`}>
                  <RadioGroupItem value={value} id={`${uid}-${value}`} className="calculator-radio" />
                  <span>{label}</span><small>{extra}</small>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
        <div className="calculator-results">
          <div className="calculator-results-heading">
            <h4>Estimativa de custo</h4>
            <p>O total acompanha as opções que você escolher.</p>
          </div>
          <div className="calculator-price-card" style={{ "--card-order": 0 } as CSSProperties}>
            <p>Projeto base</p>
            <strong><AnimatedAmount value={estimate.base} /></strong>
            <span>{pages} {pages === 1 ? "página" : "páginas"} · {serviceType === "both" ? "design e desenvolvimento" : serviceType === "design" ? "design" : "desenvolvimento"}</span>
          </div>
          <div className="calculator-price-card" style={{ "--card-order": 1 } as CSSProperties}>
            <p>Serviços adicionais</p>
            <strong><AnimatedAmount value={estimate.extras} /></strong>
            <span>{estimate.extras ? [needContent && "Conteúdo", needSEO && "SEO", timeline !== "regular" && "Prioridade"].filter(Boolean).join(" · ") : "Nenhum adicional selecionado."}</span>
          </div>
          <div className="calculator-price-card calculator-current-price" style={{ "--card-order": 2 } as CSSProperties}>
            <div key={estimate.total} className="calculator-price-flash" aria-hidden="true" />
            <p>Total estimado · simulação</p>
            <strong aria-live="polite" aria-atomic="true"><AnimatedAmount value={estimate.total} /></strong>
            <span>Atualizada conforme suas escolhas.</span>
          </div>
          <p className="calculator-disclaimer">Valores de simulação em reais, sem compromisso comercial. Integrações, funcionalidades e complexidade podem alterar o investimento. Preço e prazo finais dependem da avaliação do projeto.</p>
        </div>
      </div>
    </section>
  );
}
