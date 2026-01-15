export async function GET(){
    // const dummyData = (await import('mock/local-run/check-mainnet-accounts.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/check-mainnet-accounts.json')).default
    return Response.json(dummyData)
}
