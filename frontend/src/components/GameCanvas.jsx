import { useEffect, useRef, useState, useCallback } from 'react';

const MAX_SCALE = 40;

export default function GameCanvas({
  gridSize,
  grid,
  colors,
  selfId,
  selfColor,
  disabled,
  onClaim,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const viewRef = useRef({ scale: 1, tx: 0, ty: 0 });
  const [hover, setHover] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pointers = useRef(new Map());
  const dragging = useRef(null);
  const pinch = useRef(null);
  // Mirrors latest size/gridSize/minScale for zoomAt + clampView so that
  // stale closures inside the native wheel listener still read fresh values.
  const cfgRef = useRef({ w: 0, h: 0, gridSize: 0, minScale: 0 });

  // Resize observer
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minScale = size.w && size.h && gridSize
    ? Math.min(size.w, size.h) / gridSize
    : 0;
  cfgRef.current = { w: size.w, h: size.h, gridSize, minScale };

  function clampView() {
    const view = viewRef.current;
    const { w, h, gridSize: gs } = cfgRef.current;
    const gw = gs * view.scale;
    view.tx = gw <= w
      ? (w - gw) / 2
      : Math.min(0, Math.max(w - gw, view.tx));
    view.ty = gw <= h
      ? (h - gw) / 2
      : Math.min(0, Math.max(h - gw, view.ty));
  }

  // Fit grid initially
  useEffect(() => {
    if (!size.w || !size.h || !gridSize) return;
    viewRef.current.scale = minScale;
    clampView();
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h, gridSize]);

  // Setup canvas resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.w * dpr);
    canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    const { scale, tx, ty } = viewRef.current;

    // Paper border for grid
    ctx.save();
    ctx.translate(tx, ty);
    ctx.fillStyle = '#fdfaf2';
    ctx.fillRect(0, 0, gridSize * scale, gridSize * scale);

    // Visible bounds
    const x0 = Math.max(0, Math.floor(-tx / scale));
    const y0 = Math.max(0, Math.floor(-ty / scale));
    const x1 = Math.min(gridSize, Math.ceil((w - tx) / scale));
    const y1 = Math.min(gridSize, Math.ceil((h - ty) / scale));

    // Cells
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const owner = grid[`${x}:${y}`];
        if (!owner) continue;
        const color = colors[owner] || '#888';
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale + 0.5, scale + 0.5);
      }
    }

    // Grid lines (only when zoomed enough)
    if (scale >= 4) {
      ctx.strokeStyle = 'rgba(31,29,29,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = x0; x <= x1; x++) {
        ctx.moveTo(x * scale + 0.5, y0 * scale);
        ctx.lineTo(x * scale + 0.5, y1 * scale);
      }
      for (let y = y0; y <= y1; y++) {
        ctx.moveTo(x0 * scale, y * scale + 0.5);
        ctx.lineTo(x1 * scale, y * scale + 0.5);
      }
      ctx.stroke();
    }

    // Outer border (sketchy)
    ctx.strokeStyle = '#1f1d1d';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, gridSize * scale, gridSize * scale);

    // Hover highlight
    if (hover && !disabled) {
      ctx.fillStyle = selfColor + 'aa';
      ctx.fillRect(hover.x * scale, hover.y * scale, scale, scale);
      ctx.strokeStyle = '#1f1d1d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hover.x * scale + 0.5, hover.y * scale + 0.5, scale - 1, scale - 1);
    }

    ctx.restore();
  }, [grid, colors, gridSize, hover, disabled, selfColor]);

  useEffect(() => { draw(); }, [draw]);

  function screenToCell(clientX, clientY) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const { scale, tx, ty } = viewRef.current;
    const x = Math.floor((px - tx) / scale);
    const y = Math.floor((py - ty) / scale);
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return null;
    return { x, y };
  }

  function zoomAt(clientX, clientY, factor) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const view = viewRef.current;
    const { minScale: ms } = cfgRef.current;
    if (!ms) return;
    const effectiveMax = Math.max(MAX_SCALE, ms);
    const nextScale = Math.max(ms, Math.min(effectiveMax, view.scale * factor));
    const ratio = nextScale / view.scale;
    view.tx = px - (px - view.tx) * ratio;
    view.ty = py - (py - view.ty) * ratio;
    view.scale = nextScale;
    clampView();
    draw();
  }

  // Native wheel listener (React's onWheel is passive in React 17+)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function onWheel(e) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      zoomAt(e.clientX, e.clientY, factor);
    }
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize]);

  function handlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
      };
      dragging.current = null;
      return;
    }

    dragging.current = {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      panMode: e.button === 1 || e.shiftKey || e.button === 2,
    };
  }

  function handlePointerMove(e) {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = dist / pinch.current.dist;
      zoomAt(pinch.current.mx, pinch.current.my, factor);
      pinch.current.dist = dist;
      pinch.current.mx = (a.x + b.x) / 2;
      pinch.current.my = (a.y + b.y) / 2;
      return;
    }

    const drag = dragging.current;
    if (drag) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (drag.panMode || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4) {
        drag.moved = true;
        viewRef.current.tx += dx;
        viewRef.current.ty += dy;
        clampView();
        drag.x = e.clientX;
        drag.y = e.clientY;
        draw();
      }
    } else {
      const cell = screenToCell(e.clientX, e.clientY);
      setHover(cell);
    }
  }

  async function handlePointerUp(e) {
    const drag = dragging.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    dragging.current = null;
    if (!drag) return;
    if (drag.moved || drag.panMode) return;
    if (disabled) return;
    const cell = screenToCell(e.clientX, e.clientY);
    if (!cell) return;
    await onClaim?.(cell.x, cell.y);
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full bg-paper border-2 border-ink rounded-2xl overflow-hidden no-select touch-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHover(null)}
        className="block w-full h-full cursor-crosshair"
      />
      <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-10">
        <button
          onClick={() => {
            const r = wrapRef.current.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.4);
          }}
          className="scribble-btn !px-3 !py-1"
        >
          +
        </button>
        <button
          onClick={() => {
            const r = wrapRef.current.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.4);
          }}
          className="scribble-btn !px-3 !py-1"
        >
          −
        </button>
      </div>
      {hover && !disabled && (
        <div className="absolute top-3 left-3 bg-paper border-2 border-ink rounded-xl px-2 py-1 font-sketch text-sm z-10">
          ({hover.x}, {hover.y})
        </div>
      )}
    </div>
  );
}
