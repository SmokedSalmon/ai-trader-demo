export async function GET(){
    // const dummyData = (await import('mock/local-run/trades.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/trades.json')).default
    return Response.json(dummyData)
}

/* TODO, use the following throttled proxied handler later if you switch to live data */
/*
import cachedFetch, { CACHED_MARKER } from '@/lib/cachedFetch';
const ENDPOINT = 'https://api.rockflow.ai/social/api/arenas/classic/trades'
// should have default fromDateTime & toDateTime

export async function GET(request: Request) {
    try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.size > 0
        ? `${ENDPOINT}?${searchParams.toString()}`
        : `${ENDPOINT}?fromDateTime=${FROM_DATETIME}&toDateTime=${TO_DATETIME}`

        const res = await cachedFetch(url, {
            method: 'GET',
            headers: {
                'appid': '1',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
            },
        });
        if (!res.ok) throw(`${res.status} (${res.statusText})`)
        
        const { status, statusText, headers } = res
        const rawBody = await res.text()
        const newHeaders: HeadersInit = { 'Content-Type': headers.get('content-type') || 'application/json' }

        // forward the Cache Marker in headers to indicate it is a cached fetch, not the fresh ones
        const cached_time = headers.get(CACHED_MARKER)
        if (cached_time) newHeaders[CACHED_MARKER] = cached_time
        // throw('some random error', 'error detail')
        return new Response(rawBody, { status: status, statusText, headers: newHeaders })

    } catch (e) {
        let message = `Internal Proxy Error, outbound ${ENDPOINT}`
        if (e instanceof Error) message = message.concat(` - ${e.name}: ${e.message}`)
        return Response.json({ message }, { status: 500 })
    }
}
*/