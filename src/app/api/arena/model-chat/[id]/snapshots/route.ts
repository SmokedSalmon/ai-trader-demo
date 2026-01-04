export async function GET(){
    const dummyData = (await import('mock/local-run/snapshots.json')).default
    return Response.json(dummyData)
}
