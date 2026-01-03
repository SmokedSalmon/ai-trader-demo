export async function GET(){
    const dummyData = (await import('mock/local-run/asset-curve.json')).default
    return Response.json(dummyData)
}
