export async function GET(){
    const dummyData = (await import('mock/local-run/trades.json')).default
    return Response.json(dummyData)
}
