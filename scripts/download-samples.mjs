/**
 * Download 88 piano key samples from Freesound
 * Pack: "88 piano keys, long reverb" by TEDAgame (CC0 Public Domain)
 * https://freesound.org/people/TEDAgame/packs/25405/
 * 
 * Preview URL pattern: https://cdn.freesound.org/previews/448/{id}_9311684-lq.ogg
 * 
 * Usage: node scripts/download-samples.mjs
 */

import { mkdir, access, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', 'public', 'samples');

// Verified mapping from Freesound sound ID to note name
// Each entry confirmed by visiting the individual sound page
// Note names use the page title (e.g. "A#0.ogg" -> "A#0")
const SOUND_MAP = {
  // Verified from page scraping:
  448573: "A#0",
  448575: "A#6",
  448572: "A#1",
  448570: "A#3",
  448571: "A#2",
  448568: "B3",
  448566: "A7",
  448569: "B2",
  448567: "A6",
  448565: "B0",
  448564: "B1",
  448563: "A2",
  448562: "A3",
  448561: "A4",
  448560: "A5",
  448574: "A#7",
  448576: "A#5",
  448577: "A#4",
  448578: "A1",
  448579: "A0",
  448580: "F#7",
  448581: "F1",
  448582: "F#5",
  448583: "F#6",
  448584: "F#3",
  448585: "F#4",
  448586: "F#1",
  448587: "F#2",
  448588: "F2",
  448589: "F3",
  448590: "G#2",
  448532: "C#5",
  448533: "C#6",
  448534: "B6",
  448535: "B7",
  448536: "B4",
  448537: "B5",
  448538: "C#3",
  448539: "C#4",
  448540: "C#1",
  448541: "C#2",
  448542: "D#1",
  448544: "C1",
  448545: "C#7",
  448546: "C3",
  448547: "C2",
  448548: "C5",
  448549: "C4",
  448550: "C7",
  448551: "C6",
  448552: "G4",
  448553: "G5",
  448554: "G6",
  448555: "G7",
  448556: "G#7",
  448557: "G1",
  448558: "G2",
  448559: "G3",
  448605: "D#7",
  448606: "D1",
  448607: "D2",
  448608: "D3",
  448609: "D4",
  448610: "E7",
  448611: "E6",
  448612: "E5",
  448613: "E4",
  448614: "E3",
  448615: "E2",
  448616: "E1",
  448617: "D7",
  448618: "D6",
  448619: "D5",
};

// IDs we haven't verified individually yet (448543, 448591-448604, 448597-448600)
// We'll discover these by fetching their page titles
const UNVERIFIED_IDS = [
  448543,
  448591, 448592, 448593, 448594, 448595, 448596,
  448597, 448598, 448599, 448600,
  448601, 448602, 448603, 448604,
];

async function discoverNoteName(id) {
  const url = `https://freesound.org/people/TEDAgame/sounds/${id}/`;
  try {
    const resp = await fetch(url);
    const html = await resp.text();
    // Title format: "A#0.ogg - TEDAgame | Freesound" or similar
    // Or from the h1 tag which shows just the filename
    const match = html.match(/<title>\s*([A-Ga-g][#b]?\d)\.ogg/i) 
      || html.match(/<h1[^>]*>\s*([A-Ga-g][#b]?\d)\.ogg/i);
    if (match) {
      return match[1];
    }
    // Try the og:title meta
    const ogMatch = html.match(/property="og:title"\s+content="([A-Ga-g][#b]?\d)\.ogg"/i);
    if (ogMatch) return ogMatch[1];
    
    console.warn(`  Could not parse note name for ID ${id}, trying broader match...`);
    const broadMatch = html.match(/([A-G][#b]?\d)\.ogg/);
    if (broadMatch) return broadMatch[1];
    
    return null;
  } catch (err) {
    console.error(`  Error fetching ${id}: ${err.message}`);
    return null;
  }
}

async function downloadFile(url, filepath) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const buffer = await resp.arrayBuffer();
  await writeFile(filepath, Buffer.from(buffer));
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  // First, discover any unverified note names
  console.log('Discovering unverified note names...');
  for (const id of UNVERIFIED_IDS) {
    if (SOUND_MAP[id]) continue;
    const note = await discoverNoteName(id);
    if (note) {
      SOUND_MAP[id] = note;
      console.log(`  ${id} -> ${note}`);
    } else {
      console.warn(`  ${id} -> UNKNOWN (skipping)`);
    }
    // Be nice to the server
    await new Promise(r => setTimeout(r, 300));
  }

  const entries = Object.entries(SOUND_MAP).sort(([, a], [, b]) => a.localeCompare(b));
  console.log(`\nTotal sounds mapped: ${entries.length}`);
  console.log(`\nDownloading to ${OUTPUT_DIR}...\n`);

  let downloaded = 0;
  let skipped = 0;

  for (const [id, note] of entries) {
    // Use # in the note name but replace with 'sharp' for the filename to avoid URL issues
    const safeNote = note.replace('#', 'sharp');
    const filepath = resolve(OUTPUT_DIR, `${safeNote}.ogg`);
    const url = `https://cdn.freesound.org/previews/448/${id}_9311684-lq.ogg`;

    if (await fileExists(filepath)) {
      console.log(`  [skip] ${note} (${safeNote}.ogg already exists)`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  [${downloaded + skipped + 1}/${entries.length}] ${note}...`);
      await downloadFile(url, filepath);
      downloaded++;
      console.log(' OK');
      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Total: ${entries.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
