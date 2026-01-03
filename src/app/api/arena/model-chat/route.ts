export async function GET(){
    const dummyData = (await import('mock/local-run/model-chat.json')).default
    return Response.json(dummyData)
}
