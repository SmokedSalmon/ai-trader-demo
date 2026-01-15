/**
 * Relatively good proxy solution, can bundle inbound downstream requests within a time span into a single outbound request to upstream
 * Pay attentions to:
 * 1. Inflight Requests: Those between server sending outbound request and receiving response
 *     Excess Inflight requests are known as "Thundering Herd"
 * 2. Those between server received upstream response until the next expiration
 * 3. Every downstream Request should be matched to a new Response
 *     (Response as a readable stream can be consumed once, and it will be locked)
 *    So the correct way is to cache a data object of response, not Response instance itself 
 * 
 * What to Improve:
 * 1. It is limit to cache "fetch", add one more parameter to pass an upstream query function to cache
 * 2. It cannot distinguish the 1st inflight and other inflight inbound requests, all are considered fresh ones
 *   It is not of big deal as server usually has fast connection so the inflight duration is short
 */
const CACHED_TIME = 5000    //  to cache fetch Promise for 5 seconds
export const CACHED_MARKER = 'X-Proxy-Cached'

interface CachedResponseData { body: BodyInit, status: number, statusText: string, headers: Record<string, string> }
type CacheEntry = { promise: Promise<CachedResponseData>, data?: CachedResponseData, timestamp: number }
type ICachedFetch = typeof fetch

/**
 * Construct a data object representing the response
 */
const responseToCache = async (res: Response) => {
    const { status, statusText, headers: inboundHeaders } = res
    const body = await res.text()   // raw body
    const headers = Object.fromEntries(inboundHeaders.entries())
    return { body, status, statusText, headers }
}

/**
 * Create a Response by the data object that built for cache earlier
 */
const newResponseFromCache = (data: CachedResponseData) => {
    const { body, status, statusText, headers } = data
    return new Response(body, { status, statusText, headers})
}

/**
 * The Cache store
 */
const _cache: { [key: string]: CacheEntry } = {}

/**
 * Return an  async function that executes"fetch()" and cache the response for a time span
 * cached response will be served rather than a fresh call to upstream API
 * This function has the same signature of "fetch()"
 */
const cachedFetch: ICachedFetch = async (input, init) => {
    // first determine the key, that used to identified caches
    // here, key is the full url of the request, which is sufficient for most scenarios
    let key: string
    if (input instanceof Request) key = input.url
    else if (typeof(input) === 'string') key = input
    else if (input instanceof URL) key = (input as URL).href
    else throw(`Invalid fetch input: ${input}`)

    
    const cache = _cache[key]
    const now = new Date()
    const nowTime = now.getTime()
    
    // Look for any cached response data for the correspondent request
    let inflightFetch: Promise<CachedResponseData>
    if (cache && (nowTime - cache.timestamp < CACHED_TIME)) {
        // cache found, with data already stored to serve
        if (cache.data) {
            // if data has been cached
            console.log(`Returning Cache for ${key}`)
            return newResponseFromCache(cache.data)
        }
        // cache found, but it is a ongoing request waiting for respond
        // Aka.Inflight requests
        // pull request into this single cached promise
        console.log(`Returning inflight fetch promise of ${key}`)
        inflightFetch = cache.promise
    } else {
        // cache expires or no cache for the request
        // invoke a fresh data fetch, serve and cache the data
        inflightFetch = (async () => {
            console.log(input)
            const res = await fetch(input, init)
            const resData = await responseToCache(res)
            // Mark cached marker in the Header for later request
            _cache[key].data = {
                ...resData,
                headers: { ...resData.headers, [CACHED_MARKER]: now.toISOString() }
            }
            return resData
        })()
        // catch the fetch promise (inflight fetch promise) immediately to prevent "Thundering Herd"
        _cache[key] = { promise: inflightFetch, timestamp: nowTime }
    }
    
    const resData = await inflightFetch
    return newResponseFromCache(resData)
   
}

export default cachedFetch
