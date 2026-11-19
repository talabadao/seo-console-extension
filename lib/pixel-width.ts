// Google truncates SERP snippets by *pixel width*, not character count.
// Measuring in pixels (with Google's approximate fonts) is far more accurate
// than counting characters — especially for accented scripts.
//
// Approximate desktop fonts Google renders titles/descriptions with:
//   title:       ~20px Arial
//   description: ~14px Arial
// Truncation thresholds are heuristics derived from observed SERPs.

export const TITLE_FONT = '20px Arial, sans-serif';
export const DESC_FONT = '14px Arial, sans-serif';

export const SERP = {
  titleMaxPx: 600,
  titleMinPx: 150,
  descMaxPx: 920,
  descMinPx: 430,
} as const;

let ctx: CanvasRenderingContext2D | null | undefined;

function getCtx(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx;
  try {
    const canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  return ctx;
}

export function pixelWidth(text: string, font: string): number {
  if (!text) return 0;
  const c = getCtx();
  if (!c) return Math.round(text.length * 7); // crude fallback
  c.font = font;
  return Math.round(c.measureText(text).width);
}
