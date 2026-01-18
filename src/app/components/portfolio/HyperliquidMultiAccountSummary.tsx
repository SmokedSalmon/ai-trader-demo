'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import NumberFlow from '@number-flow/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle } from 'lucide-react'
import { getHyperliquidBalance } from '@/lib/hyperliquidApi'
import Image from 'next/image'
import { getModelLogo } from './logoAssets'
import type { HyperliquidEnvironment } from '@/lib/types/hyperliquid'
import type { HyperliquidBalance } from '@/lib/types/hyperliquid'
import { useTradingMode } from '@/contexts/TradingModeContext'
import { formatDateTime } from '@/lib/dateTime'

interface AccountBalance {
  accountId: number
  accountName: string
  balance: HyperliquidBalance | null
  error: string | null
  loading: boolean
}

interface HyperliquidMultiAccountSummaryProps {
  accounts: Array<{ account_id: number; account_name: string }>
  refreshKey?: number
  selectedAccount?: number | 'all'
}

const getMarginStatus = (percent: number) => {
  if (percent < 50) {
    return {
      color: 'bg-green-500',
      text: 'Healthy',
      icon: TrendingUp,
      textColor: 'text-green-600',
      dotColor: 'bg-green-500',
    } as const
  }
  if (percent < 75) {
    return {
      color: 'bg-yellow-500',
      text: 'Moderate',
      icon: AlertTriangle,
      textColor: 'text-yellow-600',
      dotColor: 'bg-yellow-500',
    } as const
  }
  return {
    color: 'bg-red-500',
    text: 'High Risk',
    icon: AlertTriangle,
    textColor: 'text-red-600',
    dotColor: 'bg-red-500',
  } as const
}

