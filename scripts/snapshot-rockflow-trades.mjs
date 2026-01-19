#!/usr/bin/env node
// Snapshot Rockflow API - /trades & convert to Alpha Arena API /trades result
// Usage: node scripts/snapshot-rockflow-trades.mjs, extracted JSON file under /.snapshots
// Quick Debug: refer to '/docs/mjs-script-debug.md
import fs from 'node:fs/promises';
import path from 'node:path';

/*
 APIs are valid ONLY the correspondent contest is running
 In case the end of any, go to:
 https://api.rockflow.ai/social/api/arenas to for active contest and participants
*/
import { trades2Trades } from '../src/app/lib/rockflowApi.ts'

const FROM_DATE = new Date('2025-10-24T13:30:00.000Z')
// const TO_DATE = new Date('2026-01-13T15:50:00.000Z')
const TO_DATE = new Date()

const endpoint = 'https://api.rockflow.ai/social/api/arenas/classic/trades'
const searchParam = new URLSearchParams({
    fromDateTime: FROM_DATE.getTime(),
    toDateTime: TO_DATE.getTime(),
})
const url = `${endpoint}?${searchParam.toString()}`

// this mjs is ESM not CommonJS, cannot use '__dirname'
const outputDir = path.resolve(import.meta.dirname, '../.snapshots')
const outoutFile = path.join(outputDir, 'trades.temp.json')

async function main() {
    // content is large, console or terminal will trim
    // prepare output to file
    await fs.mkdir(outputDir, { recursive: true })

    process.stdout.write(`Fetching ${endpoint} ...`)
    console.log(`Fetching ${endpoint} ...`)
    const res = await fetch(url, {
        headers: {
            appid: '1',
            // 'cache-control': 'no-cache',
            'content-type': 'application/json',
        },
        // mode: 'cors',
    })
    if (!res.ok) { throw(`${res.status} ${res.statusText}`)}
    const converted = trades2Trades(await res.json())

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