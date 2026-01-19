import { infoFromRootApi, assets2Positions } from '@/lib/rockflowApi'

const ENDPOINT1 = 'https://api.rockflow.ai/social/api/arenas/classic'
const ENDPOINT2 = 'https://api.rockflow.ai/social/api/arenas/classic/campaign/assets'
const localMock = import('mock/mvp-demo-v1/positions.json')

// Mocked
// export async function GET(){
//     // const dummyData = (await import('mock/local-run/positions.json')).default
//     const dummyData = (await import('mock/mvp-demo-v1/positions.json')).default
//     return Response.json(dummyData)
// }

// Actual call with fallback
export async function GET(req: Request) {
    try {
        const res1 = await fetch(ENDPOINT1, {
            headers: {
                // require by rockflow.ai
                'appid': '1',
                'content-type': 'application/json',
            },
        })
        if (!res1.ok) throw(`${res1.status} - ${res1.statusText}`)
        const json1 = infoFromRootApi(await res1.json())
        const { currentEarningYieldRate, startingAsset } = json1

        const res2 = await fetch(ENDPOINT2, {
            headers: {
                appid: '1',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
            },
        })
        if (!res2.ok) { throw(`${res2.status} ${res2.statusText}`)}
        const json2 = assets2Positions(await res2.json(), startingAsset, currentEarningYieldRate)
        
        return Response.json(json2, { status: 200, statusText: 'OK' })
    } catch (e: unknown) {
        let message = `Upstream API Call Failed [${ENDPOINT1}, ${ENDPOINT2}]:`
        if (e instanceof Error) message += `${e.name} - ${e.message}`
        else message += String(e)
        
        // log the upstream fail and response a fallback to user
        console.warn(message)
        console.log('Serving backup response for /positions')
        const backup = (await localMock).default
        return Response.json(backup, { status: 200, statusText: 'OK' })
    }
}
