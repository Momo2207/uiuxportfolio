#!/usr/bin/env node
/**
 * Parvalle image pipeline.
 *
 *   node tools/build-images.mjs --check    inspect sources, report problems, change nothing
 *   node tools/build-images.mjs            build responsive AVIF/WebP/JPEG derivatives
 *   node tools/build-images.mjs --markup   print the <picture> markup for each filled slot
 *
 * Drop source photos into assets/img/src/<slot>.jpg (or .png/.webp/.tif).
 * Slot names, crops and sizes are defined in SLOTS below; see assets/img/README.md
 * for the art direction each slot expects and the licence rules that apply.
 *
 * Derivatives land in assets/img/ and are safe to commit. Sources in
 * assets/img/src/ are kept out of git — they are the originals, not the build
 * output.
 */

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "assets/img/src");
const OUT_DIR = path.join(ROOT, "assets/img");

/** Every slot the site has a place for. Nothing else is built. */
const SLOTS = {
  kursraum: {
    page: "index.html",
    where: "full-bleed band between the Kursprozess section and Verkaufen/Betreiben/Verstehen",
    ratio: [21, 9],
    widths: [900, 1400, 2000],
    sizes: "100vw",
    wrapper: "band",
    alt: "Ein Kursraum kurz vor Beginn: Stühle im Halbkreis, Tageslicht.",
  },
  werkstatt: {
    page: "produkt.html",
    where: 'beside "Ein Kurs bleibt ein Kurs"',
    ratio: [3, 2],
    widths: [700, 1100, 1600],
    sizes: "(max-width: 900px) 100vw, 50vw",
    wrapper: "side",
    alt: "Arbeitstisch in einer Kurswerkstatt mit vorbereitetem Material.",
  },
  weitergeben: {
    page: "ueber-parvalle.html",
    where: "beside the Vision copy",
    ratio: [3, 2],
    widths: [700, 1100, 1600],
    sizes: "(max-width: 900px) 100vw, 50vw",
    wrapper: "side",
    alt: "Zwei Personen an einem Werkstück, eine erklärt der anderen einen Handgriff.",
  },
  // The "Beispiele" row on fuer-wen.html — four course worlds, portrait crops.
  yoga:     { page: "fuer-wen.html", where: "Beispiele row", ratio: [4, 5], widths: [400, 700, 1000], sizes: "(max-width: 620px) 50vw, 25vw", wrapper: "gallery", alt: "Yogamatten in einem hellen Kursraum." },
  toepfern: { page: "fuer-wen.html", where: "Beispiele row", ratio: [4, 5], widths: [400, 700, 1000], sizes: "(max-width: 620px) 50vw, 25vw", wrapper: "gallery", alt: "Hände an einer Töpferscheibe." },
  outdoor:  { page: "fuer-wen.html", where: "Beispiele row", ratio: [4, 5], widths: [400, 700, 1000], sizes: "(max-width: 620px) 50vw, 25vw", wrapper: "gallery", alt: "Kleine Gruppe auf einem Weg im Freien, Ausrüstung geschultert." },
  musik:    { page: "fuer-wen.html", where: "Beispiele row", ratio: [4, 5], widths: [400, 700, 1000], sizes: "(max-width: 620px) 50vw, 25vw", wrapper: "gallery", alt: "Instrumente und Notenständer in einem Proberaum." },
};

/** Quality settings tuned for photographic content on a warm paper ground. */
const ENCODE = {
  avif: { quality: 52, effort: 6, chromaSubsampling: "4:2:0" },
  webp: { quality: 76, effort: 5 },
  jpeg: { quality: 80, mozjpeg: true, progressive: true },
};

const MIN_SOURCE_WIDTH = 1600;      // below this, the largest derivative would upscale
const MAX_DERIVATIVE_KB = 260;      // budget per file; the site ships ~100KB without images

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");
const MARKUP_ONLY = args.has("--markup");
const APPLY = args.has("--apply");

const SOURCE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"];

