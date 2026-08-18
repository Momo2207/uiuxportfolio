#!/usr/bin/env node
/**
 * Reference-site analyser.
 *
 *   node tools/analyze-reference.mjs <url> [--out DIR] [--name NAME]
 *
 * Captures what is actually needed to judge and adapt another site's design:
 * screenshots at every breakpoint, the real computed design tokens, a component
 * inventory, and an animation/motion inventory. Writes a JSON report plus PNGs.
 *
 * Everything here is measured from the rendered page — nothing is inferred from
 * marketing copy about the site.
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2];
if (!url) {
  console.error("usage: node tools/analyze-reference.mjs <url> [--out DIR] [--name NAME]");
  process.exit(1);
}
const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const NAME = argOf("--name", new URL(url).hostname.replace(/^www\./, "").replace(/\W+/g, "-"));
const OUT = path.resolve(argOf("--out", "reference/" + NAME));

const BREAKPOINTS = [320, 375, 430, 768, 1024, 1280, 1440, 1728];
const DEEP = [1440, 390];   // widths that also get full-page + scroll captures

fs.mkdirSync(OUT, { recursive: true });

/* ---------- in-page collectors ---------- */

const COLLECT_TOKENS = `(() => {
  const els = [...document.querySelectorAll('body *')].slice(0, 6000);
  const tally = (arr) => {
    const m = new Map();
    for (const v of arr) if (v) m.set(v, (m.get(v) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
      .map(([value, count]) => ({ value, count }));
  };
  const hasText = (el) => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);

  const fontFamily = [], fontSize = [], fontWeight = [], lineHeight = [], tracking = [];
  const color = [], background = [], radius = [], shadow = [], border = [];
  const padding = [], margin = [], gap = [], display = [], transition = [], animation = [];
  const transform = [], filter = [], mixBlend = [], backdrop = [];

  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    const visible = r.width > 0 && r.height > 0;
    if (!visible) continue;

    if (hasText(el)) {
      fontFamily.push(cs.fontFamily.split(',')[0].replace(/["']/g, ''));
      fontSize.push(cs.fontSize);
      fontWeight.push(cs.fontWeight);
      lineHeight.push(cs.lineHeight);
      tracking.push(cs.letterSpacing);
      color.push(cs.color);
    }
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') background.push(cs.backgroundColor);
    if (cs.borderRadius !== '0px') radius.push(cs.borderRadius);
    if (cs.boxShadow !== 'none') shadow.push(cs.boxShadow);
    if (cs.borderTopWidth !== '0px' || cs.borderLeftWidth !== '0px') border.push(cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor);
    if (cs.paddingTop !== '0px') padding.push(cs.paddingTop);
    if (cs.marginTop !== '0px') margin.push(cs.marginTop);
    if (cs.gap && cs.gap !== 'normal' && cs.gap !== '0px') gap.push(cs.gap);
    display.push(cs.display);
    if (cs.transition && cs.transition !== 'all 0s ease 0s') transition.push(cs.transition);
    if (cs.animationName && cs.animationName !== 'none') animation.push(cs.animationName + ' ' + cs.animationDuration + ' ' + cs.animationTimingFunction);
    if (cs.transform && cs.transform !== 'none') transform.push(cs.transform.slice(0, 60));
    if (cs.filter && cs.filter !== 'none') filter.push(cs.filter);
    if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') mixBlend.push(cs.mixBlendMode);
    if (cs.backdropFilter && cs.backdropFilter !== 'none') backdrop.push(cs.backdropFilter);
  }

  // custom properties declared on :root
  const rootVars = {};
  for (const sheet of [...document.styleSheets]) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules || []) {
      if (rule.selectorText === ':root' || rule.selectorText === 'html') {
        for (const p of rule.style || []) if (p.startsWith('--')) rootVars[p] = rule.style.getPropertyValue(p).trim();
      }
    }
  }

  const body = getComputedStyle(document.body);
  return {
    page: { title: document.title, lang: document.documentElement.lang,
            bodyBg: body.backgroundColor, bodyColor: body.color, bodyFont: body.fontFamily },
    rootVars,
    type: { fontFamily: tally(fontFamily), fontSize: tally(fontSize), fontWeight: tally(fontWeight),
            lineHeight: tally(lineHeight), letterSpacing: tally(tracking) },
    colour: { text: tally(color), background: tally(background) },
    surface: { radius: tally(radius), shadow: tally(shadow), border: tally(border),
               mixBlendMode: tally(mixBlend), backdropFilter: tally(backdrop), filter: tally(filter) },
    space: { padding: tally(padding), margin: tally(margin), gap: tally(gap) },
    layout: { display: tally(display) },
    motion: { transition: tally(transition), animation: tally(animation), transform: tally(transform) },
  };
})()`;

