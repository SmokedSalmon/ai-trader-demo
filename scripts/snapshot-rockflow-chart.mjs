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
const USER_ID = 112711125048675
const MOCKINFO = {
    name: 'Deepseek V3.1',
    model: 'deepseek-chat',
    market: 'US',
    wallet: '0x4a0ae373afa45b048a83b79fa8f73ae7c3decee4',
}
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
            'cache-control': 'no-cache',
            'content-type': 'application/json',
        },
        mode: 'cors',
    })
    if (!res.ok) { throw(`${res.status} ${res.statusText}`)}
    const chartData = (await res.json()).data
    if (!chartData) throw('Chart data is corrupted')

    const converted = Object.values(chartData)
        // use only Those of Specific User
        .map(item => item.find(userDP => userDP.userId === USER_ID))
        // sort from oldest to newest
        .sort((a, b) => a.createTime - b.createTime)
        .map(item => ({
            // demo page chart plots by second, NOT mini-second
            timestamp: Math.round(item.createTime / 1000),
            datetime_str: (new Date(item.createTime)).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''),
            account_id: 1,
            username: MOCKINFO.name,
            user_id: 1,
            total_assets: item.netLiquidationValue,
            // Fixed, not of any use??
            cash: 0.0,
            positions_value: item.netLiquidationValue,
            wallet_address: MOCKINFO.wallet
        }))

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