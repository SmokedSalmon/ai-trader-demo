import YahooFinance from 'yahoo-finance2'
import { QuoteResponseArray } from 'yahoo-finance2/modules/quote'

// const ENDPOINT = 'https://nof1.ai/api/crypto-prices'
const CACHED_TIME = 8000

const localMock = import('mock/mvp-demo-v1/crypto-prices.json')

// Mocked
// export async function GET() {
//     const dummyData = (await import('mock/mvp-demo-v1/crypto-prices.json')).default
//     return Response.json(dummyData)
// }

// Actual call with fallback
const yf = new YahooFinance()

interface ParsedTicks {
    prices: { [key: string]: {
        symbol: string,
        price: number,
        timestamp: number
    }}
}

const SYMBOL_MAP: Record<string, string> = {
    BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD',
    BNB: 'BNB-USD', DOGE: 'DOGE-USD', XRP: 'XRP-USD'
}
const REV_SYMBOL_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(SYMBOL_MAP).map(entry => [entry[1], entry[0]])
)
const convert = (yahooQuotes: QuoteResponseArray, timestamp: number) => (
    yahooQuotes.reduce<ParsedTicks>((acc, quote) => {
        const { symbol: quoteSymbol, regularMarketPrice: price } = quote
        const symbol = REV_SYMBOL_MAP[quoteSymbol] || quoteSymbol
        acc.prices[symbol] = { symbol, price, timestamp }
        return acc
    }, { prices: {} })
)

// simple throttle
let _inflightQuote: Promise<QuoteResponseArray>
let _lastQuoteTs: number

export async function GET(request: Request) {
    try {
        const watchlist = (await import('@/../../mock/mvp-demo-v1/watchlist.json')).default.symbols
        // 20 symbols (Batching is the key!)
        const symbols = watchlist.map(symbol => (SYMBOL_MAP[symbol] || symbol));

        // const symbols = [
        //   'GOOGL', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 
        //   'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD',
        //   'V', 'MA', 'PYPL', 'DIS', 'NKE', 'JPM'
        // ];

        // yahoo-finance2 fetches all symbols in ONE network request
        const now = (new Date()).getTime()
        const useCached = !!_inflightQuote && (now - _lastQuoteTs < CACHED_TIME)
        if (!useCached) {
            _inflightQuote = yf.quote(symbols)
            _lastQuoteTs = now
        }
        const quotes = await _inflightQuote 
        const tickers = convert(quotes, (new Date()).getTime())
        return Response.json(tickers, { status: 200 });
    } catch (e: unknown) {
        let message = 'Upstream yahoo-finance2 quote failed:'
        if (e instanceof Error) message += `${e.name} - ${e.message}`
        else message += String(e)

        // log the upstream fail and response a fallback to user
        console.warn(message)
        console.log('Serving backup response for /crypto-prices')
        const backup = (await localMock).default
        return Response.json(backup, { status: 200, statusText: 'OK' })
    }
}