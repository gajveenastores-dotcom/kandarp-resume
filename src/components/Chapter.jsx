import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profile } from '../content/resume';

gsap.registerPlugin(ScrollTrigger);

function Block({ block }) {
  switch (block.type) {
    case 'lead':
      return <p className="chapter-lead">{block.text}</p>;
    case 'paragraph':
      return <p className="chapter-p">{block.text}</p>;
    case 'quote':
      return <blockquote className="chapter-quote">{block.text}</blockquote>;
    case 'highlight':
      return <p className="chapter-highlight">{block.text}</p>;
    case 'meta':
      return (
        <dl className="chapter-meta">
          {block.items.map((item) => (
            <div key={item.label} className="chapter-meta-row">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      );
    case 'timeline':
      return (
        <div className="chapter-timeline">
          {block.items.map((item) => (
            <article key={`${item.period}-${item.role}`} className="timeline-card">
              <time>{item.period}</time>
              <h3>{item.role}</h3>
              <p className="timeline-org">{item.org}</p>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      );
    case 'list':
      return (
        <div className="chapter-list-block">
          {block.title && <h3 className="chapter-subhead">{block.title}</h3>}
          <ul>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case 'chips':
      return (
        <div className="chapter-chips">
          {block.title && <h3 className="chapter-subhead">{block.title}</h3>}
          <div className="chip-row">
            {block.items.map((item) => (
              <span key={item} className="chip">{item}</span>
            ))}
          </div>
        </div>
      );
    case 'stats':
      return (
        <div className="chapter-stats">
          {block.items.map((item) => (
            <div key={item.label} className="stat-card">
              <span className="stat-value">{item.value}</span>
              <span className="stat-label">{item.label}</span>
            </div>
          ))}
        </div>
      );
    case 'links':
      return (
        <div className="chapter-links">
          {block.items.map((item) => (
            <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </a>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export default function Chapter({ chapter, index, total, activeIndex }) {
  const sectionRef = useRef(null);
  const innerRef = useRef(null);
  const isFirst = index === 0;

  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return undefined;

    const ctx = gsap.context(() => {
        gsap.fromTo(
        inner.querySelectorAll('.chapter-animate'),
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            scroller: section.closest('.journey'),
            start: 'top 72%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [chapter.id]);

  return (
    <section
      ref={sectionRef}
      className={`chapter ${activeIndex === index ? 'chapter--active' : ''}`}
      id={chapter.id}
      data-chapter={index}
      aria-label={chapter.title}
    >
      <div className="chapter-vignette" />
      <div className="chapter-inner" ref={innerRef}>
        <div className="chapter-header chapter-animate">
          <span className="chapter-number">{chapter.number}</span>
          <span className="chapter-subtitle">{chapter.subtitle}</span>
          <h2 className="chapter-title">{chapter.title}</h2>
        </div>

        <div className="chapter-body">
          {isFirst && (
            <div className="chapter-hero chapter-animate">
              <p className="chapter-name">{profile.name}</p>
              <p className="chapter-headline">{profile.headline}</p>
            </div>
          )}
          {chapter.blocks.map((block, i) => (
            <div key={i} className="chapter-animate">
              <Block block={block} />
            </div>
          ))}
        </div>

        {index < total - 1 && (
          <p className="chapter-scroll-hint chapter-animate">Scroll</p>
        )}
      </div>
    </section>
  );
}
