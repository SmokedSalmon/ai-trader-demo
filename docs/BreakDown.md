
## Page Breakdown

### `main.tsx`
Entire Page Layout
- Sidebar
- className `"flex-1 flex flex-col min-w-0"`: Right main content

#### `main.tsx - renderMainContent()`
Right main content Layout  
tab Router for:  
/comprehensive, system-logs, prompt-management, signal-management, trader-management, hyperliquid, klines, premium-features)  
- className `flex-1 p-4 overflow-hidden flex`


### `components/Header.tsx`
Right Main content Header  
Logo, Ads, Login Button and testnet/mainnet switch


### `component/hyperliquid/HyperliquidView.tsx`
Dashboard page, main layout


### `components/hyperliquid/HyperliquidAssetChart.tsx`
Dashboard page, top left chart, chart layout  
time range selector  
Trade marker, tooltip  
Chart itself uses `recharts` components to render

#### `>renderTradeMarkers()`
trade markers


### `component/hyperliquid/HyperliquidMultiAccountSummary.tsx`
Dashboard page, bottom left account summary



### `components/portfolio/AlphaArenaFeed.tsx`
Dashboard page, right panel  
Selector for AI Trader, Traded Symbol/Instrument  
Tabs uses `components/ui/tabs.tsx`  
  - Tab List & Swithers uses the component's `TabList`, `TabTrigger`
  - Tab Content uses the component's `TabContent`  
    - Tab `trades` - COMPLETED TRADES
      Each trade is rendered as a single `<div>` card
    - Tab `model-chat` - MODELCHAT  
      Each item is a single AI decision, ui including: 
      - Details and account snapshot info upon that decision
      - An expend button
      - 3 separate prompts of that decisions:
        under element `className="space-y-2 pt-3"`
        - USER PROMPT
        - CHAIN OF THOUGHT
        - TRADING DECISIONS
      
    - Tab `positions` - POSITIONS  
      Snapshots of each AI Traders current holding Positions



## API Breakdown

### `/api/hyperliquid/accounts/[account_id]/balance`
Dashboard page, bottom left Account Status section data source

### `/api/arena/trades`
Loads trader/account, and all trades  
The account info (`account_id`) is crucial to align data of other APIs: 
- `asset-curve`
- `balance`

with params:
- `limit`: number
- `account_id`  
  When empty, it fetches all trades of all traders/accounts
- `trading_mode`: `testnet` or `mainnet`


### `/api/arena/model-chat`

with params:
- `limit`: number
- `account_id`  
  When empty, it fetches all decisions of all traders/accounts
- `trading_mode`: `testnet` or `mainnet`

### `/api/arena/positions`

with params:
- `account_id`  
  When empty, it fetches all positions of all traders/accounts
- `trading_mode`: `testnet` or `mainnet`


### `/api/hyperliquid/symbols/watchlist`
seems the symbol/instrument list source


### `/api/account/asset-curve`
data source of the chart

with params:
- `timeframe`: number
- `start_date`: date
- `end_date`: date
- `trading_mode`: `testnet` or `mainnet`
- `environment`: `testnet` or `mainnet`
- `account_id`  
  When empty, it fetches all chart data of all traders/accounts


### `/api/arena/model-chat/[id]/snapshots`
upon click to expend each AI Trader decision under `MODELCHAT` for the 1st time


### `/api/account/list`
account/trader list selector data source

### `/api/hyperliquid/trading-mode`


### `/api/users/exchange-config`


### `/auth-config.json`

### `/api/account/hyperliquid/check-mainnet-accounts`

