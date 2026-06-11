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

  return null;
}
