type EventType = 'open' | 'message' | 'close' | 'error'

/**
 A WebSocket's Interface
 _ws.readyState, _ws.CLOSED, _ws.CLOSING, _ws.CONNECTING, _ws.OPEN;
 _ws.addEventListener(), _ws.close(), _ws.dispatchEvent(), _ws.removeEventListener();
 _ws.send()
 _ws.onclose, _ws.onerror, _ws.onmessage, _ws.onopen;
 _ws.url
*/
const _ws = { readyState: WebSocket.CONNECTING }

let _onOpen = () => {}
// Dummy Response to sended message
let _onMessage = () => {}
let _onError = () => {}
let _onClose = () => {}

const mockedBootstrapOK = {
    data: JSON.stringify({
        type: 'bootstrap_ok',
        user: { id: 1, username: "default" },
        account: { id: 1, name: "MVP Trail", user_id: 1 },
        trading_mode: 'testnet',
        // overview: '',
        // positions: '',
        // orders: '',
        // trades: '',
        // ai_decisions: '',
        // all_asset_curves: '',
    })
} as MessageEvent

const addEventListener = (state: EventType, handler: (() => null)) => {
    if (state == 'open') _onOpen = handler
    else if (state == 'message') _onMessage = handler
    else if (state == 'error') _onError = handler
    else if (state == 'close') _onClose = handler
}
const removeEventListener = () => {
    _onOpen = () => {}
    _onMessage = () => {}
    _onError = () => {}
    _onClose = () => {}
}

const send = (msgStr: string) => {
    const msg = JSON.parse(msgStr)
    if (msg.type === 'bootstrap') {
        _onMessage(mockedBootstrapOK)
    } else if (msg.type === 'get_snapshot') {
        
    } else if (msg.type === 'get_asset_curve') {

    } else if (msg.type === 'place_order') {

    } else if (msg.type === 'switch_user') {
        
    } else if (msg.type === 'switch_account') {
        
    }
}

_ws.addEventListener = addEventListener
_ws.removeEventListener = removeEventListener
_ws.send = send
export function connect() {
    _ws.readyState = WebSocket.CONNECTING
    const timer = setTimeout(() => {
        console.log(`MockedWS: opening`)
        _ws.readyState = WebSocket.OPEN
        _onOpen()
        clearTimeout(timer)
    }, 100)
    return _ws
}
