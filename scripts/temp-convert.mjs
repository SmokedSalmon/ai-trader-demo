#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

// this mjs is ESM not CommonJS, cannot use '__dirname'
const outputDir = path.resolve(import.meta.dirname, '../.snapshots')
const outoutFile1 = path.join(outputDir, 'model-chat_full.temp.json')
const outoutFile2 = path.join(outputDir, 'snapshot-store_full.temp.json')
import original from '../mock/nor1.ai-archived-2025-12-31/conversations.json' with { type: 'json' }

export const MOCK_INFO = {
    name: 'Deepseek V3.1',
    model: 'deepseek-chat',
    market: 'US',
    wallet: '0x4a0ae373afa45b048a83b79fa8f73ae7c3decee4',
    env: 'testnet',
}

const normalizeSymbol = (symbol) => {
    let nSymbol = symbol.split(':')[1] || symbol
    if (nSymbol === 'XYZ100') nSymbol = 'NDX'
    return nSymbol
}

const normalizeOperation = (action) => {
    const la = action.toLowerCase()
    if (la.includes('hold')) return 'hold'
    if (la.includes('close')) return 'close'
    if (la.includes('buy') && la.includes('enter')) return 'buy'
    if (la.includes('sell') && la.includes('enter')) return 'sell'
    return 'unknown'
}

const chatEntryConvert = (([key, value]) => {
    const symbol = normalizeSymbol(key)
    delete value.is_add
    value.coin = value.coin.split(':')[1] || entry.coin
    return [symbol, value]
})

// async function main() {
//     // content is large, console or terminal will trim
//     // prepare output to file
//     await fs.mkdir(outputDir, { recursive: true })

//     const new_conversations = original.conversations.map((c) => {
//         const {
//             id, timestamp, inserted_at, run_id, model_id,
//             user_prompt, llm_response, cot_trace, cot_trace_summary,
//         } = c
    
//         let cycle_id = Math.random().toString().slice(2, 6) // random 4 digits?
//         const skill = 'swing_trading'
    
//         const new_llm_response = Object.fromEntries(Object.entries(llm_response).map(chatEntryConvert))
//         const new_cot_trace = (typeof cot_trace === 'string')
//             ? cot_trace
//             : Object.fromEntries(Object.entries(cot_trace).map(chatEntryConvert))
        
//         return {
//             id, skill, inserted_at, run_id, timestamp, model_id,
//             user_prompt, cot_trace_summary,
//             cot_trace: new_cot_trace,
//             llm_response: new_llm_response,
//             cycle_id,
//         }
//     })
//     const converted = { conversations: new_conversations }
    
//     const rawJson = JSON.stringify(converted)
//     const output = '=== Converted JSON (Possibly Trimmed) ===\n'
//         + rawJson
//         + '\n=== End of JSON ===\n'
//         + 'Large Content is possibly trimmed at terminal or console\n'
//         + `Please go to ${outoutFile} for final result (minified by default)\n`
//     await fs.writeFile(outoutFile, rawJson)
//     console.log(output)
// }

