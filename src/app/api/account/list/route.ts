export async function GET(){
    const dummyData = (await import('mock/local-run/list.json')).default
    return Response.json(dummyData)
}
