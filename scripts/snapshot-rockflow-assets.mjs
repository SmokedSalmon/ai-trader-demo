#!/usr/bin/env node
// Snapshot Rockflow API - /assets & convert to Alpha Arena API /balance results
// Usage: node scripts/snapshot-rockflow-assets.mjs, extracted JSON file under /.snapshots
// Quick Debug: refer to '/docs/mjs-script-debug.md
import fs from 'node:fs/promises';
import path from 'node:path';

/*
 APIs are valid ONLY the correspondent contest is running
 In case the end of any, go to:
 https://api.rockflow.ai/social/api/arenas to for active contest and participants
*/
import { assets2Balance } from '../src/app/lib/rockflowApi.ts'

const endpoint = 'https://api.rockflow.ai/social/api/arenas/classic/campaign/assets'
// const searchParam = new URLSearchParams({
//     ...
// })
// const url = `${endpoint}?${searchParam.toString()}`
const url = endpoint

// this mjs is ESM not CommonJS, cannot use '__dirname'
const outputDir = path.resolve(import.meta.dirname, '../.snapshots')
const outoutFile = path.join(outputDir, 'balance.temp.json')

async function main() {
    // content is large, console or terminal will trim
    // prepare output to file
    await fs.mkdir(outputDir, { recursive: true })

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
    const body = await res.json()
    const balance = assets2Balance(body)

    const rawJson = JSON.stringify(balance)
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