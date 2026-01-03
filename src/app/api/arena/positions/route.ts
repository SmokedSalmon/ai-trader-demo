export async function GET(){
    const dummyData = (await import('mock/local-run/positions.json')).default
    return Response.json(dummyData)
}
