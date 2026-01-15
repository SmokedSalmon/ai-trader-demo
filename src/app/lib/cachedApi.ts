/**
 * An ABANDONED Solution
 * @deprecated
 * Although it can cached response after the previous Upstream Call returns
 * But it Cannot cache those "Thundering Herd" Requests before the Upstream Response returns
 * Leave it here for later reference
 */

const CACHED_TIME = 5000    //  to cache response for 5 seconds
const CACHED_MARKER = 'X-Proxy-Cached-At'

interface CachedResponse {
    body: string,
    headers: HeadersInit,
    // headers: CachedHeaders,
    status: number,
    timestamp: number,
}

interface IRouterHandler {
    (req: Request): Promise<Response>
}

function cloneHeaders(givenRes: Headers): Headers {
    // const newHeaders: CachedHeaders = {};
    const newHeaders = new Headers()
    for (const [key, value] of givenRes.entries()) {
        // newHeaders[key] = value;
        newHeaders.append(key, value)
    }
    return newHeaders;
}

async function cacheResponse(givenRes: Response): Promise<CachedResponse> {
    const res = givenRes.clone()
    
    const headers = cloneHeaders(givenRes.headers)
    headers.append(CACHED_MARKER, (new Date()).toISOString())
    return {
        body: await res.text(),
        headers,
        status: res.status,
        timestamp: (new Date()).getTime()
    }
}

export default function CachedHandler(handler: IRouterHandler): IRouterHandler {
    let _cached: CachedResponse | undefined

    return async (req: Request) => {
        // use cached if within interval
        const now = new Date()
        if (_cached && (now.getTime() - _cached.timestamp < CACHED_TIME)) {
            console.log(`Returning Cache of ${req.url}`)
            console.log(_cached.headers)
            return new Response(_cached.body, {
                headers: _cached.headers,
                status: _cached.status,
            })
        }

        const res = await handler(req)
        cacheResponse(res).then(cached => _cached = cached)
        
        return res
    }
}