async function main() {
    // content is large, console or terminal will trim
    // prepare output to file
    await fs.mkdir(outputDir, { recursive: true })

    const count = original.conversations.length
    const snapshots = {}
    const chat_entries = original.conversations.map((c, i) => {
        const id = 4252 - i
        const executed = Math.random() > 0.1
        const prev_portion = Math.random()
        
        const {
            id: model_long_id, aggregation_id, run_name, timestamp, inserted_at, run_id, model_id, model_type,
            user_prompt, llm_response, cot_trace, cot_trace_summary,
        } = c
    
        const decision_time = (new Date(timestamp * 1000)).toISOString()
        const last_trigger_at = (new Date(inserted_at * 1000)).toISOString()
        const trigger_latency_seconds = inserted_at - timestamp

        const snapshot = {
            id,
            // replace the horizontal line '---' with '***', trim staring & trailing whitespaces
            prompt_snapshot: user_prompt.replace(/^-{3,}$/gm, '***').replace(/^\s+/gm, '').replace(/\s+$/gm, ''),
            reasoning_snapshot: '',
            decision_snapshot: '',
        }
    
        const operation = []
        const symbols = []
        let decision_count = Object.keys(llm_response).length
        for (const key in llm_response) {
            const symbol = normalizeSymbol(key)
            symbols.push(symbol)
            const {
                invalidation_condition, risk_usd, confidence, is_add,
                justification, profit_target, leverage, signal, quantity, stop_loss,
            } = llm_response[key]
            snapshot.decision_snapshot += `## ${symbol.toUpperCase()}\n\n` +
                    `### Invalidation Condition\n${invalidation_condition.toString()}\n` +
                    `### Risk ($USD)\n${risk_usd}\n` +
                    `### Confidence\n${confidence}\n` +
                    `### Adding Position?\n${is_add.toString()}\n` +
                    `### Justification\n${justification}\n` +
                    `### Profit Target\n${profit_target}\n` +
                    `### Leverage\n${leverage}\n` +
                    `### Signal\n${normalizeOperation(signal)}\n` +
                    `### Quantity\n${quantity}\n` +
                    `### Stop Loss\n${stop_loss}\n\n`
            if (decision_count > 1) snapshot.decision_snapshot += '***\n'
            operation.push(normalizeOperation(llm_response[key].signal))
            decision_count --
        }
        // Chain of thought
        if (typeof cot_trace === 'string') snapshot.reasoning_snapshot = cot_trace
        else {
            let cot_count = Object.keys(cot_trace).length
            for (const key in cot_trace) {
                const symbol = normalizeSymbol(key)
                const {
                    invalidation_condition, risk_usd, confidence, is_add,
                    justification, profit_target, leverage, signal, quantity, stop_loss,
                } = cot_trace[key]
                console.log(symbol)
                snapshot.reasoning_snapshot += `## ${symbol.toUpperCase()}\n\n` +
                    `### Invalidation Condition\n${invalidation_condition.toString()}\n` +
                    `### Risk ($USD)\n${risk_usd}\n` +
                    `### Confidence\n${confidence}\n` +
                    `### Adding Position?\n${is_add.toString()}\n` +
                    `### Justification\n${justification}\n` +
                    `### Profit Target\n${profit_target}\n` +
                    `### Leverage\n${leverage}\n` +
                    `### Signal\n${normalizeOperation(signal)}\n` +
                    `### Quantity\n${quantity}\n` +
                    `### Stop Loss\n${stop_loss}\n\n`
            }
            if (cot_count > 1) snapshot.reasoning_snapshot += '***\n'
            cot_count --
        }

        snapshots[id] = snapshot
        return {
            id,
            // for modal chat
            "account_id": aggregation_id,
            "account_name": run_name,
            "model": model_type,
            // use array later
            operation: operation,
            symbol: symbols,
            "reason": cot_trace_summary,
            executed,
            prev_portion: 0.0,
            target_portion: 0.0,
            total_balance: 0.0,
            "order_id": null,
            decision_time,
            "trigger_mode": "unified",
            "strategy_enabled": true,
            last_trigger_at,
            trigger_latency_seconds,
            "wallet_address": MOCK_INFO.wallet
            // for all the snapshots
        }
    })
    const converted1 = {
        generated_at: (new Date()).toISOString(),
        entries: chat_entries
    }
    const converted2 = { snapshots }
    
    const rawJson1 = JSON.stringify(converted1, null, 4)
    const output1 = '=== Converted JSON (Possibly Trimmed) ===\n'
        + rawJson1
        + '\n=== End of JSON ===\n'
        + 'Large Content is possibly trimmed at terminal or console\n'
        + `Please go to ${outoutFile1} for final result (minified by default)\n`
    await fs.writeFile(outoutFile1, rawJson1)
    console.log(output1)

    const rawJson2 = JSON.stringify(converted2, null, 4)
    const output2 = '=== Converted JSON (Possibly Trimmed) ===\n'
        + rawJson2
        + '\n=== End of JSON ===\n'
        + 'Large Content is possibly trimmed at terminal or console\n'
        + `Please go to ${outoutFile2} for final result (minified by default)\n`
    await fs.writeFile(outoutFile2, rawJson2)
    console.log(output2)
}



await main().catch((e) => {
    console.error(e)
    process.exit(1)
})