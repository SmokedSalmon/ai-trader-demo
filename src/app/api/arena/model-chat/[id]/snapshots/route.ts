
import mock from 'mock/mvp-demo-v1/snapshot-store.json' with { type: 'json' }

// Mocked
export async function GET(req: Request, context: { params: Promise<{ id: string }>}) {
    const { id } = await (context.params)
    // const dummyData = (await import('mock/local-run/snapshots.json')).default
    let snapshot = mock.snapshots[id]
    if (!snapshot) {
        const first = Object.keys(mock.snapshots)[0]
        snapshot = mock.snapshots[first]
    }
    console.log(snapshot)
    return Response.json(snapshot)
}
