import { chart2AssetCurve } from '@/lib/rockflowApi'

const ENDPOINT = 'https://api.rockflow.ai/social/api/arenas/classic/campaign/assets/chart'
const FROM_DATETIME = new Date(1761091200000)    // since campaign 2025-10-22T00:00:00.000Z?
const localMock = import('mock/mvp-demo-v1/asset-curve.json')

// Mocked
// export async function GET(){
//     // const dummyData = (await import('mock/local-run/asset-curve.json')).default
//     const dummyData = (await import('mock/mvp-demo-v1/asset-curve.json')).default
//     return Response.json(dummyData)
// }

// Actual call with fallback
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    // Default Search Params, as required
    searchParams.set('startTime', `${FROM_DATETIME.getTime()}`)
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
        const json = chart2AssetCurve(await res.json())
        
        return Response.json(json, { status: 200, statusText: 'OK' })
    } catch (e: unknown) {
        let message = `Upstream API Call Failed [${url}]:`
        if (e instanceof Error) message += `${e.name} - ${e.message}`
        else message += String(e)
        
        // log the upstream fail and response a fallback to user
        console.warn(message)
        console.log('Serving backup response for /asset-curve')
        const backup = (await localMock).default
        return Response.json(backup, { status: 200, statusText: 'OK' })
    }
}
