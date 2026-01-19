import { assets2Balance } from '@/lib/rockflowApi'

const ENDPOINT = 'https://api.rockflow.ai/social/api/arenas/classic/campaign/assets'
const localMock = import('mock/mvp-demo-v1/balance.json')

// Mocked
// export async function GET(){
//     // const dummyData = (await import('mock/local-run/balance.json')).default
//     const dummyData = (await localMock).default
//     return Response.json(dummyData)
// }

// Actual call with fallback
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const url = searchParams.size > 0
        ? `${ENDPOINT}?${searchParams.toString()}`
        : ENDPOINT

    try {
        const res = await fetch(url, {
            headers: {
                // require by rockflow.ai
                'appid': '1',
                'content-type': 'application/json',
            },
        })
        if (!res.ok) throw(`${res.status} - ${res.statusText}`)
        const json = assets2Balance(await res.json())
        
        return Response.json(json, { status: 200, statusText: 'OK' })
    } catch (e: unknown) {
        let message = `Upstream API Call Failed [${url}]:`
        if (e instanceof Error) message += `${e.name} - ${e.message}`
        else message += String(e)
        
        // log the upstream fail and response a fallback to user
        console.warn(message)
        console.log('Serving backup response for /positions')
        const backup = (await localMock).default
        return Response.json(backup, { status: 200, statusText: 'OK' })
    }
}