export default function HyperliquidMultiAccountSummary({
  accounts,
  refreshKey,
  selectedAccount = 'all',
}: HyperliquidMultiAccountSummaryProps) {
  const { tradingMode } = useTradingMode()
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([])
  const [globalLastUpdate, setGlobalLastUpdate] = useState<string | null>(null)

  // Filter accounts based on selectedAccount - memoized to prevent infinite loops
  const filteredAccounts = useMemo(() => {
    return selectedAccount === 'all'
      ? accounts
      : accounts.filter(acc => acc.account_id === selectedAccount)
  }, [accounts, selectedAccount])

  // Load all account balances in parallel - memoized to prevent infinite loops
  const loadAllBalances = useCallback(async () => {
    const results = await Promise.allSettled(
      filteredAccounts.map(async (acc) => {
        try {
          const balance = await getHyperliquidBalance(acc.account_id)
          return {
            accountId: acc.account_id,
            accountName: acc.account_name,
            balance,
            error: null,
            loading: false,
          }
        } catch (error: any) {
          console.error(`Failed to load balance for account ${acc.account_id}:`, error)
          return {
            accountId: acc.account_id,
            accountName: acc.account_name,
            balance: null,
            error: error.message || 'Failed to load',
            loading: false,
          }
        }
      })
    )

    const newBalances: AccountBalance[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          accountId: filteredAccounts[index].account_id,
          accountName: filteredAccounts[index].account_name,
          balance: null,
          error: 'Failed to load',
          loading: false,
        }
      }
    })

    setAccountBalances(newBalances)

    // Find the most recent update timestamp across all accounts
    const latestUpdate = newBalances
      .map((acc) => acc.balance?.lastUpdated)
      .filter((ts): ts is string => ts !== undefined)
      .sort()
      .reverse()[0]

    if (latestUpdate) {
      setGlobalLastUpdate(formatDateTime(latestUpdate))
    }
  }, [filteredAccounts])

  useEffect(() => {
    if (filteredAccounts.length === 0) {
      setAccountBalances([])
      return
    }

    // Only initialize with loading state on first load (when accountBalances is empty)
    const isFirstLoad = accountBalances.length === 0
    if (isFirstLoad) {
      setAccountBalances(
        filteredAccounts.map((acc) => ({
          accountId: acc.account_id,
          accountName: acc.account_name,
          balance: null,
          error: null,
          loading: true,
        }))
      )
    }

    loadAllBalances()
  }, [filteredAccounts, tradingMode, refreshKey])

  if (tradingMode !== 'testnet' && tradingMode !== 'mainnet') {
    return null
  }

  if (filteredAccounts.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">
          No Hyperliquid accounts configured
        </div>
      </Card>
    )
  }

  const environment: HyperliquidEnvironment =
    tradingMode === 'testnet' || tradingMode === 'mainnet' ? tradingMode : 'testnet'

  const isLoading = accountBalances.some((acc) => acc.loading)

  // Dynamic grid columns based on number of accounts
  const accountCount = accountBalances.length
  const gridColsClass = accountCount === 1
    ? 'grid-cols-1'
    : accountCount === 2
    ? 'grid-cols-1 md:grid-cols-2'
    : accountCount === 3
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'

  return (
    <div className="space-y-1 h-8 overflow-visible relative">
      {/* Header */}
      

      {/* Loading state */}
      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading account data...</div>
      )}

      {/* Account cards grid */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {accountBalances.map((account) => {
          const logo = getModelLogo(account.accountName)
          const marginStatus = account.balance
            ? getMarginStatus(account.balance.marginUsagePercent)
            : null
          const StatusIcon = marginStatus?.icon

          return (
            <Card
              key={account.accountId}
              className="border-0 shadow-none space-y-2"
            >
              {/* Account header with logo */}
              <div className="flex justify-between items-center pb-1 border-b-1 border-border">
                <div className="flex items-center gap-2 pe-4 border-e-1 border-border md:ps-4">
                  {logo && (
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      className="h-6 w-6 rounded-full object-contain"
                    />
                  )}
                  <span className="font-semibold text-sm truncate">
                    {account.accountName}
                  </span>
                </div>

                {/* Update Timestamp */}
                {globalLastUpdate && (
                  <div className="truncate flex-1 px-3 text-xs text-muted-foreground">
                    Last update: {globalLastUpdate}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {/* <h2 className="text-lg font-semibold">Hyperliquid Account Status</h2> */}
                  <Badge
                    variant={environment === 'testnet' ? 'secondary' : 'destructive'}
                    className="rounded-none uppercase text-[.6rem] text-gray-400 px-2 bg-gray-200"
                  >
                    {environment}
                  </Badge>
                </div>
              </div>

              {/* Error state */}
              {account.error && (
                <div className="text-xs text-red-600">{account.error}</div>
              )}

              {/* Balance data */}
              {account.balance && (
                <div className="flex justify-between items-center text-center cxs:text-start">
                  {/* Total Equity */}
                  <div className="flex-1 basis-1/2">
                    <div className="text-xs text-muted-foreground text-start px-2 cxs:px-4">Total Equity</div>
                    <div className="text-xl font-bold text-start px-2 cxs:px-4 md:text-lg">
                      {/* ${account.balance.totalEquity.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} */}
                      <NumberFlow
                        value={account.balance.totalEquity}
                        format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }}
                        trend={0}
                      />
                    </div>
                  </div>

                  {/* Used Margin */}
                  <div className="flex-1 basis-1/4">
                    <div className="text-xs text-muted-foreground text-start px-2 cxs:px-4">Used Margin</div>
                    <div className="text-sm font-medium text-start px-2 cxs:px-4">
                      {/* ${account.balance.usedMargin.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} */}
                      <NumberFlow
                        value={account.balance.usedMargin}
                        format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }}
                        trend={0}
                      />
                    </div>
                  </div>

                  {/* Margin Usage */}
                  <div className="flex-1 basis-1/4">
                    <div className="text-xs text-muted-foreground text-start px-2 cxs:px-4">Margin Usage</div>
                    <div className="flex justify-start items-center gap-2 px-2 cxs:px-4">
                      {/* <span className="text-sm font-medium">
                        {account.balance.marginUsagePercent.toFixed(1)}%
                      </span> */}
                      <NumberFlow
                        className="text-sm font-medium"
                        value={account.balance.marginUsagePercent / 100}
                        format={{ style: 'percent', maximumFractionDigits: 1 }}
                        trend={0}
                      />
                      {marginStatus && StatusIcon && (
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${marginStatus.dotColor}`}
                          ></span>
                          <span className={`text-xs ${marginStatus.textColor}`}>
                            {marginStatus.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Wallet Address */}
                  {/* Hide for MVP Demo v1 */}
                  {/* {account.balance.walletAddress && (
                    <div>
                      <div className="text-xs text-muted-foreground">Wallet</div>
                      <div className="text-xs font-mono truncate">
                        {account.balance.walletAddress.slice(0, 6)}...
                        {account.balance.walletAddress.slice(-4)}
                      </div>
                    </div>
                  )} */}
                </div>
              )}

              {/* Loading state for individual card */}
              {account.loading && (
                <div className="text-xs text-muted-foreground">Loading...</div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}