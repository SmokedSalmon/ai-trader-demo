export async function GET(){
    // const dummyData = (await import('mock/local-run/model-chat.json')).default
    const dummyData = (await import('mock/mvp-demo-v1/model-chat.json')).default
    return Response.json(dummyData)
}
