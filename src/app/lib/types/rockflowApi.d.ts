export interface IAssetRawAccountData {
    totalAssets: number,
    positions: {
        side: 0 | 1,
        quantity: number,
        cost: number,
        lastPrice: number,
        marketValue: number,
        profit: number,
        symbol: string,
        positionId: number | string,
        [key: string]: unknown,
    }[], 
    maintenanceMargin: number,
    grossPositionValue: number,
    [key: string]: unknown,
}
export interface IAssetsResponseBody {
    status: number,
    data: IAssetRawAccountData[],
}

export interface ITradeData {
    symbol: string,
    openClose: 1 | 2,
    side: 0 | 1,
    orderId: number,
    filledPrice: number,
    filledQuantity: number,
    profit: number,
    transactionTime: number,
    [key: string]: unknown,
}
export interface ITradesResponseBody {
    status: number,
    data: { [key: string]: ITradeData[] },
}

export interface IUserChartData {
    createTime: number,
    netLiquidationValue: number,
    tradeDay: number[],
    userId: number
}
export interface IChartResponseBody {
    status: number,
    data: { [key: string]: IUserChartData[] },
}

export interface IParticipantData {
    userId: number,
    startingAsset: number,
    currentEarningYieldRate: number,
    [key: string]: unknown
}
export interface IRootResponseBody {
    status: number,
    data: {
        participants: IParticipantData[]
    }
}