import { detectTech } from '../lib/tech/detect';
import type { TechSignals } from '../lib/tech/types';

let pass = 0;
let total = 0;
function check(name: string, ok: boolean) {
  total++;
  if (ok) pass++;
  console.log(`${ok ? '  ✓' : '  ✗ FAIL'}  ${name}`);
}

const sig: TechSignals = {
  scripts: [
    'https://www.googletagmanager.com/gtm.js?id=GTM-XXX',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
    'https://connect.facebook.net/en_US/fbevents.js',
    'https://www.google.com/recaptcha/api.js',
    '/wp-content/plugins/owl-carousel/owl.carousel.min.js',
    'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
  ],
  scriptIds: ['contact-form-7-js-js'],
  links: ['https://fonts.googleapis.com/css?family=Roboto', '/wp-content/themes/x/style.css'],
  linkIds: [],
  metas: { generator: 'WordPress 6.5.2' },
  generators: ['WordPress 6.5.2'],
  headHtml: '<meta property="og:title" content="x"> rank math seo',
  htmlClass: '',
  bodyClass: 'woocommerce-page',
  cookies: 'PHPSESSID=abc; cookieyes-consent=yes',
  markers: ['wordpress', 'woocommerce'],
};
const headers: Record<string, string> = {
  Server: 'nginx/1.24.0',
  'X-Powered-By': 'PHP/8.2.1',
  'CF-RAY': 'abc123',
  'X-Pingback': 'https://x/xmlrpc.php',
};

const techs = detectTech(sig, headers);
const get = (n: string) => techs.find((t) => t.name === n);
const has = (n: string) => !!get(n);

check('WordPress detected', has('WordPress'));
check('WordPress version 6.5.2', get('WordPress')?.version === '6.5.2');
check('jQuery detected', has('jQuery'));
check('jQuery version 3.7.1', get('jQuery')?.version === '3.7.1');
check('Google Tag Manager detected', has('Google Tag Manager'));
check('Facebook Pixel detected', has('Facebook Pixel'));
check('reCAPTCHA detected', has('reCAPTCHA'));
check('OWL Carousel detected', has('OWL Carousel'));
check('Swiper detected', has('Swiper'));
check('Contact Form 7 detected', has('Contact Form 7'));
check('Google Font API detected', has('Google Font API'));
check('WooCommerce detected', has('WooCommerce'));
check('CookieYes detected', has('CookieYes'));
check('Rank Math detected', has('Rank Math'));
check('Open Graph detected', has('Open Graph'));
check('cdnjs detected', has('cdnjs'));
check('jsDelivr detected', has('jsDelivr'));
check('Nginx detected + version', get('Nginx')?.version === '1.24.0');
check('PHP detected + version', get('PHP')?.version === '8.2.1');
check('Cloudflare detected (cf-ray)', has('Cloudflare'));
check('no duplicate names', new Set(techs.map((t) => t.name)).size === techs.length);
check('empty signals → nothing', detectTech({ ...sig, scripts: [], scriptIds: [], links: [], generators: [], metas: {}, cookies: '', markers: [], headHtml: '', bodyClass: '', htmlClass: '' }, {}).length === 0);

console.log(`\n${pass}/${total} checks passed`);
if (pass !== total) throw new Error(`${total - pass} check(s) failed`);
