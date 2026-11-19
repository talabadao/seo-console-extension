// Runs in the content script. Scrolls to and flashes an element on request.

let current: HTMLElement | null = null;
let prevOutline = '';
let prevOffset = '';

export function highlight(selector: string): boolean {
  clearHighlight();
  let target: HTMLElement | null = null;
  try {
    target = document.querySelector<HTMLElement>(selector);
  } catch {
    return false;
  }
  if (!target) return false;

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  prevOutline = target.style.outline;
  prevOffset = target.style.outlineOffset;
  target.style.outline = '3px solid #ff2d8a';
  target.style.outlineOffset = '2px';
  current = target;
  return true;
}

export function clearHighlight(): void {
  if (!current) return;
  current.style.outline = prevOutline;
  current.style.outlineOffset = prevOffset;
  current = null;
}
