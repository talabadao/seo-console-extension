# Chrome Web Store — submission pack

Upload file: **`.output/seo-console-1.1.0-chrome.zip`**

Submit at https://chrome.google.com/webstore/devconsole (one-time $5 developer fee).

---

## Listing fields (copy-paste)

**Name**
```
SEO Console
```

**Short description** (≤132 chars)
```
Inspect on-page SEO: status codes, redirects, meta tags, headings, images, links, indexability and Core Web Vitals.
```

**Category:** Developer Tools
**Language:** English

**Detailed description**
```
SEO Console is an on-page SEO inspector that opens in a side panel and audits the
page in your active tab — no sign-in, no account, nothing leaves your browser.

OVERVIEW
• SEO score with a clear Errors / Warnings / Notices breakdown
• HTTP status, redirect chain and response headers (X-Robots-Tag, content type)
• Google-style search preview that measures the title and description in PIXELS
  (not characters) against Google's desktop truncation limits
• Core Web Vitals (LCP, INP, CLS, FCP, TTFB), rated against Google's thresholds

ON-PAGE
• Heading outline (H1–H6) with missing/duplicate/skipped-level checks
• Images: missing alt, missing dimensions (CLS), format and file size
• Links: internal vs external, nofollow/sponsored/ugc, empty anchors, target=_blank
• Open Graph & Twitter Card preview, JSON-LD structured data

AUDIT
• Indexability verdict combining meta robots, X-Robots-Tag and robots.txt
• robots.txt evaluation for Googlebot, plus sitemap discovery
• Rendered-vs-source diff that flags SEO tags injected only by JavaScript
• Broken-link checker

TOOLS
• Disable JavaScript for the site and reload (see the page as a crawler does)
• Outline headings (H1–H6) directly on the page

Click any issue to scroll to and highlight the element on the page. Light & dark
themes. Configurable rule thresholds.

SEO Console does not collect, store or transmit any of your data.
```

---

## Single purpose (review form)
```
SEO Console analyzes the SEO of the web page in the user's active tab and reports
on-page issues in a side panel.
```

## Permission justifications (review form)

| Permission | Justification |
|---|---|
| `host_permissions` (all sites) + `webRequest` | Read the HTTP status code, redirect chain and response headers (e.g. X-Robots-Tag) of the page being analyzed, and check whether its links and sitemaps are reachable. Used only for the tab the user is inspecting, to display SEO diagnostics. Nothing is sent to any external server. |
| `activeTab` | Analyze the page in the currently active tab when the user opens the side panel. |
| `tabs` | Detect the active tab's URL and re-analyze when the user switches tabs or a page finishes loading. |
| `storage` | Store the user's theme and rule-threshold preferences locally. |
| `sidePanel` | The extension's entire UI is a Chrome side panel. |
| `contentSettings` | The Tools tab's "Disable JavaScript" option toggles the JavaScript content setting for the current site so the user can see the page as a crawler does. |

## Data use disclosures (Privacy practices tab)
- The extension does **not** collect or use user data beyond what is needed to run locally.
- Not sold to third parties. Not used or transferred for purposes unrelated to the single purpose. Not used to determine creditworthiness or for lending.
- Privacy policy: host `store/PRIVACY.md` (e.g. on GitHub Pages) and paste its URL.

---

## Before you submit — checklist
- [ ] At least one screenshot **1280×800** or **640×400** (see `store/screenshots/`).
- [ ] 128×128 store icon is included in the ZIP (`icon/128.png`).
- [ ] Privacy policy URL (required because of broad host access). Use `store/PRIVACY.md`.
- [ ] Because of `<all_urls>` + `webRequest`, expect a slightly longer review.
      To reduce the host-permission warning later, see the "Deferred" item in the
      project README (optional_host_permissions).

## Notes
- `npm run zip` regenerates the uploadable ZIP. Re-run after any code change.
- Bump `version` in `wxt.config.ts` for each new upload (the store rejects a
  re-upload of the same version).
