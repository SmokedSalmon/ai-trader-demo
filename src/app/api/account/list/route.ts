export async function GET(){
    // const dummyData = (await import('mock/local-run/list.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/list.json')).default
    return Response.json(dummyData)
}
