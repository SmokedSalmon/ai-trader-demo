export async function GET(){
    const dummyData = (await import('mock/local-run/trading-mode.json')).default
    return Response.json(dummyData)
}
