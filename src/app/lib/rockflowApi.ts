import type {
    IAssetRawAccountData, IAssetsResponseBody,
    ITradeData, ITradesResponseBody,
    IUserChartData, IChartResponseBody,
    IParticipantData, IRootResponseBody,
} from './types/rockflowApi.d'

const TARGET_USER_ID = 112711125048675
export const MOCK_INFO = {
    name: 'Deepseek V3.1',
    model: 'deepseek-chat',
    market: 'US',
    wallet: '0x4a0ae373afa45b048a83b79fa8f73ae7c3decee4',
    env: 'testnet',
}

/**
 * Rockflow's /assets to nof1.ai's /balance
 */
export function assets2Balance(body: IAssetsResponseBody) {
    const userAssets = body.data?.[TARGET_USER_ID]
    if (!userAssets) throw(`User ${TARGET_USER_ID} has invalid asset data`)
    const {
        totalAssets, positions, maintenanceMargin: usedMargin
    } = userAssets
    if (!positions || positions.length <= 1) console.log(`User ${TARGET_USER_ID} has no positions`)

    const marginUsage = usedMargin / totalAssets * 100
    const availableBalance = totalAssets - usedMargin

    const nowD = new Date()
    return {
        environment: MOCK_INFO.env,
        account_id: 1,
        total_equity: totalAssets,
        available_balance: availableBalance,        // not sure
        used_margin: usedMargin,
        maintenance_margin: usedMargin,             // what is it? other than margin_usage
        margin_usage_percent: marginUsage,
        withdrawal_available: availableBalance,     // what is it? other than available_balance
        wallet_address: MOCK_INFO.wallet,
        timestamp: nowD.getTime(),
        source: 'cache',
        cached_at: nowD.toISOString().replace(/Z$/, '000Z'),
    }
}

/**
 * Rockflow's /trades to nof1.ai's /trades
 */
export function trades2Trades(body: ITradesResponseBody, date: Date) {
    const userTrades = body.data?.[TARGET_USER_ID]
    if (!userTrades) throw(`User ${TARGET_USER_ID} has invalid trade data`)
    if (userTrades.length <= 1) {
        console.log(`User ${TARGET_USER_ID} has no trades`)
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
            trade_id: -1, // to assign later
            order_id: null,
            order_no: Math.random().toString().slice(2, 13),
            account_id: 1,
            account_name: MOCK_INFO.name,
            model: MOCK_INFO.model,
            side: new_side,
            direction,
            symbol,
            market: MOCK_INFO.market,
            price,
            quantity,
            // notional: Math.abs(profit),
            notional: Math.abs(price * quantity),
            commission: 0.0,    // fixed for demo
            trade_time,
            __trade_time_raw: transactionTime, 
            wallet_address: MOCK_INFO.wallet
        })
    }
    // sort from newest to oldest
    newTrades.sort((a, b) => b.__trade_time_raw - a.__trade_time_raw)
    // trade_id counts down from {length} to 1
    for (let i = 0; i < newTrades.length; i++) {
        newTrades[i].trade_id = newTrades.length - i
        // @ts-expect-error skip for exhaustive type def
        delete newTrades[i].__trade_time_raw
    }

    return {
        generated_at: (date || new Date()).toISOString().replace(/Z$/, '000'),
        accounts: [
            {
                account_id: 1,
                name: MOCK_INFO.name,
                model: MOCK_INFO.model
            }
        ],
        trades: newTrades
    }
}

/**
 * Rockflow's /chart to nof1.ai's /asset-curve
 */
export function chart2AssetCurve(body: IChartResponseBody) {
    const chartData = body.data
    if (!chartData) throw('Chart data is corrupted')

    const converted = Object.values(chartData)
        // use only Those of Specific User
        .map(item => item.find(userDP => userDP.userId === TARGET_USER_ID) as IUserChartData)
        // sort from oldest to newest
        .sort((a, b) => a.createTime - b.createTime)
        .map(item => ({
            // demo page chart plots by second, NOT mini-second
            timestamp: Math.round(item.createTime / 1000),
            datetime_str: (new Date(item.createTime)).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''),
            account_id: 1,
            username: MOCK_INFO.name,
            MOCK_INFO: 1,
            total_assets: item.netLiquidationValue,
            // Fixed, not of any use??
            cash: 0.0,
            positions_value: item.netLiquidationValue,
            wallet_address: MOCK_INFO.wallet
        }))
    return converted
}


/**
 * Extract user info from Rockflow's campaign root api /
 */
export function infoFromRootApi(body: IRootResponseBody) {
    const userInfo = body.data?.participants?.find((p) => p.userId === TARGET_USER_ID)
    if (!userInfo) throw(`No user info for ${TARGET_USER_ID}`)
    return userInfo
}
/**
 * Rockflow's /chart to nof1.ai's /positions
 */
export function assets2Positions(
    body: IAssetsResponseBody,
    startingAsset: number,
    currentEarningYieldRate: number
) {
    const userAssets = body?.data?.[TARGET_USER_ID]
    if (!userAssets) throw(`User ${TARGET_USER_ID} has invalid asset data`)
    const {
        totalAssets, positions, maintenanceMargin: usedMargin,
        grossPositionValue,
    } = userAssets
    if (!positions || positions.length <= 1) console.log(`User ${TARGET_USER_ID} has no positions`)

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
            market: MOCK_INFO.market,
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
        account_name: MOCK_INFO.name,
        model: MOCK_INFO.model,
        environment: MOCK_INFO.env,
        wallet_address: MOCK_INFO.wallet,
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
    return {
        generated_at: (new Date).toISOString().replace(/Z$/, '000'),
        trading_mode: MOCK_INFO.env,
        accounts: [userAcctInfo]
    }
}