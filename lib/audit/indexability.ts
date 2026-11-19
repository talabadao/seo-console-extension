import type { PageReport } from '../types';
import type { Indexability, IndexSignal, RobotsCheck } from './types';

export function computeIndexability(report: PageReport, robots: RobotsCheck | null): Indexability {
  const metaRobots = (report.meta.robots || '').toLowerCase();
  const xRobots = (report.http.xRobotsTag || '').toLowerCase();
  const metaNoindex = /\bnoindex\b/.test(metaRobots);
  const xNoindex = /\bnoindex\b/.test(xRobots);
  const robotsBlocked = robots ? robots.found && !robots.allowed : false;

  const signals: IndexSignal[] = [
    {
      source: 'meta robots',
      label: metaNoindex ? 'noindex' : report.meta.robots || 'index (default)',
      blocked: metaNoindex,
    },
    {
      source: 'X-Robots-Tag',
      label: xNoindex ? 'noindex' : report.http.xRobotsTag || 'not set',
      blocked: xNoindex,
    },
  ];
  if (robots) {
    signals.push({
      source: 'robots.txt',
      label: !robots.found
        ? 'no robots.txt'
        : robots.allowed
          ? 'crawl allowed'
          : `blocked · ${robots.matchedRule ?? 'disallow'}`,
      blocked: robotsBlocked,
    });
  }

  const blocked = metaNoindex || xNoindex || robotsBlocked;
  let verdict: string;
  if (metaNoindex) verdict = 'Not indexable — noindex in meta robots';
  else if (xNoindex) verdict = 'Not indexable — noindex in X-Robots-Tag';
  else if (robotsBlocked) verdict = 'Blocked from crawling by robots.txt';
  else verdict = 'Indexable';

  return { indexable: !blocked, verdict, signals };
}
