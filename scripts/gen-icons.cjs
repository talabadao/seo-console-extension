// Generates lib/tech/icons.ts from simple-icons (CC0). Maps detected tech names
// to brand logos for nominative identification (like Wappalyzer). Run: node this.
const fs = require('fs');
const si = require('simple-icons');
const bySlug = {};
for (const v of Object.values(si)) if (v && v.slug) bySlug[v.slug] = v;

// tech name (must match rules.ts) -> simple-icons slug candidates (first that resolves wins)
const MAP = {
  WordPress: ['wordpress'],
  Drupal: ['drupal'],
  Joomla: ['joomla'],
  Ghost: ['ghost'],
  Wix: ['wix'],
  Squarespace: ['squarespace'],
  Webflow: ['webflow'],
  WooCommerce: ['woocommerce'],
  Shopify: ['shopify'],
  Magento: ['magento'],
  Elementor: ['elementor'],
  'Yoast SEO': ['yoast'],
  'Next.js': ['nextdotjs'],
  'Nuxt.js': ['nuxtdotjs', 'nuxt'],
  Gatsby: ['gatsby'],
  Astro: ['astro'],
  Laravel: ['laravel'],
  React: ['react'],
  'Vue.js': ['vuedotjs'],
  Angular: ['angular'],
  Svelte: ['svelte'],
  'Alpine.js': ['alpinedotjs'],
  jQuery: ['jquery'],
  Lodash: ['lodash'],
  Axios: ['axios'],
  'Underscore.js': ['underscoredotjs'],
  Swiper: ['swiper'],
  Bootstrap: ['bootstrap'],
  'Font Awesome': ['fontawesome'],
  Modernizr: ['modernizr'],
  'Google Tag Manager': ['googletagmanager'],
  'Google Analytics': ['googleanalytics'],
  'Facebook Pixel': ['facebook', 'meta'],
  'Microsoft Clarity': ['microsoftclarity'],
  Hotjar: ['hotjar'],
  Matomo: ['matomo'],
  'Google Ads': ['googleads', 'googleadsense'],
  'Google Ads Conversion': ['googleads'],
  'Microsoft Advertising': ['microsoftbing', 'bing'],
  DoubleClick: ['doubleclick'],
  'WhatsApp Business Chat': ['whatsapp'],
  'Tawk.to': ['tawk'],
  Intercom: ['intercom'],
  Crisp: ['crisp'],
  'Zendesk Chat': ['zendesk'],
  Tidio: ['tidio'],
  Cookiebot: ['cookiebot'],
  OneTrust: ['onetrust'],
  reCAPTCHA: ['googlerecaptcha', 'recaptcha'],
  hCaptcha: ['hcaptcha'],
  'Cloudflare Turnstile': ['cloudflare'],
  'Google Font API': ['googlefonts'],
  'Adobe Fonts': ['adobefonts'],
  Cloudflare: ['cloudflare'],
  jsDelivr: ['jsdelivr'],
  cdnjs: ['cdnjs'],
  'Google Hosted Libraries': ['google'],
  unpkg: ['unpkg'],
  'Amazon CloudFront': ['amazonwebservices', 'amazoncloudfront'],
  Fastly: ['fastly'],
  Kinsta: ['kinsta'],
  Vercel: ['vercel'],
  Netlify: ['netlify'],
  Nginx: ['nginx'],
  Apache: ['apache', 'apachehttpserver'],
  LiteSpeed: ['litespeed'],
  OpenResty: ['openresty'],
  PHP: ['php'],
  'ASP.NET': ['dotnet'],
  Express: ['express'],
  RSS: ['rss'],
  'Contact Form 7': ['contactform7'],
  WPML: ['wpml'],
};

const out = {};
const missing = [];
for (const [name, slugs] of Object.entries(MAP)) {
  const slug = slugs.find((s) => bySlug[s]);
  if (slug) out[name] = { hex: bySlug[slug].hex, path: bySlug[slug].path };
  else missing.push(name);
}

const body =
  '// AUTO-GENERATED from simple-icons (CC0 / https://simple-icons.org). Do not edit by hand.\n' +
  '// Regenerate with: npm run gen:icons\n' +
  '// Brand logos are used for nominative identification of detected web technologies.\n\n' +
  'export const TECH_ICONS: Record<string, { hex: string; path: string }> = {\n' +
  Object.entries(out)
    .map(([k, v]) => `  ${JSON.stringify(k)}: { hex: ${JSON.stringify(v.hex)}, path: ${JSON.stringify(v.path)} },`)
    .join('\n') +
  '\n};\n';

fs.writeFileSync(require('path').join(__dirname, '..', 'lib', 'tech', 'icons.ts'), body);
console.log(`wrote ${Object.keys(out).length} icons; missing (${missing.length}):`, missing.join(', '));
