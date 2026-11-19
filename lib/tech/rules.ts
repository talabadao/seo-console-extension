import type { TechCategory } from './types';

export interface TechRule {
  name: string;
  category: TechCategory;
  scripts?: RegExp;
  scriptIds?: RegExp;
  links?: RegExp;
  html?: RegExp; // headHtml + html/body class
  cookie?: RegExp;
  marker?: string;
  meta?: string; // meta key presence
  generator?: RegExp;
  header?: string; // response header name
  headerVal?: RegExp; // ...and its value must match
  version?: { source: 'scripts' | 'generator' | 'header' | 'headHtml'; re: RegExp };
}

export const RULES: TechRule[] = [
  // ── CMS ──
  {
    name: 'WordPress',
    category: 'CMS',
    marker: 'wordpress',
    generator: /WordPress/i,
    header: 'x-pingback',
    version: { source: 'generator', re: /WordPress\s+([\d.]+)/i },
  },
  { name: 'Drupal', category: 'CMS', generator: /Drupal/i, header: 'x-generator', headerVal: /Drupal/i, version: { source: 'generator', re: /Drupal\s+(\d+)/i } },
  { name: 'Joomla', category: 'CMS', generator: /Joomla/i, version: { source: 'generator', re: /Joomla!?\s+([\d.]+)/i } },
  { name: 'Ghost', category: 'CMS', generator: /Ghost/i, version: { source: 'generator', re: /Ghost\s+([\d.]+)/i } },
  { name: 'Wix', category: 'CMS', scripts: /static\.wixstatic\.com|wix\.com/i },
  { name: 'Squarespace', category: 'CMS', scripts: /squarespace\.com|sqspcdn/i, html: /squarespace/i },
  { name: 'Webflow', category: 'CMS', html: /data-wf-|webflow/i },

  // ── Ecommerce ──
  { name: 'WooCommerce', category: 'Ecommerce', marker: 'woocommerce', scripts: /woocommerce/i },
  { name: 'Shopify', category: 'Ecommerce', scripts: /cdn\.shopify\.com/i },
  { name: 'Magento', category: 'Ecommerce', scripts: /mage\/|static\/version|Magento/i, cookie: /X-Magento/i },

  // ── Page builders ──
  { name: 'Elementor', category: 'Page builders', marker: 'elementor', scripts: /elementor/i, html: /elementor/i },
  { name: 'WPBakery Page Builder', category: 'Page builders', scripts: /js_composer|wpbakery/i, html: /vc_row|wpb_/i },
  { name: 'Divi', category: 'Page builders', html: /et_pb_|et-core/i },
  { name: 'Beaver Builder', category: 'Page builders', scripts: /bb-plugin|beaver-builder/i },

  // ── SEO ──
  { name: 'Rank Math', category: 'SEO', scriptIds: /rank-math/i, html: /rank[-\s]?math/i, generator: /Rank Math/i },
  { name: 'Yoast SEO', category: 'SEO', html: /yoast|wpseo/i, generator: /Yoast/i },
  { name: 'All in One SEO', category: 'SEO', html: /aioseo|all[-\s]in[-\s]one[-\s]seo/i },

  // ── Web frameworks ──
  { name: 'Next.js', category: 'Web frameworks', marker: 'next' },
  { name: 'Nuxt.js', category: 'Web frameworks', marker: 'nuxt' },
  { name: 'Gatsby', category: 'Web frameworks', scripts: /gatsby/i, html: /___gatsby/i },
  { name: 'Astro', category: 'Web frameworks', html: /astro-island|data-astro/i },
  { name: 'Laravel', category: 'Web frameworks', cookie: /laravel_session|XSRF-TOKEN/i },

  // ── JS frameworks ──
  { name: 'React', category: 'JavaScript frameworks', marker: 'react', scripts: /\breact(-dom)?[@.\-]/i },
  { name: 'Vue.js', category: 'JavaScript frameworks', marker: 'vue', scripts: /vue(@|\.min|\.runtime|\.global)/i },
  { name: 'Angular', category: 'JavaScript frameworks', marker: 'angular', scripts: /angular/i },
  { name: 'Svelte', category: 'JavaScript frameworks', scripts: /svelte/i },
  { name: 'Alpine.js', category: 'JavaScript frameworks', scripts: /alpinejs|alpine\.min/i, html: /x-data=/i },

  // ── JS libraries ──
  { name: 'jQuery', category: 'JavaScript libraries', scripts: /jquery[-.]?\d|jquery\.min\.js|jquery\.js/i, scriptIds: /jquery-core/i, version: { source: 'scripts', re: /jquery(?:[-/]|[.\w]*\?ver=)(\d+\.\d+(?:\.\d+)?)/i } },
  { name: 'jQuery UI', category: 'JavaScript libraries', scripts: /jquery-ui|jquery\.ui/i, version: { source: 'scripts', re: /jquery-ui(?:[-/]|[.\w]*\?ver=)(\d+\.\d+(?:\.\d+)?)/i } },
  { name: 'jQuery Migrate', category: 'JavaScript libraries', scripts: /jquery-migrate/i },
  { name: 'core-js', category: 'JavaScript libraries', scripts: /core-js/i },
  { name: 'Lodash', category: 'JavaScript libraries', scripts: /lodash/i },
  { name: 'Underscore.js', category: 'JavaScript libraries', scripts: /underscore(\.min)?\.js/i },
  { name: 'Moment.js', category: 'JavaScript libraries', scripts: /moment(\.min)?\.js/i },
  { name: 'Modernizr', category: 'JavaScript libraries', scripts: /modernizr/i },
  { name: 'Popper', category: 'JavaScript libraries', scripts: /popper(\.min)?\.js/i },
  { name: 'Axios', category: 'JavaScript libraries', scripts: /axios(\.min)?\.js/i },

  // ── UI & widgets ──
  { name: 'OWL Carousel', category: 'UI & widgets', scripts: /owl\.?carousel/i },
  { name: 'Slick', category: 'UI & widgets', scripts: /slick(\.min)?\.js|slick-carousel/i },
  { name: 'Swiper', category: 'UI & widgets', scripts: /swiper/i, links: /swiper/i },
  { name: 'Fancybox', category: 'UI & widgets', scripts: /fancybox/i },
  { name: 'Lightbox', category: 'UI & widgets', scripts: /lightbox/i },
  { name: 'Magnific Popup', category: 'UI & widgets', scripts: /magnific/i },
  { name: 'Slider Revolution', category: 'UI & widgets', scripts: /revolution|revslider|rs6\.min/i },
  { name: 'Isotope', category: 'UI & widgets', scripts: /isotope/i },
  { name: 'Masonry', category: 'UI & widgets', scripts: /masonry/i },
  { name: 'Bootstrap', category: 'UI & widgets', scripts: /bootstrap(\.bundle)?(\.min)?\.js/i, links: /bootstrap(\.min)?\.css/i },
  { name: 'AOS', category: 'UI & widgets', scripts: /\baos(\.min)?\.js/i },

  // ── Tag managers ──
  { name: 'Google Tag Manager', category: 'Tag managers', scripts: /googletagmanager\.com\/gtm\.js/i, html: /googletagmanager\.com\/gtm/i, marker: 'gtm' },

  // ── Analytics ──
  { name: 'Google Analytics', category: 'Analytics', scripts: /google-analytics\.com|googletagmanager\.com\/gtag\/js/i, html: /gtag\(|_ga|UA-\d|G-[A-Z0-9]{6,}/ },
  { name: 'Facebook Pixel', category: 'Analytics', scripts: /connect\.facebook\.net\/.*fbevents/i, html: /fbq\(/i },
  { name: 'Microsoft Clarity', category: 'Analytics', scripts: /clarity\.ms/i, html: /clarity/i },
  { name: 'Hotjar', category: 'Analytics', scripts: /hotjar/i, html: /hotjar|_hjSettings/i },
  { name: 'Matomo', category: 'Analytics', scripts: /matomo|piwik/i },

  // ── Advertising ──
  { name: 'Google Ads', category: 'Advertising', scripts: /googleadservices|googlesyndication/i, html: /AW-\d{6,}/ },
  { name: 'Google Ads Conversion', category: 'Advertising', html: /googleadservices\.com\/pagead\/conversion/i },
  { name: 'Microsoft Advertising', category: 'Advertising', scripts: /bat\.bing\.com/i },
  { name: 'DoubleClick', category: 'Advertising', scripts: /doubleclick\.net/i },
  { name: 'AppNexus', category: 'Advertising', scripts: /adnxs\.com/i },

  // ── Live chat ──
  { name: 'WhatsApp Business Chat', category: 'Live chat', scripts: /whatsapp/i, links: /wa\.me|api\.whatsapp\.com/i, html: /wa\.me|api\.whatsapp\.com/i },
  { name: 'Tawk.to', category: 'Live chat', scripts: /tawk\.to/i },
  { name: 'Intercom', category: 'Live chat', scripts: /intercom/i },
  { name: 'Crisp', category: 'Live chat', scripts: /crisp\.chat/i },
  { name: 'Zendesk Chat', category: 'Live chat', scripts: /zdassets\.com|zopim/i },
  { name: 'Tidio', category: 'Live chat', scripts: /tidio/i },

  // ── Cookie compliance ──
  { name: 'CookieYes', category: 'Cookie compliance', scripts: /cookieyes|cookie-law-info/i, cookie: /cookieyes/i },
  { name: 'Cookiebot', category: 'Cookie compliance', scripts: /cookiebot/i },
  { name: 'OneTrust', category: 'Cookie compliance', scripts: /onetrust|cookielaw\.org/i },
  { name: 'Complianz', category: 'Cookie compliance', scripts: /complianz/i },

  // ── Security ──
  { name: 'reCAPTCHA', category: 'Security', scripts: /recaptcha|gstatic\.com\/recaptcha/i },
  { name: 'hCaptcha', category: 'Security', scripts: /hcaptcha\.com/i },
  { name: 'Cloudflare Turnstile', category: 'Security', scripts: /challenges\.cloudflare\.com\/turnstile/i },

  // ── Fonts ──
  { name: 'Google Font API', category: 'Fonts', links: /fonts\.googleapis\.com/i },
  { name: 'Font Awesome', category: 'Fonts', links: /font-?awesome|fontawesome/i, scripts: /fontawesome/i },
  { name: 'Adobe Fonts', category: 'Fonts', links: /use\.typekit\.net|fonts\.adobe\.com/i },
  { name: 'Twemoji', category: 'Fonts', scripts: /twemoji|wp-emoji/i },

  // ── CDN ──
  { name: 'Cloudflare', category: 'CDN', header: 'cf-ray' },
  { name: 'jsDelivr', category: 'CDN', scripts: /cdn\.jsdelivr\.net/i, links: /cdn\.jsdelivr\.net/i },
  { name: 'cdnjs', category: 'CDN', scripts: /cdnjs\.cloudflare\.com/i, links: /cdnjs\.cloudflare\.com/i },
  { name: 'Google Hosted Libraries', category: 'CDN', scripts: /ajax\.googleapis\.com/i },
  { name: 'unpkg', category: 'CDN', scripts: /unpkg\.com/i },
  { name: 'Amazon CloudFront', category: 'CDN', header: 'x-amz-cf-id' },
  { name: 'Fastly', category: 'CDN', header: 'x-served-by', headerVal: /cache|fastly/i },

  // ── Hosting / PaaS ──
  { name: 'Kinsta', category: 'Hosting', header: 'x-kinsta-cache' },
  { name: 'WP Engine', category: 'Hosting', header: 'x-wpe-loopback-upstream', cookie: /wpengine/i },
  { name: 'Vercel', category: 'Hosting', header: 'x-vercel-id' },
  { name: 'Netlify', category: 'Hosting', header: 'x-nf-request-id' },

  // ── Web servers ──
  { name: 'Nginx', category: 'Web servers', header: 'server', headerVal: /nginx/i, version: { source: 'header', re: /nginx\/([\d.]+)/i } },
  { name: 'Apache', category: 'Web servers', header: 'server', headerVal: /apache/i, version: { source: 'header', re: /Apache\/([\d.]+)/i } },
  { name: 'LiteSpeed', category: 'Web servers', header: 'server', headerVal: /litespeed/i },
  { name: 'Microsoft IIS', category: 'Web servers', header: 'server', headerVal: /iis/i },
  { name: 'OpenResty', category: 'Web servers', header: 'server', headerVal: /openresty/i },

  // ── Programming languages ──
  { name: 'PHP', category: 'Programming languages', header: 'x-powered-by', headerVal: /php/i, cookie: /PHPSESSID/, version: { source: 'header', re: /PHP\/([\d.]+)/i } },
  { name: 'ASP.NET', category: 'Programming languages', header: 'x-aspnet-version' },
  { name: 'Express', category: 'Programming languages', header: 'x-powered-by', headerVal: /express/i },

  // ── Miscellaneous ──
  { name: 'Open Graph', category: 'Miscellaneous', html: /property=["']og:/i },
  { name: 'RSS', category: 'Miscellaneous', html: /application\/(rss|atom)\+xml/i },
  { name: 'Contact Form 7', category: 'Miscellaneous', scriptIds: /contact-form-7/i, html: /wpcf7|contact-form-7/i },
  { name: 'Polylang', category: 'Miscellaneous', scripts: /polylang/i, html: /polylang|lang_sel/i, cookie: /pll_language/i },
  { name: 'WPML', category: 'Miscellaneous', html: /wpml|sitepress/i },
];
