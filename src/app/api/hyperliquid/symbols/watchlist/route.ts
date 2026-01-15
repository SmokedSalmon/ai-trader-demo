export async function GET(){
    // const dummyData = (await import('mock/local-run/watchlist.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/watchlist.json')).default
    return Response.json(dummyData)
}