function findSource(slot) {
  for (const ext of SOURCE_EXT) {
    const p = path.join(SRC_DIR, slot + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function markupFor(slot, spec, manifest) {
  const entry = manifest[slot];
  if (!entry) return null;
  const set = (fmt) => spec.widths.map((w) => `assets/img/${slot}-${w}.${fmt} ${w}w`).join(", ");
  const largest = spec.widths[spec.widths.length - 1];
  return [
    `<picture>`,
    `  <source type="image/avif" srcset="${set("avif")}" sizes="${spec.sizes}">`,
    `  <source type="image/webp" srcset="${set("webp")}" sizes="${spec.sizes}">`,
    `  <img src="assets/img/${slot}-${largest}.jpg" srcset="${set("jpg")}" sizes="${spec.sizes}"`,
    `       width="${entry.width}" height="${entry.height}"`,
    `       loading="lazy" decoding="async"`,
    `       alt="${spec.alt}">`,
    `</picture>`,
  ].join("\n");
}

/** Wrap the <picture> in the figure the slot's placement needs. */
function figureFor(slot, spec, manifest) {
  const pic = markupFor(slot, spec, manifest);
  if (!pic) return null;
  const [rw, rh] = spec.ratio;
  const indent = (t, n) => t.split("\n").map((l) => " ".repeat(n) + l).join("\n");
  const cls = spec.wrapper === "band" ? "figure band-image" : "figure";
  return [
    `<figure class="${cls}" style="--ratio-src: ${rw} / ${rh}">`,
    `  <div class="figure__media">`,
    indent(pic, 4),
    `  </div>`,
    `</figure>`,
  ].join("\n");
}

/** Fill every <!-- parvalle:image SLOT --> ... <!-- /parvalle:image --> anchor. */
function applyMarkup(manifest) {
  const byPage = {};
  for (const [slot, spec] of Object.entries(SLOTS)) (byPage[spec.page] ||= []).push([slot, spec]);
  let filled = 0, empty = 0;
  for (const [page, slots] of Object.entries(byPage)) {
    const file = path.join(ROOT, page);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    for (const [slot, spec] of slots) {
      const re = new RegExp(`([ \t]*)<!-- parvalle:image ${slot} -->[\\s\\S]*?<!-- /parvalle:image -->`, "m");
      if (!re.test(html)) continue;
      const fig = figureFor(slot, spec, manifest);
      html = html.replace(re, (_m, pad) => {
        if (!fig) { empty++; return `${pad}<!-- parvalle:image ${slot} -->\n${pad}<!-- /parvalle:image -->`; }
        filled++;
        const body = fig.split("\n").map((l) => pad + l).join("\n");
        return `${pad}<!-- parvalle:image ${slot} -->\n${body}\n${pad}<!-- /parvalle:image -->`;
      });
    }
    fs.writeFileSync(file, html);
  }
  console.log(`\nApplied markup: ${filled} slot(s) filled, ${empty} left as empty anchors.`);
}

async function main() {
  fs.mkdirSync(SRC_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : {};

  if (MARKUP_ONLY) {
    for (const [slot, spec] of Object.entries(SLOTS)) {
      const m = figureFor(slot, spec, manifest);
      if (m) console.log(`\n<!-- ${slot} — ${spec.page}: ${spec.where} -->\n${m}`);
    }
    return;
  }

  const missing = [];
  const problems = [];
  const built = [];

  for (const [slot, spec] of Object.entries(SLOTS)) {
    const src = findSource(slot);
    if (!src) { missing.push(slot); continue; }

    const meta = await sharp(src).metadata();
    if (meta.width < MIN_SOURCE_WIDTH) {
      problems.push(`${slot}: source is ${meta.width}px wide, needs >= ${MIN_SOURCE_WIDTH}px (largest derivative would upscale)`);
      continue;
    }

    const [rw, rh] = spec.ratio;
    if (CHECK_ONLY) {
      console.log(`  ok    ${slot.padEnd(12)} ${meta.width}x${meta.height} ${meta.format} -> crop ${rw}:${rh}`);
      continue;
    }

    for (const w of spec.widths) {
      const h = Math.round((w * rh) / rw);
      // `attention` keeps the visually salient region when cropping to ratio.
      const base = sharp(src).resize(w, h, { fit: "cover", position: sharp.strategy.attention });
      for (const [fmt, opts] of Object.entries(ENCODE)) {
        const ext = fmt === "jpeg" ? "jpg" : fmt;
        const out = path.join(OUT_DIR, `${slot}-${w}.${ext}`);
        await base.clone()[fmt](opts).toFile(out);
        const kb = Math.round(fs.statSync(out).size / 1024);
        if (kb > MAX_DERIVATIVE_KB) problems.push(`${slot}-${w}.${ext} is ${kb}KB (budget ${MAX_DERIVATIVE_KB}KB)`);
        built.push(`${slot}-${w}.${ext} ${kb}KB`);
      }
    }

    const largest = spec.widths[spec.widths.length - 1];
    manifest[slot] = {
      width: largest,
      height: Math.round((largest * rh) / rw),
      ratio: `${rw}:${rh}`,
      page: spec.page,
      alt: spec.alt,
      source: path.basename(src),
    };
  }

  if (!CHECK_ONLY) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  if (APPLY) applyMarkup(manifest);

  if (built.length) {
    console.log(`\nBuilt ${built.length} derivatives:`);
    for (const b of built) console.log("  " + b);
  }
  if (missing.length) {
    console.log(`\nNo source yet for ${missing.length} slot(s): ${missing.join(", ")}`);
    console.log(`Drop photos in assets/img/src/<slot>.jpg — see assets/img/README.md`);
  }
  if (problems.length) {
    console.log("\nProblems:");
    for (const p of problems) console.log("  ! " + p);
    process.exitCode = 1;
  }
  if (!missing.length && !problems.length && !CHECK_ONLY) {
    console.log("\nAll slots built. Run with --apply to write them into the pages.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
