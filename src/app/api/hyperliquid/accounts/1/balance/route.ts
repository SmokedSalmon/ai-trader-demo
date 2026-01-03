export async function GET(){
    const dummyData = (await import('mock/local-run/balance.json')).default
    return Response.json(dummyData)
}
