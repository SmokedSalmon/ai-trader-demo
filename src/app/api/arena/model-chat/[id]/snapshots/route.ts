export async function GET(){
    // const dummyData = (await import('mock/local-run/snapshots.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/snapshots.json')).default
    return Response.json(dummyData)
}
