// Injects an overlay that outlines every heading (H1–H6) with a coloured border
// and a small tag label — like a "devtools" outline-headings view. Toggled from
// the side panel's Tools tab. Runs in the content script.

const STYLE_ID = 'seo-console-outline-headings';

export function setOutlineHeadings(on: boolean): void {
  const existing = document.getElementById(STYLE_ID);
  if (!on) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    h1,h2,h3,h4,h5,h6{position:relative!important;outline:2px solid var(--sc-oc)!important;outline-offset:1px!important}
    h1{--sc-oc:#ef4444}h2{--sc-oc:#f59e0b}h3{--sc-oc:#10b981}
    h4{--sc-oc:#3b82f6}h5{--sc-oc:#8b5cf6}h6{--sc-oc:#ec4899}
    h1::before,h2::before,h3::before,h4::before,h5::before,h6::before{
      position:absolute!important;top:0!important;left:0!important;transform:translateY(-100%)!important;
      background:var(--sc-oc)!important;color:#fff!important;font:700 10px/1.4 ui-monospace,monospace!important;
      padding:2px 5px!important;border-radius:3px 3px 0 0!important;z-index:2147483647!important;pointer-events:none!important;letter-spacing:.3px!important}
    h1::before{content:'H1'}h2::before{content:'H2'}h3::before{content:'H3'}
    h4::before{content:'H4'}h5::before{content:'H5'}h6::before{content:'H6'}
  `;
  (document.head || document.documentElement).appendChild(style);
}
