/**
 * Although this API uses real data, but the snapshot of each chat uses cached data
 * /snapshots please see `./[id]/snapshots/route.ts`
 */
const DECISION_INTERVAL = 300 * 1000    // 5 minutes per decision cycle

export async function GET(){
    // const dummyData = (await import('mock/local-run/model-chat.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/model-chat.json')).default
    // Modified timestamps of all entire
    const now = new Date()
    const tog = new Date(now.setDate(now.getDate() - 1))
    tog.setUTCHours(Math.round(Math.random() * 24))
    tog.setUTCMinutes(Math.round(Math.random() * 60))
    tog.setUTCSeconds(Math.round(Math.random() * 60))
    tog.setUTCMilliseconds(Math.round(Math.random() * 999))
    dummyData.entries.forEach((entry, i) => {
        const nd_raw = tog.getTime() - DECISION_INTERVAL * i
        const td_raw = nd_raw + entry.trigger_latency_seconds * 1000
        entry.decision_time = (new Date(nd_raw)).toISOString()
        entry.last_trigger_at = (new Date(td_raw)).toISOString()
        
        if (entry.reason) {
            entry.reason = entry.reason.replaceAll('Weekend', 'Weekday').replaceAll('weekend', 'weekday')
        }
    })
    return Response.json(dummyData)
}

/**
 * Rockflow's /chat api provides a fresh llm decision summary, use it later
 * @draft
*/
// import { TARGET_USER_ID, MOCK_INFO } from "@/lib/rockflowApi"
// const ENDPOINT = 'https://api.rockflow.ai/social/api/arenas/classic/chats'
// const DEFAULT_ITEM_COUNT = 1000
//
// export async function GET(req: Request){
//     const { searchParams } = new URL(req.url)
//     // Default Search Params, as required
//     if (!searchParams.get('limit')) searchParams.set('limit', `${DEFAULT_ITEM_COUNT}`)
//     const url = `${ENDPOINT}?${searchParams.toString()}`

//     try {
//         const res = await fetch(url, {
//             headers: {
//                 // require by rockflow.ai
//                 'appid': '1',
//                 'content-type': 'application/json',
//             },
//         })
//         if (!res.ok) throw(`${res.status} - ${res.statusText}`)
//         const body = await res.json()
//         const new_entries = body.data?.filter(entry => entry.userID === TARGET_USER_ID)
//             .map(entry => {

//                 return {
                    
//                 }
//             })
        
//         return Response.json(json, { status: 200, statusText: 'OK' })
//     } catch (e: unknown) {
//         let message = `Upstream API Call Failed [${url}]:`
//         if (e instanceof Error) message += `${e.name} - ${e.message}`
//         else message += String(e)
        
//         // log the upstream fail and response a fallback to user
//         console.warn(message)
//         console.log('Serving backup response for /trades')
//         const backup = (await localMock).default
//         return Response.json(backup, { status: 200, statusText: 'OK' })
//     }
// }
