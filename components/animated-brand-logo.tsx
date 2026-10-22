"use client";

import {useEffect, useRef, useState, type MouseEventHandler} from "react";

export function AnimatedBrandLogo({onClick, paused = false}: {onClick?: MouseEventHandler<HTMLAnchorElement>; paused?: boolean}) {
  const anchor = useRef<HTMLAnchorElement>(null), video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = video.current, link = anchor.current;
    if (!element || !link || failed) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false, disposed = false;
    const update = () => {
      if (disposed) return;
      if (visible && !paused && !document.hidden && !preference.matches) void element.play().catch(() => {});
      else element.pause();
    };
    const observer = new IntersectionObserver(entries => {visible = entries.some(entry => entry.isIntersecting); update()}, {threshold: .01});
    observer.observe(link); preference.addEventListener("change", update); document.addEventListener("visibilitychange", update); update();
    return () => {disposed = true; observer.disconnect(); preference.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); element.pause()};
  }, [paused, failed]);

  return <a className="logo brand-video-logo" href="#inicio" aria-label="NexFlow início" onClick={onClick} ref={anchor}>
    <span className="brand-loop-mark" aria-hidden="true">
      <img src="/assets/brand/nexflow-logo-poster.jpg" alt="" width="720" height="406"/>
      {!failed && <video className={ready ? "brand-loop-ready" : ""} ref={video} src="/assets/brand/nexflow-logo-loop.mp4" poster="/assets/brand/nexflow-logo-poster.jpg" autoPlay muted loop playsInline preload="metadata" tabIndex={-1} onLoadedData={() => setReady(true)} onError={() => setFailed(true)}/>}
    </span>
    <span className="brand-loop-name" aria-hidden="true">Nex<span>Flow</span></span>
  </a>;
}
