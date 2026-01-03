export async function GET(){
    const dummyData = (await import('mock/local-run/exchange-config.json')).default
    return Response.json(dummyData)
}