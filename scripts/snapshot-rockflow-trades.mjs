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
const USER_ID = 112711125048675
const MOCKINFO = {
    name: 'Deepseek V3.1',
    model: 'deepseek-chat',
    market: 'US',
    wallet: '0x4a0ae373afa45b048a83b79fa8f73ae7c3decee4',
}
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
            'cache-control': 'no-cache',
            'content-type': 'application/json',
        },
        method: 'GET',
        mode: 'cors',
    })
    if (!res.ok) { throw(`${res.status} ${res.statusText}`)}
    const data = (await res.json()).data
    // const text = JSON.stringify(json)
    // console.log(text)

    const userTrades = data[USER_ID]
    if (!userTrades) throw(`User ${USER_ID} has invalid trade data`)
    if (userTrades.length <= 1) {
        stdout.write(`User ${USER_ID} has no trades`)
        return
    }

    const newTrades = []
    for (const trade of userTrades) {
        const {
            symbol, openClose, side, orderId,
            filledPrice: price, filledQuantity: quantity, profit,
            transactionTime,
        } = trade
        let trade_time
        try {
            trade_time = (new Date(transactionTime)).toISOString()
        } catch (e) {
            console.warn(`${e}: Trade ${orderId} invalid transaction time: ${transactionTime}`)
            continue
        }
        if (openClose !== 1 && openClose !== 2) {
            console.warn(`Trade ${orderId} is neither "OPEN" nor "CLOSE"`)
            continue
        }
        // if (side !== 0 && side !== 1) {
        //     warn(`Trade ${orderId} has invalid '.side': ${side}`)
        //     continue
        // }

        // this property determine the icon on the chart for MVP. 3 Icons, B, S & C
        // const new_side = openClose === 1
        //     ? (side === 0 ? 'BUY' : 'SELL')
        //     : 'CLOSE'
        // I Prefer using only the B & S Icon for MVP Demo v1
        const new_side = side === 0 ? 'BUY' : 'SELL'
        // Chart irrelevant on MVP Demo v1, I prefer LONG/SHORT over BUY/SELL
        const direction = openClose === 1
            ? (side === 0 ? 'LONG' : 'SHORT')
            : (side === 0 ? 'SHORT' : 'LONG')
        
        newTrades.push({
            trade_id: null, // to assign later
            order_id: null,
            order_no: Math.random().toString().slice(2, 13),
            account_id: 1,
            account_name: MOCKINFO.name,
            model: MOCKINFO.model,
            side: new_side,
            direction,
            symbol,
            market: MOCKINFO.market,
            price,
            quantity,
            // notional: Math.abs(profit),
            notional: Math.abs(price * quantity),
            commission: 0.0,    // fixed for demo
            trade_time,
            __trade_time_raw: transactionTime, 
            wallet_address: MOCKINFO.wallet
        })
    }
    // sort from newest to oldest
    newTrades.sort((a, b) => b.__trade_time_raw - a.__trade_time_raw)
    // trade_id counts down from {length} to 1
    for (let i = 0; i < newTrades.length; i++) {
        newTrades[i].trade_id = newTrades.length - i
        delete newTrades[i].__trade_time_raw
    }

    const converted = {
        generated_at: TO_DATE.toISOString().replace(/Z$/, '000'),
        accounts: [
            {
                account_id: 1,
                name: MOCKINFO.name,
                model: MOCKINFO.model
            }
        ],
        trades: newTrades
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