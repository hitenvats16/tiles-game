import { useEffect, useRef, useState } from 'react';

// Centers a square inside its parent — width = height = min(parentWidth, parentHeight).
// Required because CSS `aspect-square` can't pick the limiting axis on its own.
export default function SquareSlot({ children, className = '' }) {
  const ref = useRef(null);
  const [side, setSide] = useState(0);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSide(Math.max(0, Math.floor(Math.min(r.width, r.height))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{ width: side, height: side }}
    >
      {side > 0 && children}
    </div>
  );
}
