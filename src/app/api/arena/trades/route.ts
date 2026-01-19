import { trades2Trades } from '@/lib/rockflowApi'

const ENDPOINT = 'https://api.rockflow.ai/social/api/arenas/classic/trades'
// Starts from Fri Oct 24 2025 15:30:00, and To Data is upon request
const FROM_DATETIME = new Date(1761312600000)
const TO_DATETIME = new Date()
const localMock = import('mock/mvp-demo-v1/trades.json')

// Mocked
// export async function GET(){
//     // const dummyData = (await import('mock/local-run/trades.json')).default
//     const dummyData = (await import('mock/mvp-demo-v1/trades.json')).default
//     return Response.json(dummyData)
// }

// Actual call with fallback
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    // Default Search Params, as required
    searchParams.set('fromDateTime', `${FROM_DATETIME.getTime()}`)
    searchParams.set('toDateTime', `${TO_DATETIME.getTime()}`)
    const url = `${ENDPOINT}?${searchParams.toString()}`

    try {
        const res = await fetch(url, {
            headers: {
                // require by rockflow.ai
                'appid': '1',
                'content-type': 'application/json',
            },
        })
        if (!res.ok) throw(`${res.status} - ${res.statusText}`)
        const json = trades2Trades(await res.json(), TO_DATETIME)
        
        return Response.json(json, { status: 200, statusText: 'OK' })
    } catch (e: unknown) {
        let message = `Upstream API Call Failed [${url}]:`
        if (e instanceof Error) message += `${e.name} - ${e.message}`
        else message += String(e)
        
        // log the upstream fail and response a fallback to user
        console.warn(message)
        console.log('Serving backup response for /trades')
        const backup = (await localMock).default
        return Response.json(backup, { status: 200, statusText: 'OK' })
    }
}
