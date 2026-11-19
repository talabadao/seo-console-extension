/**
 * Build a reasonably stable, unique-ish CSS selector for an element so the
 * side panel can ask the content script to scroll to and highlight it.
 */
export function cssPath(el: Element): string {
  if (el.id && isUniqueId(el)) return `#${CSS.escape(el.id)}`;

  const parts: string[] = [];
  let node: Element | null = el;
  let depth = 0;

  while (node && node.nodeType === 1 && depth < 8) {
    if (node.id && isUniqueId(node)) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    let part = node.nodeName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (c) => c.nodeName === node!.nodeName,
      );
      if (sameTag.length > 1) {
        part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
    }
    parts.unshift(part);
    node = parent;
  }

  return parts.join(' > ');
}

function isUniqueId(el: Element): boolean {
  try {
    return !!el.id && el.ownerDocument.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1;
  } catch {
    return false;
  }
}