const COLLECT_STRUCTURE = `(() => {
  const sections = [...document.querySelectorAll('body > *, main > *, main section, body section')]
    .filter(el => el.getBoundingClientRect().height > 80)
    .slice(0, 40)
    .map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const heading = el.querySelector('h1,h2,h3');
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 90),
        height: Math.round(r.height),
        bg: cs.backgroundColor,
        display: cs.display,
        cols: cs.gridTemplateColumns && cs.gridTemplateColumns !== 'none' ? cs.gridTemplateColumns.slice(0, 80) : null,
        heading: heading ? heading.textContent.trim().slice(0, 90) : null,
      };
    });

  const headings = [...document.querySelectorAll('h1,h2,h3')].slice(0, 40).map(h => {
    const cs = getComputedStyle(h);
    return { level: h.tagName, text: h.textContent.trim().slice(0, 110),
             size: cs.fontSize, weight: cs.fontWeight, family: cs.fontFamily.split(',')[0].replace(/["']/g,''),
             lineHeight: cs.lineHeight, tracking: cs.letterSpacing };
  });

  const buttons = [...document.querySelectorAll('a[class*=btn],button,a[class*=button],[role=button]')].slice(0, 16).map(b => {
    const cs = getComputedStyle(b); const r = b.getBoundingClientRect();
    return { text: b.textContent.trim().slice(0, 40), cls: (b.className||'').toString().slice(0,60),
             bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius,
             padding: cs.padding, border: cs.borderWidth + ' ' + cs.borderColor,
             font: cs.fontSize + '/' + cs.fontWeight, h: Math.round(r.height) };
  });

  const media = [...document.querySelectorAll('img,video,canvas,svg')].slice(0, 30).map(m => {
    const r = m.getBoundingClientRect();
    return { tag: m.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height),
             ratio: r.height ? +(r.width / r.height).toFixed(2) : null,
             src: (m.currentSrc || m.src || '').split('/').pop()?.slice(0, 60) || null,
             loading: m.getAttribute('loading') };
  });

  const container = (() => {
    const c = [...document.querySelectorAll('div,section')].map(e => e.getBoundingClientRect().width)
      .filter(w => w > 200);
    const m = new Map(); for (const w of c) { const k = Math.round(w / 10) * 10; m.set(k, (m.get(k)||0)+1); }
    return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([w,count])=>({ width: w, count }));
  })();

  return { sections, headings, buttons, media, commonWidths: container,
           nav: [...document.querySelectorAll('nav a')].slice(0,12).map(a=>a.textContent.trim().slice(0,30)) };
})()`;

