"use client";
import { useEffect } from "react";
import styles from "./below-hero-motion.module.css";

export function BelowHeroMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("main");
    if (!root) return;
    root.classList.add(styles.root);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    root.dataset.motion = reduced.matches ? "reduced" : "full";
    const sections = Array.from(root.querySelectorAll<HTMLElement>(".mosaic-section, .mosaic-flow"));
    const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => {
      entry.target.classList.toggle("below-hero-in-view", entry.isIntersecting);
      if (entry.isIntersecting) reveal.unobserve(entry.target);
    }), { threshold: 0.08, rootMargin: "0px 0px -8%" });
    sections.forEach((section) => reveal.observe(section));
    const onMotionChange = () => { root.dataset.motion = reduced.matches ? "reduced" : "full"; };
    reduced.addEventListener?.("change", onMotionChange);
    return () => { reveal.disconnect(); reduced.removeEventListener?.("change", onMotionChange); root.classList.remove(styles.root); };
  }, []);
  return null;
}
