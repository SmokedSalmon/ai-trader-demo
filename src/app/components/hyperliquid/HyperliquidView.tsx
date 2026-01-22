/**
 * HyperliquidView - Hyperliquid Trading Mode Main View
 *
 * ARCHITECTURE:
 * - This component is the ACTIVE container for Hyperliquid mode (testnet/mainnet)
 * - Uses HyperliquidAssetChart for asset curve visualization with multi-account support
 * - Uses HyperliquidMultiAccountSummary for multi-account summary display
 * - Uses AlphaArenaFeed for real-time trading feed
 *
 * DO NOT CONFUSE WITH:
 * - ComprehensiveView: Legacy paper trading component (deprecated, kept for reference)
 * - AssetCurveWithData: Paper mode chart component (NOT used here)
 *
 * CURRENT STATUS: Active production component for multi-wallet Hyperliquid architecture
 */
'use client'
import React, { useState, useEffect } from 'react'
import _throttle from 'lodash/throttle'
import { useTradingMode } from '@/contexts/TradingModeContext'
import { getArenaPositions, getArenaTrades, ArenaTrade } from '@/lib/api'
import AlphaArenaFeed from '@/components/portfolio/AlphaArenaFeed'
import HyperliquidMultiAccountSummary from '@/components/portfolio/HyperliquidMultiAccountSummary'
import HyperliquidAssetChart, { TradeMarker } from './HyperliquidAssetChart'

interface HyperliquidViewProps {
  wsRef?: React.MutableRefObject<WebSocket | null>
  refreshKey?: number
}

export default function HyperliquidView({ wsRef, refreshKey = 0 }: HyperliquidViewProps) {
  const { tradingMode } = useTradingMode()
  const [loading, setLoading] = useState(true)
  const [positionsData, setPositionsData] = useState<any>(null)
  const [chartRefreshKey, setChartRefreshKey] = useState(0)
  const [selectedAccount, setSelectedAccount] = useState<number | 'all'>('all')
  const [tradeMarkers, setTradeMarkers] = useState<TradeMarker[]>([])
  const environment = tradingMode === 'testnet' || tradingMode === 'mainnet' ? tradingMode : undefined
  
  const [chartOnTop, setChartOnTop] = useState<boolean>(window.innerWidth > 768)
  useEffect(() => {
    const handleResize = _throttle(() => setChartOnTop(window.innerWidth > 768), 100)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load data from APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [positions, tradesRes] = await Promise.all([
          getArenaPositions({ trading_mode: tradingMode }),
          getArenaTrades({ trading_mode: tradingMode, limit: 200 })
        ])
        setPositionsData(positions)
        // Convert trades to TradeMarker format
        const markers: TradeMarker[] = (tradesRes.trades || []).map((t: ArenaTrade) => ({
          trade_id: t.trade_id,
          trade_time: t.trade_time || '',
          side: t.side,
          symbol: t.symbol,
          account_id: t.account_id,
          price: t.price
        }))
        setTradeMarkers(markers)
      } catch (error) {
        console.error('Failed to load Hyperliquid data:', error)
      } finally {
        setChartRefreshKey(prev => prev + 1)
        setLoading(false)
      }
    }

    loadData()
  }, [tradingMode, refreshKey])

  // Extract account list for multi-account summary
  const accounts = positionsData?.accounts?.map((acc: any) => ({
    account_id: acc.account_id,
    account_name: acc.account_name,
  })) || []

  const firstAccountId = accounts[0]?.account_id

  if (loading && !positionsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading account data...</div>
      </div>
    )
  }

  return (
    <div className="md:grid md:grid-cols-5 flex flex-col h-full min-h-0 relative">
      {/* Panel 1 - Large Screen, Chart & Account Summary, as Left Panel; Narrow Screen, Chart Only, as Top Panel */}
      <div className={`md:col-span-3 flex-[1_0_50%] flex flex-col border-r md:min-h-0 z-${chartOnTop ? 10 : 1}`}>
        <div className="flex-1">
          {positionsData?.accounts?.length > 0 ? (
            <HyperliquidAssetChart
              accountId={firstAccountId}
              refreshTrigger={chartRefreshKey}
              environment={environment}
              selectedAccount={selectedAccount}
              trades={tradeMarkers}
            />
          ) : (
            <div className="bg-card border border-border rounded-lg h-full flex items-center justify-center">
              <div className="text-muted-foreground">No account configured</div>
            </div>
          )}
        </div>
        {/* <div className="border-0 basis-28 text-card-foreground p-2 md:basis-24"> */}
        {/* Account Summary is on the Left Panel for large screen */}
        <div className="hidden md:block border-0 border-t-1 text-card-foreground p-2 md:basis-24">
          <HyperliquidMultiAccountSummary
            accounts={accounts}
            refreshKey={refreshKey + chartRefreshKey}
            selectedAccount={selectedAccount}
          />
        </div>
      </div>

      {/* Panel 2 - Large Screen: Feed only, as Right Panel; Narrow Screen: Feed + Account Summary, as bottom Panel */}
      <div className="md:col-span-2 flex-[0_0] basis-54 flex flex-col min-h-0 z-5">
        <div className="flex-0 md:flex-1 basis-12 min-h-0 rounded-lg bg-card shadow-sm flex flex-col z-10">
          <AlphaArenaFeed
            wsRef={wsRef}
            selectedAccount={selectedAccount}
            onSelectedAccountChange={setSelectedAccount}
          />
        </div>
        {/* Account Summary sits in the Bottom Panel for narrow screen */}
        <div className="md:hidden flex-1 basis-42 border-0 border-t-1 text-card-foreground p-2 md:basis-24 z-1">
          <HyperliquidMultiAccountSummary
            accounts={accounts}
            refreshKey={refreshKey + chartRefreshKey}
            selectedAccount={selectedAccount}
          />
        </div>
      </div>
    </div>
  )
}
