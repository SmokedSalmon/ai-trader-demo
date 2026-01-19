#!/usr/bin/env node
// Snapshot of 2 Rockflow API - /classic & (/assets or /positions) to convert to Alpha Arena API /positions results
// Usage: node scripts/snapshot-rockflow-assets.mjs, extracted JSON file under /.snapshots
// Quick Debug: refer to '/docs/mjs-script-debug.md
import fs from 'node:fs/promises';
import path from 'node:path';

/*
 APIs are valid ONLY the correspondent contest is running
 In case the end of any, go to:
 https://api.rockflow.ai/social/api/arenas to for active contest and participants
*/
import { infoFromRootApi, assets2Positions } from '../src/app/lib/rockflowApi.ts'

const url1 = 'https://api.rockflow.ai/social/api/arenas/classic'
const url2 = 'https://api.rockflow.ai/social/api/arenas/classic/campaign/assets'

// this mjs is ESM not CommonJS, cannot use '__dirname'
const outputDir = path.resolve(import.meta.dirname, '../.snapshots')
const outoutFile = path.join(outputDir, 'positions.temp.json')

async function main() {
    // content is large, console or terminal will trim
    // prepare output to file
    await fs.mkdir(outputDir, { recursive: true })

    // Fetch 1st API to get user account Initial Info
    console.log(`Fetching ${url1} ...`)
    const res1 = await fetch(url1, {
        headers: {
            appid: '1',
            // 'cache-control': 'no-cache',
            'content-type': 'application/json',
        },
        // mode: 'cors'
    })
    if (!res1.ok) { throw(`${res1.status} ${res1.statusText}`)}
    const userInfo = infoFromRootApi(await res1.json())
    const { currentEarningYieldRate, startingAsset } = userInfo
    
    // Fetch 2nd API for positions info
    console.log(`Fetching ${url2} ...`)
    const res2 = await fetch(url2, {
        headers: {
            appid: '1',
            // 'cache-control': 'no-cache',
            'content-type': 'application/json',
        },
        // mode: 'cors'
    })
    if (!res2.ok) { throw(`${res2.status} ${res2.statusText}`)}
    const converted = assets2Positions(await res2.json(), startingAsset, currentEarningYieldRate)

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