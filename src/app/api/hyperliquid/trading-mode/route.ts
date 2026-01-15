export async function GET(){
    // const dummyData = (await import('mock/local-run/trading-mode.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/trading-mode.json')).default
    return Response.json(dummyData)
}
