# About AI LLM Trading MVP

## Overview
Later version should provide


## Visual
- Adds a `<SubHeader/` and the Tick Bar in it
- Hide `Hyper Alpha Arena` elements
- Adjust looks close to **nof1.ai** at the end of Oct, 2025  
  Archived snapshot [here](https://web.archive.org/web/20251021150432/https://nof1.ai/)  
  It has mobile view with `Model Chat`, `Complete Trades` & `Position` tabs
- More Symbol Logos
- `NumberFlow` Component for the quotes
- 

## Modifications

### Migrated to Next.js For SSR Transition
Steps including:
- Copied the [frontend/](https://github.com/HammerGPT/Hyper-Alpha-Arena/tree/main/frontend) section to a new next.js app:  
  - Transit from React Router to  **Next.js'** file-system based Router   
  - Serve Static Files and API Endpoints from **Vite** -> **Next.js**
  > [commit](https://github.com/SmokedSalmon/ai-trader-demo/commit/98f204e55194e23be831d7df7e2babd276b6c3fc#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519)

- use Next.js' static cache to replace Vite's `inline image` (base64)
  > [commit](https://github.com/SmokedSalmon/ai-trader-demo/commit/1cf9aeb6d840f7885399abce4beb8c2abc514336), [Official Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- upgrade `tailwindcss` to v4
  > [commit](https://github.com/SmokedSalmon/ai-trader-demo/commit/9e209a5579788d66d6ba30170088d9beceebde44)
- get a lot familiarized of `tailwindcss`  
  [@theme & @layer directives](https://share.google/aimode/fWb28i2FLJTWPjax5)  
  Now I am quite enjoy using `tailwindcss` to style as its quick prototyping and no efforts needed  on css selectors
- Proxied API
  Use a proxy layer (serverless functions) to:
  - bypass `cors`
  - hide the real data source and 
  - hide the use of mocked ones
- API Cache Features  
  Since the app employs polling on critical data, cache feature is used to prevent excessive polling from concurrent queries  
  see [cachedFetch.ts](/src/app/lib/cachedFetch.ts)
- Markdown Render for the User Prompt and other section of the Model-chat snapshot
- Responsive design for Narrow Screen, mirroring the early season 1 version of **nor1.ai**


## Data Source
4 Critical data endpoints port [Live Streaming APIs](#real-market-data) from **rockflow.ai** (The **Classic** Campaign), others use [lock mocks](#local-mocks), masked by serverless APIs that serve json files  

Fallback with local mocks are provided in case of API failure or campaign expiration  
> Snapshot & mock updates: [Real Data Snapshot as Fallback](#real-data-snapshot-as-fallback)

Why not **nor1.ai** live data? - They stop streaming new data since 2025-12-06 after both seasons concluded, their APIs are now serving ONLY locked and outdated data till that day

### Real Market Data
- **Account balance** - `/api/balance` - rockflow.ai's [/assets](https://api.rockflow.ai/social/api/arenas/classic/campaign/assets)  
  see [.../balance/route.ts](/src/app/api/hyperliquid/accounts/1/balance/route.ts)
- **Chart data** - rockflow.ai's [/assets/chart](https://api.rockflow.ai/social/api/arenas/classic/campaign/assets/chart)  
  see [.../asset-curve/route.ts](/src/app/api/account/asset-curve/route.ts)
- **Trades** - rockflow.ai's [/trades](https://api.rockflow.ai/social/api/arenas/classic/trades)  
  see [.../trades/route.ts](/src/app/api/arena/trades/route.ts)
- **Positions** - rockflow.ai's [/assets]() + [/positions](https://api.rockflow.ai/social/api/arenas/classic/campaign/positions)  
  see [.../positions/route.ts](/src/app/api/arena/positions/route.ts)
- **Live Crypto & Stock Quoting** - `yahoo-finance2`  
  see [.../crypto-prices/route.ts](/src/app/api/crypto-prices/route.ts)  
  > It implements Caching as `yahoo-finance2` puts a heave limits on it
  >
  > Reason NOT using many quoting services? - They DO NOT offer **batch quoting** at free tier
- **AI Decision Histories** (drafted):  
  due to the lack of live data of `/model-chat` & `/[id]/snapshot`, they use local mocks now  
  > Although **rockflow.ai** provides a [/chats](https://api.rockflow.ai/social/api/arenas/classic/chats) API for AI decisions but it lacks **User Prompt** and lacks details of **COT**, only sufficient for decision summary
  >
  > A draft implementation to port [/chats](...) is provided in [.../model-chat/route.ts](/src/app/api/arena/model-chat/route.ts) (commented out) for future reference

#### Real Data Snapshot as Fallback
Checkout and run `/scripts/snapshot-xxx.mjs` to pull and snapshot above API data at real time, output is under [/.snapshots](/.snapshots) (excluded from git)  

Then, move to into the correspondent folder under [/mock/](/mock/)

### Local Mocks
- `/model-chat` - list of all AI Decisions  
  see [.../model-chat/route.ts](/src/app/api/arena/model-chat/route.ts)
- `[id]/snapshots` - Snapshot of a single Decision entry, including User Prompt, COT & Decision output  
  see [.../model-chat/[id]/snapshots/route.ts](/src/app/api/arena/model-chat/[id]/snapshots/route.ts)
> Both `/model-chat` & `snapshots` are generated from the archived version of **nor1.ai** `/conversations` api on 2025-12-31, as **nor1.ai** concluded seasons and joined the 2 APIs into a single one for display  
> archived under [mock/nor1.ai-archived...](/mock/nor1.ai-archived-2025-12-31/), converted using

If you manage to get a fresh `/conversations` data, or live `/model-chat` & `/[id]/snapshots` data upon new season, checkout `/scripts/conversations-to-model-chat-and-snapshots.mjs` for conversion

Please refer to [mjs-script.debug.md](mjs-script.debug.md)

#### Altered Timestamp of Mocks
As the `/conversations` freeze around 2025-12, the generated lock mocks align with it  
The API layer modified the date, see [.../model-chat/route.ts](/src/app/api/arena/model-chat/route.ts) & [.../model-chat/[id]/snapshots/route.ts](/src/app/api/arena/model-chat/[id]/snapshots/route.ts)


### API Breakdown & Analysis on Original Projects
- mock API call using file-system based router and non-page entry at `api/**/route.ts`  
  > Details on original APIs see [nor1.ai Breakdown](nor1.ai-breakdown.md) & [Hyper Arena Project Breakdown](origin-project-breakdown-hyper-alpha-arena.md)
- *mock websocket connection*  
  > It is mocked but not in-use, replaced by API polling  
  > the origin project abandoned it?
  > [commit](https://github.com/SmokedSalmon/ai-trader-demo/commit/3ce2843faeff4c83e2ab952b8176a84ee6048dde#diff-7d1e5958276f6080248e46474665c5e6cf38f8423b3739da15712d86eac21439)
