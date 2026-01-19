#!/usr/bin/env node
// Snapshot Rockflow API - /chart & convert to Alpha Arena API /asset-curve result
// It extracts Chart Data of a SINGLE USER, will modified in the next version
// Usage: node scripts/snapshot-rockflow-chart.mjs, extracted JSON file under /.snapshots
// Quick Debug: refer to '/docs/mjs-script-debug.md
import fs from 'node:fs/promises';
import path from 'node:path';

/*
 APIs are valid ONLY the correspondent contest is running
 In case the end of any, go to:
 https://api.rockflow.ai/social/api/arenas to for active contest and participants
*/
import { chart2AssetCurve } from '../src/app/lib/rockflowApi.ts'

const FROM_DATE_RAW = 1761091200000    // since campaign 2025-10-22T00:00:00.000Z?
// const TO_DATE = new Date('2026-01-13T15:50:00.000Z')
const TO_DATE = new Date()

const endpoint = 'https://api.rockflow.ai/social/api/arenas/classic/campaign/assets/chart'
const searchParam = new URLSearchParams({
    startTime: FROM_DATE_RAW,
})
const url = `${endpoint}?${searchParam.toString()}`

// this mjs is ESM not CommonJS, cannot use '__dirname'
const outputDir = path.resolve(import.meta.dirname, '../.snapshots')
const outoutFile = path.join(outputDir, 'asset-curve.temp.json')

async function main() {
    // content is large, console or terminal will trim
    // prepare output to file
    await fs.mkdir(outputDir, { recursive: true })

    process.stdout.write(`Fetching ${url} ...`)
    console.log(`Fetching ${url} ...`)
    const res = await fetch(url, {
        headers: {
            appid: '1',
            // 'cache-control': 'no-cache',
            'content-type': 'application/json',
        },
        // mode: 'cors',
    })
    if (!res.ok) { throw(`${res.status} ${res.statusText}`)}
    const converted = chart2AssetCurve(await res.json())

    const rawJson = JSON.stringify(converted)
    const output = '=== Converted JSON (Possibly Trimmed) ===\n'
        + rawJson
        + '\n=== End of JSON ===\n'
        + 'Large Content is possibly trimmed at terminal or console\n'
        + `Please go to ${outoutFile} for final result (minified by default)\n`
    await fs.writeFile(outoutFile, rawJson)
    console.log(output)
}

await main().catch((e) => {
    console.error(e)
    process.exit(1)
})