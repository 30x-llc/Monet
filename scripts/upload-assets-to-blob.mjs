#!/usr/bin/env node
// Mirror public/assets/** into Vercel Blob, preserving paths.
// Idempotent: skips files that already exist with the same size.
// Run: node scripts/upload-assets-to-blob.mjs

import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep, posix } from "node:path";
import { readdirSync, statSync } from "node:fs";
import { put, head } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSETS_DIR = join(ROOT, "public", "assets");
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!TOKEN) {
    console.error("Missing BLOB_READ_WRITE_TOKEN. Run `vercel env pull` first.");
    process.exit(1);
}

const CONCURRENCY = 8;

function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const s = statSync(full);
        if (s.isDirectory()) out.push(...walk(full));
        else out.push(full);
    }
    return out;
}

const files = walk(ASSETS_DIR);
console.log(`Found ${files.length} files in public/assets`);

let uploaded = 0;
let skipped = 0;
let failed = 0;
let bytes = 0;
const started = Date.now();

async function uploadOne(absPath) {
    const rel = relative(ASSETS_DIR, absPath).split(sep).join(posix.sep);
    const pathname = `assets/${rel}`;
    const localStat = await stat(absPath);

    try {
        const remote = await head(pathname, { token: TOKEN });
        if (remote && remote.size === localStat.size) {
            skipped++;
            return;
        }
    } catch {
        // Not found — fall through to upload.
    }

    const data = await readFile(absPath);
    await put(pathname, data, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        token: TOKEN,
    });
    uploaded++;
    bytes += localStat.size;
}

async function worker(queue) {
    while (queue.length) {
        const file = queue.shift();
        if (!file) break;
        try {
            await uploadOne(file);
        } catch (err) {
            failed++;
            console.error(`✗ ${relative(ASSETS_DIR, file)}: ${err.message}`);
        }
        const done = uploaded + skipped + failed;
        if (done % 10 === 0 || done === files.length) {
            const mb = (bytes / 1024 / 1024).toFixed(1);
            const sec = ((Date.now() - started) / 1000).toFixed(0);
            console.log(
                `  ${done}/${files.length}  uploaded=${uploaded}  skipped=${skipped}  failed=${failed}  ${mb}MB  ${sec}s`,
            );
        }
    }
}

const queue = [...files];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

console.log(
    `\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed} ` +
        `total=${(bytes / 1024 / 1024).toFixed(1)}MB in ${((Date.now() - started) / 1000).toFixed(0)}s`,
);
process.exit(failed > 0 ? 1 : 0);