const COLLECT_MOTION = `(() => {
  const keyframes = [];
  for (const sheet of [...document.styleSheets]) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules || []) {
      if (rule.type === CSSRule.KEYFRAMES_RULE) {
        keyframes.push({ name: rule.name, steps: [...rule.cssRules].map(r => r.keyText + ' ' + r.style.cssText.slice(0, 90)).slice(0, 6) });
      }
      if (rule.type === CSSRule.SUPPORTS_RULE || rule.type === CSSRule.MEDIA_RULE) {
        for (const inner of rule.cssRules || []) {
          if (inner.type === CSSRule.KEYFRAMES_RULE) keyframes.push({ name: inner.name, media: rule.conditionText, steps: [] });
        }
      }
    }
  }
  const scripts = [...document.querySelectorAll('script[src]')].map(s => s.src.split('/').pop());
  const libs = [];
  for (const [name, present] of Object.entries({
    gsap: !!window.gsap, ScrollTrigger: !!(window.ScrollTrigger || window.gsap?.ScrollTrigger),
    lenis: !!(window.Lenis || window.lenis), locomotive: !!window.LocomotiveScroll,
    framerMotion: !!window.Motion, three: !!window.THREE, barba: !!window.barba,
    swiper: !!window.Swiper, splitting: !!window.Splitting, lottie: !!window.lottie,
  })) if (present) libs.push(name);

  const scrollDriven = getComputedStyle(document.documentElement).getPropertyValue('animation-timeline') ||
    [...document.querySelectorAll('body *')].slice(0,3000)
      .some(el => getComputedStyle(el).animationTimeline && getComputedStyle(el).animationTimeline !== 'auto');

  return { keyframes: keyframes.slice(0, 25), scripts: scripts.slice(0, 25), libs,
           usesScrollDrivenCSS: !!scrollDriven,
           prefersReducedMotionHandled: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => (r.conditionText||'').includes('prefers-reduced-motion')); } catch { return false; } }) };
})()`;

/* ---------- run ---------- */

const browser = await chromium.launch();
const report = { url, capturedAt: null, breakpoints: {}, deep: {} };

for (const w of BREAKPOINTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `viewport-${w}.png`) });

  report.breakpoints[w] = {
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1),
    docHeight: await page.evaluate(() => document.body.scrollHeight),
    navVisible: await page.evaluate(() => {
      const n = document.querySelector("nav");
      return n ? getComputedStyle(n).display !== "none" : null;
    }),
  };

  if (DEEP.includes(w)) {
    // scroll through so lazy content and scroll-triggered states resolve
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const step = Math.round(window.innerHeight * 0.5);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 220));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 600));
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `full-${w}.png`), fullPage: true });

    report.deep[w] = {
      tokens: await page.evaluate(COLLECT_TOKENS),
      structure: await page.evaluate(COLLECT_STRUCTURE),
      motion: await page.evaluate(COLLECT_MOTION),
    };
  }
  await ctx.close();
}

await browser.close();
report.capturedAt = "captured";
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

const d = report.deep[DEEP[0]];
console.log(`\nAnalysed ${url}`);
console.log(`  screenshots: ${BREAKPOINTS.length} viewport + ${DEEP.length} full-page -> ${OUT}`);
if (d) {
  console.log(`  title:   ${d.tokens.page.title}`);
  console.log(`  body:    ${d.tokens.page.bodyFont} on ${d.tokens.page.bodyBg}`);
  console.log(`  fonts:   ${d.tokens.type.fontFamily.slice(0, 4).map((f) => f.value + " x" + f.count).join(", ")}`);
  console.log(`  sizes:   ${d.tokens.type.fontSize.slice(0, 8).map((f) => f.value).join(", ")}`);
  console.log(`  bg:      ${d.tokens.colour.background.slice(0, 5).map((c) => c.value).join(", ")}`);
  console.log(`  radius:  ${d.tokens.surface.radius.slice(0, 4).map((c) => c.value).join(", ") || "none"}`);
  console.log(`  motion:  libs=[${d.motion.libs.join(", ") || "none"}] keyframes=${d.motion.keyframes.length} reducedMotion=${d.motion.prefersReducedMotionHandled}`);
  console.log(`  sections: ${d.structure.sections.length}, headings: ${d.structure.headings.length}`);
}
console.log(`\nreport: ${path.join(OUT, "report.json")}`);
