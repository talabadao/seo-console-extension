// A measuring-ruler overlay (content script). When on, the page shows crosshair
// guides that follow the cursor with a live x/y readout, and you can drag to
// measure a box (width × height). Toggle off in the Tools tab to interact again.

const ID = 'seo-console-ruler';
const ACCENT = '#ff2d8a';
const FILL = 'rgba(45,212,191,0.15)';
const EDGE = '#14b8a6';

let cleanup: (() => void) | null = null;

export function setRuler(on: boolean): void {
  if (!on) {
    document.getElementById(ID)?.remove();
    cleanup?.();
    cleanup = null;
    return;
  }
  if (document.getElementById(ID)) return;

  const root = document.createElement('div');
  root.id = ID;
  css(root, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    cursor: 'crosshair',
    background: 'transparent',
  });

  const vline = add(root, { position: 'fixed', top: '0', bottom: '0', width: '1px', background: ACCENT, pointerEvents: 'none' });
  const hline = add(root, { position: 'fixed', left: '0', right: '0', height: '1px', background: ACCENT, pointerEvents: 'none' });
  const readout = add(root, chip());
  const box = add(root, {
    position: 'fixed',
    border: `1px solid ${EDGE}`,
    background: FILL,
    display: 'none',
    pointerEvents: 'none',
  });
  const boxLabel = add(root, { ...chip(), display: 'none', background: EDGE });
  const bar = add(root, {
    position: 'fixed',
    left: '0',
    right: '0',
    bottom: '0',
    padding: '4px 10px',
    background: '#111',
    color: '#fff',
    font: '600 11px/1.5 ui-sans-serif,system-ui,sans-serif',
    pointerEvents: 'none',
    textAlign: 'center',
  });
  bar.textContent = 'Ruler on — drag to measure. Turn it off in Tools to use the page.';

  (document.documentElement || document.body).appendChild(root);

  let dragging = false;
  let sx = 0;
  let sy = 0;

  const onMove = (e: MouseEvent) => {
    vline.style.left = `${e.clientX}px`;
    hline.style.top = `${e.clientY}px`;
    css(readout, { left: `${e.clientX + 12}px`, top: `${e.clientY + 12}px`, display: 'block' });
    readout.textContent = `${e.clientX}, ${e.clientY}`;
    if (dragging) {
      const x = Math.min(sx, e.clientX);
      const y = Math.min(sy, e.clientY);
      const w = Math.abs(e.clientX - sx);
      const h = Math.abs(e.clientY - sy);
      css(box, { display: 'block', left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
      css(boxLabel, { display: 'block', left: `${x + 4}px`, top: `${y + 4}px` });
      boxLabel.textContent = `${w} × ${h}`;
    }
  };
  const onDown = (e: MouseEvent) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    e.preventDefault();
  };
  const onUp = () => {
    dragging = false;
  };

  root.addEventListener('mousemove', onMove);
  root.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);

  cleanup = () => {
    root.removeEventListener('mousemove', onMove);
    root.removeEventListener('mousedown', onDown);
    window.removeEventListener('mouseup', onUp);
  };
}

function css(el: HTMLElement, s: Partial<CSSStyleDeclaration>) {
  Object.assign(el.style, s);
}
function add(parent: HTMLElement, s: Partial<CSSStyleDeclaration>): HTMLElement {
  const el = document.createElement('div');
  css(el, s);
  parent.appendChild(el);
  return el;
}
function chip(): Partial<CSSStyleDeclaration> {
  return {
    position: 'fixed',
    padding: '2px 6px',
    borderRadius: '4px',
    background: '#111',
    color: '#fff',
    font: '600 11px/1.4 ui-monospace,monospace',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: '2147483647',
  };
}
