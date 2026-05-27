import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from '../content/resume';
import Chapter from './Chapter';

gsap.registerPlugin(ScrollTrigger);

export default function Journey() {
  const rootRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const lenis = new Lenis({
      wrapper: root,
      content: root,
      duration: 1.35,
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    lenis.on('scroll', ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(root, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: root.style.transform ? 'transform' : 'fixed',
    });

    const raf = (time) => lenis.raf(time);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const sections = gsap.utils.toArray('.chapter', root);
    sections.forEach((section, i) => {
      ScrollTrigger.create({
        trigger: section,
        scroller: root,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveIndex(i),
        onEnterBack: () => setActiveIndex(i),
      });
    });

    ScrollTrigger.create({
      scroller: root,
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: 1 / Math.max(sections.length - 1, 1),
        duration: { min: 0.35, max: 0.75 },
        delay: 0.05,
        ease: 'power2.inOut',
      },
    });

    ScrollTrigger.addEventListener('refresh', () => lenis.resize());
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      ScrollTrigger.removeEventListener('refresh', () => lenis.resize());
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="journey-shell">
      <nav className="chapter-nav" aria-label="Chapters">
        {chapters.map((ch, i) => (
          <a
            key={ch.id}
            href={`#${ch.id}`}
            className={activeIndex === i ? 'nav-dot nav-dot--active' : 'nav-dot'}
            aria-label={ch.title}
            aria-current={activeIndex === i ? 'true' : undefined}
          >
            <span>{ch.number}</span>
          </a>
        ))}
      </nav>

      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ height: `${((activeIndex + 1) / chapters.length) * 100}%` }}
        />
      </div>

      <main className="journey" ref={rootRef}>
        {chapters.map((chapter, index) => (
          <Chapter
            key={chapter.id}
            chapter={chapter}
            index={index}
            total={chapters.length}
            activeIndex={activeIndex}
          />
        ))}
      </main>
    </div>
  );
}
