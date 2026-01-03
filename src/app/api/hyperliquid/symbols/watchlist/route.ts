export async function GET(){
    const dummyData = (await import('mock/local-run/watchlist.json')).default
    return Response.json(dummyData)
}
