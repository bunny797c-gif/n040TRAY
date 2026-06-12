'use client';

import { useEffect } from 'react';

export default function HomeScripts() {
  useEffect(() => {
    // FAQ accordion - close others when one opens
    const items = document.querySelectorAll('.faq-item');
    const handlers = [];
    items.forEach((item) => {
      const onToggle = function () {
        if (this.open) {
          items.forEach((o) => { if (o !== this) o.removeAttribute('open'); });
        }
      };
      item.addEventListener('toggle', onToggle);
      handlers.push([item, onToggle]);
    });
    return () => handlers.forEach(([el, fn]) => el.removeEventListener('toggle', fn));
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    // Tag existing sections so they participate in the reveal too
    const autoTargets = document.querySelectorAll(
      '.testimonial-card, .product-card, .nutrition-stat, .nutrition-benefit-item, .why-micro-item, .testimonials-summary, .cta-inner, .faq-item'
    );
    autoTargets.forEach((el) => {
      if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
    });

    // Stagger children inside reveal groups and shared grids
    const groups = document.querySelectorAll(
      '[data-reveal-group], .testimonials-grid, .products-grid, .nutrition-stats-grid, .nutrition-benefits, .faq-right'
    );
    groups.forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        if (child.hasAttribute('data-reveal')) {
          child.style.setProperty('--reveal-delay', `${Math.min(i * 90, 450)}ms`);
        }
      });
    });

    // Enable the hidden initial state only once JS is ready (avoids invisible content without JS)
    document.documentElement.classList.add('js-reveal');

    const targets = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    // Reveal anything already in the viewport immediately
    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-revealed');
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
