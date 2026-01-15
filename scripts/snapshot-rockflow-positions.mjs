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
const USER_ID = 112711125048675
const MOCKINFO = {
    name: 'Deepseek V3.1',
    model: 'deepseek-chat',
    market: 'US',
    wallet: '0x4a0ae373afa45b048a83b79fa8f73ae7c3decee4',
    env: 'testnet',
}

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
            'cache-control': 'no-cache',
            'content-type': 'application/json',
        },
        method: 'GET',
        mode: 'cors',
    })
    if (!res1.ok) { throw(`${res1.status} ${res1.statusText}`)}
    const data1 = (await res1.json()).data
    
    const userInfo = data1?.participants?.find((p) => p.userId === USER_ID)
    if (!userInfo) throw(`No user info for ${USER_ID}`)
    const { currentEarningYieldRate, startingAsset } = userInfo
    
    // Fetch 2nd API for positions info
    console.log(`Fetching ${url2} ...`)
    const res2 = await fetch(url2, {
        headers: {
            appid: '1',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
        },
        method: 'GET',
        mode: 'cors',
    })
    if (!res2.ok) { throw(`${res2.status} ${res2.statusText}`)}
    const data2 = (await res2.json()).data

    const userAssets = data2[USER_ID]
    if (!userAssets) throw(`User ${USER_ID} has invalid asset data`)
    const {
        totalAssets, positions, maintenanceMargin: usedMargin,
        grossPositionValue,
    } = userAssets
    if (!positions || positions.length <= 1) stdout.write(`User ${USER_ID} has no positions`)

    const marginUsage = usedMargin / totalAssets * 100
    const availableBalance = totalAssets - usedMargin
    
    const newPositions = []
    let total_unrealized_pnl = 0.0
    for (const pos of positions) {
        const {
            side: rawSide, quantity, cost, 
            lastPrice, marketValue, profit,
            symbol, positionId,
        } = pos
        const side = rawSide === 0 ? 'LONG' : 'SHORT'
        const notional = Math.abs(cost)
        // can not find margin per position in rockflow API, here we fixed at 3
        const leverage = 3.0
        const margin_used = notional / leverage
        const return_on_equity = profit / margin_used
        newPositions.push({
            id: 0,
            symbol,
            // Map positionId to symbol full name?
            name: positionId,
            market: MOCKINFO.market,
            side,
            quantity,
            avg_cost: notional / quantity,
            current_price: lastPrice,
            notional,
            current_value: Math.abs(marketValue),
            unrealized_pnl: profit,
            leverage,   
            margin_used,
            return_on_equity,
            percentage: return_on_equity * 100,
            margin_mode: 'cross',
            liquidation_px: 0.0,
            max_leverage: 10.0,
            leverage_type: 'cross',
        })
        total_unrealized_pnl += profit
    }
    const userAcctInfo = {
        account_id: 1,
        account_name: MOCKINFO.name,
        model: MOCKINFO.model,
        environment: MOCKINFO.env,
        wallet_address: MOCKINFO.wallet,
        total_unrealized_pnl,
        available_cash: availableBalance,
        used_margin: usedMargin,
        positions_value: grossPositionValue,   // Not sure, not relevant for demo, yet the rockflow's value is more concise
        positions: newPositions,
        total_assets: totalAssets,
        margin_usage_percent: marginUsage,
        margin_mode: 'cross',
        initial_capital: startingAsset + 0.0,
        total_return: currentEarningYieldRate
    }
    const converted = {
        generated_at: (new Date).toISOString().replace(/Z$/, '000'),
        trading_mode: MOCKINFO.env,
        accounts: [userAcctInfo]
    }

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