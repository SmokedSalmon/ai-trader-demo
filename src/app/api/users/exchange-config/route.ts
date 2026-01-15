export async function GET(){
    // const dummyData = (await import('mock/local-run/exchange-config.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/exchange-config.json')).default
    return Response.json(dummyData)
}