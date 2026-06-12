'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const LEAF_PATH = 'M12 21c-5-4.5-8-8.5-8-12a8 8 0 0 1 16 0c0 3.5-3 7.5-8 12z';

export default function PremiumMotion() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {});
    const cleanups = [];

    /* ── 1. Lenis smooth scrolling, synced with ScrollTrigger ── */
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => { gsap.ticker.remove(raf); lenis.destroy(); });

    /* ── 2. Hero cinematics: word-by-word headline reveal ── */
    const title = document.querySelector('.hero-title');
    if (title && !title.dataset.split) {
      title.dataset.split = '1';
      const splitWords = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
              const w = document.createElement('span');
              w.className = 'hero-word';
              w.textContent = part;
              frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
            splitWords(child);
          }
        });
      };
      splitWords(title);
      gsap.fromTo('.hero-word',
        { yPercent: 110, opacity: 0, rotateZ: 2 },
        { yPercent: 0, opacity: 1, rotateZ: 0, duration: 0.9, ease: 'power4.out', stagger: 0.07, delay: 0.15 }
      );
      gsap.fromTo('.hero-subtitle, .button-group, .badges',
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.12, delay: 0.55 }
      );
    }

    /* ── 3. Parallax layers ── */
    const px = (sel, y) => {
      document.querySelectorAll(sel).forEach((el) => {
        // Overscale so the shifting image never exposes its container's background
        gsap.set(el, { scale: 1 + Math.abs(y) / 100 * 2, transformOrigin: 'center' });
        gsap.to(el, {
          yPercent: y,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
      });
    };
    px('.product-image img', -8);
    px('.why-micro-center img', -10);

    /* ── 4. Count-up stats ── */
    const statEls = document.querySelectorAll('.stat-number, .testimonials-summary .summary-stat strong');
    statEls.forEach((el) => {
      const original = el.textContent;
      const m = original.match(/(\d+(?:\.\d+)?)/);
      if (!m) return;
      const target = parseFloat(m[1]);
      const decimals = (m[1].split('.')[1] || '').length;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onStart: () => { el.style.opacity = 1; },
        onUpdate: () => {
          el.textContent = original.replace(m[1], obj.v.toFixed(decimals));
        },
        onComplete: () => { el.textContent = original; },
      });
    });

    /* ── 5. How-It-Works circles pop in sequence ── */
    const circles = gsap.utils.toArray('.ns-how-circle');
    if (circles.length) {
      gsap.fromTo(circles,
        { scale: 0.6, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.15,
          scrollTrigger: { trigger: '.ns-how-grid', start: 'top 80%', once: true },
        }
      );
    }

    /* ── 5b. Vine dividers draw themselves on scroll ── */
    document.querySelectorAll('.vine-divider').forEach((divider) => {
      const path = divider.querySelector('.vine-path');
      if (!path) return;
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger: divider, start: 'top 92%', end: 'top 45%', scrub: 0.5 },
      });
      gsap.fromTo(divider.querySelectorAll('.vine-leaf-d'),
        { scale: 0, opacity: 0, transformOrigin: 'center' },
        {
          scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.15,
          scrollTrigger: { trigger: divider, start: 'top 70%', once: true },
        }
      );
    });

    /* ── 5c. Pinned storytelling: How It Works steps spotlight in sequence ── */
    if (window.matchMedia('(min-width: 992px)').matches) {
      const steps = gsap.utils.toArray('.ns-how-step');
      if (steps.length) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.ns-how',
            start: 'top top',
            end: '+=130%',
            pin: true,
            scrub: 0.4,
          },
        });
        steps.forEach((step, i) => {
          tl.to(step, { '--step-glow': 1, scale: 1.05, duration: 0.6, ease: 'power2.out' }, i)
            .to(step, { scale: 1, duration: 0.5, ease: 'power2.in' }, i + 0.7);
        });
      }
    }

    /* ── 6. Magnetic CTAs (fine pointers only) ── */
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.btn-primary').forEach((btn) => {
        const strength = 8;
        const onMove = (e) => {
          const r = btn.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
          const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
          gsap.to(btn, { x: x * strength, y: y * strength, duration: 0.35, ease: 'power2.out' });
        };
        const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
        btn.addEventListener('mousemove', onMove);
        btn.addEventListener('mouseleave', onLeave);
        cleanups.push(() => { btn.removeEventListener('mousemove', onMove); btn.removeEventListener('mouseleave', onLeave); });
      });
    }

    /* ── 6b. 3D tilt on product cards (fine pointers only) ── */
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.product-card').forEach((card) => {
        const onMove = (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, {
            rotateY: x * 7,
            rotateX: -y * 7,
            transformPerspective: 900,
            duration: 0.4,
            ease: 'power2.out',
          });
        };
        const onLeave = () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
        card.addEventListener('mousemove', onMove);
        card.addEventListener('mouseleave', onLeave);
        cleanups.push(() => { card.removeEventListener('mousemove', onMove); card.removeEventListener('mouseleave', onLeave); });
      });
    }

    /* ── 7. Floating leaf particles in the hero ── */
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg && !heroBg.querySelector('.hero-leaves')) {
      const layer = document.createElement('div');
      layer.className = 'hero-leaves';
      layer.setAttribute('aria-hidden', 'true');
      const leaves = [];
      for (let i = 0; i < 9; i++) {
        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        leaf.setAttribute('viewBox', '0 0 24 24');
        leaf.classList.add('hero-leaf');
        leaf.innerHTML = `<path d="${LEAF_PATH}" />`;
        const size = gsap.utils.random(10, 26);
        gsap.set(leaf, {
          width: size,
          height: size,
          left: `${gsap.utils.random(2, 96)}%`,
          top: `${gsap.utils.random(5, 90)}%`,
          opacity: gsap.utils.random(0.12, 0.3),
          rotation: gsap.utils.random(-60, 60),
        });
        layer.appendChild(leaf);
        leaves.push(leaf);
      }
      heroBg.appendChild(layer);
      leaves.forEach((leaf) => {
        gsap.to(leaf, {
          y: () => gsap.utils.random(-30, 30),
          x: () => gsap.utils.random(-20, 20),
          rotation: `+=${gsap.utils.random(-40, 40)}`,
          duration: gsap.utils.random(5, 9),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: gsap.utils.random(0, 2),
        });
      });
      cleanups.push(() => layer.remove());
    }

    return () => {
      cleanups.forEach((fn) => fn());
      ScrollTrigger.getAll().forEach((st) => st.kill());
      ctx.revert();
    };
  }, []);

  return null;
}
