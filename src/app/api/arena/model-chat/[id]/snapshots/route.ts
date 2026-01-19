
import mock from 'mock/mvp-demo-v1/snapshot-store.json' with { type: 'json' }

const CHAT_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',    // "Saturday"
  year: 'numeric',    // "2025"
  month: 'long',      // "December"
  day: '2-digit',     // "06"
  hour: '2-digit',    // "08"
  minute: '2-digit',  // "49"
  hour12: true        // "am/pm"
});
const CACHE_TIME = 10000 // in mini seconds

// cached
const _cached: Record<string, { body: ResponseInit, timestamp: number }> = {}

// Mocked
export async function GET(req: Request, context: { params: Promise<{ id: string }>}) {
    const { searchParams } = new URL(req.url)
    const decision_time_str = searchParams.get('dts')
    // if (decision_time_str) console.log(`Snapshot explicitly requested with a decision time: ${decision_time_str}`)
    const { id } = await (context.params)
    const cacheKey = `${id}-${decision_time_str}`
    
    if (_cached[cacheKey] && ((new Date()).getTime() - _cached[cacheKey].timestamp < CACHE_TIME)) {
        return Response.json(_cached[cacheKey].body, { status: 200, statusText: 'OK' })
    }

    delete _cached[cacheKey]
    // const dummyData = (await import('mock/local-run/snapshots.json')).default
    let snapshot = mock.snapshots[id]
    if (!snapshot) {
        const first = Object.keys(mock.snapshots)[0]
        snapshot = mock.snapshots[first]
    }

    if (!decision_time_str) return Response.json(snapshot)

    try {
        // replace some time-related string, in a simple way for MVP Demo v1
        // Such as "...t is Saturday, December 06, 2025 08:49 am ET. ...
        const decision_time = Number.parseInt(decision_time_str)
        const timeMatchRegexp = /\w+\W+\w+\s+\d{1,2},\s+\d{4}\s+\d{2}:\d{2}\s+\w{2}/g
        const weekdayRegExp = /monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi
        let gap = 0
        let new_weekday_str = ''

        // replacing time strings in User Prompts
        const matches1 = [...snapshot.prompt_snapshot.matchAll(timeMatchRegexp)]
        matches1.forEach((match, i) => {
            const str = match[0]
            const start = match.index
            const origin_ds = (new Date(str)).getTime()
            if (i === 0) gap = decision_time - origin_ds
            const new_ds = new Date(origin_ds + gap)
            new_weekday_str = new_ds.toLocaleDateString('en', { weekday: 'long'})
            const new_ds_str = CHAT_TIME_FORMATTER.format(new_ds)
            snapshot.prompt_snapshot = snapshot.prompt_snapshot.substring(0, start) + new_ds_str + snapshot.prompt_snapshot.substring(start + str.length)
            // console.log(`User Prompt: replacing ${str} with ${new_ds_str}`)
        })
        const matches2 = [...snapshot.prompt_snapshot.matchAll(weekdayRegExp)]
        matches2.forEach((match, i) => {
            const str = match[0]
            const start = match.index
            snapshot.prompt_snapshot = snapshot.prompt_snapshot.substring(0, start) + new_weekday_str + snapshot.prompt_snapshot.substring(start + str.length)
            // console.log(`User Prompt: replacing ${str} with ${new_weekday_str}`)
        })
        snapshot.prompt_snapshot = snapshot.prompt_snapshot.replaceAll('Weekend', 'Weekday').replaceAll('weekend', 'weekday')

        // replacing time strings in Chain of Thought
        const matches3 = [...snapshot.reasoning_snapshot.matchAll(timeMatchRegexp)]
        matches3.forEach((match, i) => {
            const str = match[0]
            const start = match.index
            const origin_ds = (new Date(str)).getTime()
            if (i === 0) gap = decision_time - origin_ds
            const new_ds = new Date(origin_ds + gap)
            new_weekday_str = new_ds.toLocaleDateString('en', { weekday: 'long'})
            const new_ds_str = CHAT_TIME_FORMATTER.format(new_ds)
            snapshot.reasoning_snapshot = snapshot.reasoning_snapshot.substring(0, start) + new_ds_str + snapshot.reasoning_snapshot.substring(start + str.length)
            // console.log(`Chain of Thought: replacing ${str} with ${new_ds_str}`)
        })
        const matches4 = [...snapshot.reasoning_snapshot.matchAll(weekdayRegExp)]
        matches4.forEach((match, i) => {
            const str = match[0]
            const start = match.index
            snapshot.reasoning_snapshot = snapshot.reasoning_snapshot.substring(0, start) + new_weekday_str + snapshot.reasoning_snapshot.substring(start + str.length)
            // console.log(`Chain of Thought: replacing ${str} with ${new_weekday_str}`)
        })
        snapshot.reasoning_snapshot = snapshot.reasoning_snapshot.replaceAll('Weekend', 'Weekday').replaceAll('weekend', 'weekday')

        // replacing time strings in Decision
        const matches5 = [...snapshot.decision_snapshot.matchAll(timeMatchRegexp)]
        matches5.forEach((match, i) => {
            const str = match[0]
            const start = match.index
            const origin_ds = (new Date(str)).getTime()
            if (i === 0) gap = decision_time - origin_ds
            const new_ds = new Date(origin_ds + gap)
            new_weekday_str = new_ds.toLocaleDateString('en', { weekday: 'long'})
            const new_ds_str = CHAT_TIME_FORMATTER.format(new_ds)
            snapshot.decision_snapshot = snapshot.decision_snapshot.substring(0, start) + new_ds_str + snapshot.decision_snapshot.substring(start + str.length)
            // console.log(`Decisions: replacing ${str} with ${new_ds_str}`)
        })
        const matches6 = [...snapshot.decision_snapshot.matchAll(weekdayRegExp)]
        matches6.forEach((match, i) => {
            const str = match[0]
            const start = match.index
            snapshot.decision_snapshot = snapshot.decision_snapshot.substring(0, start) + new_weekday_str + snapshot.decision_snapshot.substring(start + str.length)
            // console.log(`Decisions: replacing ${str} with ${new_weekday_str}`)
        })
        snapshot.decision_snapshot = snapshot.decision_snapshot.replaceAll('Weekend', 'Weekday').replaceAll('weekend', 'weekday')

    } catch (e: unknown) {
        const eMsg = e instanceof Error ? `${e.name} - ${e.message}` : e
        console.warn(`There's issue replacing time strings in snapshots: ${eMsg}`)
    } finally {
        // console.log(snapshot)
        _cached[cacheKey] = { body: snapshot, timestamp: (new Date()).getTime() }
        return Response.json(snapshot, { status: 200, statusText: 'OK' })
    }
}
