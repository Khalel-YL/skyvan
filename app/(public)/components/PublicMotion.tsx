"use client";

import { useEffect, useRef } from "react";

export function PublicMotion({ children, className = "" }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container) return;

    container.classList.add("is-ready");
    const items = Array.from(container.querySelectorAll<HTMLElement>("[data-sv-reveal]"));
    if (items.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10%", threshold: 0.08 });

    items.forEach((item, index) => {
      item.style.setProperty("--sv-reveal-delay", `${Math.min(index, 5) * 70}ms`);
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, []);

  return <div ref={root} className={className} data-sv-motion-root>{children}</div>;
}
