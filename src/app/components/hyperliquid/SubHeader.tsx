'use client'
import { useEffect, useState, memo } from 'react';
import Image, { ImageProps } from 'next/image';
import NumberFlow from '@number-flow/react'
import { getSymbolLogo } from '../portfolio/logoAssets'
import SymbolIcon from '../ui/SymbolIcon';

interface SymbolInfo {
  symbol: string,
  price: number,
  timestamp: number
}
interface ParsedPrice {
  prices: { [key: string]: SymbolInfo }
}
interface ParsedSymbolItem {
  name: string,
  price: number,
  icon: string,
  change?: number,
  untouched?: boolean,
}

// Please refer to watchlist.json, but the display order is determined here
const SYMBOL_LIST: Array<string> = ['TSLA', 'NVDA', 'BTC', 'ETH', 'MSFT', 'AMZN', 'GOOGL', 'NDX', 'PLTR', 'DOGE', 'SOL', 'BNB', 'XRP']
Object.freeze(SYMBOL_LIST)
const SYMBOL_LIST_2X = [...SYMBOL_LIST, ...SYMBOL_LIST]

const parsePriceData = (apiRes: ParsedPrice) => {
  const parsed: Record<string, ParsedSymbolItem> = {}
  for (const key of SYMBOL_LIST) {
    const symbolDef = getSymbolLogo(key)
    parsed[key] = { name: symbolDef.alt, icon: symbolDef.src, price: NaN, untouched: true }
  }
  
  try {
    const rawPrices = apiRes.prices
    for (const key of SYMBOL_LIST) {
      if (!rawPrices[key] || !parsed[key].untouched) continue
      parsed[key].price = rawPrices[key].price
      delete parsed[key].untouched
    }
    // special, 'XYZ100' in API is for 'NDX'
    if (rawPrices.XYZ100 && parsed.NDX?.untouched) {
      parsed.NDX.price = rawPrices.XYZ100.price
      delete parsed.NDX.untouched
    }
  } catch (e) {
  } finally {
    return parsed
  }
}

const SymbolIcon2 = memo(function SymbolIcon({ src, alt, width = 12, height = 12, className }: ImageProps) {
  return <Image
    src={src} 
    alt={alt} 
    className={className}
    width={width}
    height={height}
    onError={(e) => {
      // Fallback to a default icon if the specific one fails to load
      const target = e.target as HTMLImageElement;
      target.onerror = null;
      target.src = getSymbolLogo('DEFAULT').src;
    }}
  />
}, (prevProps, newProps) => prevProps.src === newProps.src)

function Ticker({ symbol, data }: { symbol: string, data: ParsedSymbolItem }) {
  const [priceMemo, setPriceMemo] = useState<{ prev: number, color: string }>({ prev: data.price, color: '' })
  let _timeout

  if (data.price !== priceMemo.prev) {
    clearTimeout(_timeout)
    if (data.price < priceMemo.prev) {
      setPriceMemo({ prev: data.price, color: 'animate-price-down-blink' })
    } else {
      setPriceMemo({ prev: data.price, color: 'animate-price-up-blink' })
    }
    _timeout = setTimeout(() => {
      setPriceMemo((laterPriceMemo) => ({ ...laterPriceMemo, color: '' }))
    }, 1000)
  }

  return (
    <div className={`flex flex-col items-center px-4 py-1 text-xs ${priceMemo.color}`}>
      <div className="flex items-center space-x-1 mb-1">
        {data.icon && (
          <SymbolIcon symbol={symbol} alt={data.name} className="size-4" />
        )}
        <span className="text-sm text-gray-700 font-medium">{symbol}</span>
      </div>
      <div className="font-mono text-gray-800 text-sm font-semibold flex items-baseline">
        <NumberFlow
          value={data.price}
          format={{ style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', trailingZeroDisplay: 'stripIfInteger' }}
          trend={0}
        />
      </div>
      {data.change !== undefined && (
        <div className={`text-xs ${data.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {data.change >= 0 ? '↑' : '↓'} {Math.abs(data.change).toFixed(2)}%
        </div>
      )}
    </div>
  )
}

export default function SubHeader() {
  const [marketData, setMarketData] = useState<Record<string, ParsedSymbolItem>>({} as (Record<string, ParsedSymbolItem>));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      let data
      try {
        setLoading(true);
        const res = await fetch('/api/crypto-prices');
        // console.log('Prices fetched')
        data = parsePriceData(await res.json())
        // console.log(res.ok ? data : `${res.status}: ${res.statusText}`)

        setMarketData(data)
        setError(null);
      } catch (err) {
        console.error("Failed to fetch market data:", err);
        // Use mock data when API call fails
        setMarketData({});
        setError('Warning: Failed to load real-time data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // Set up polling to refresh data every 5 seconds
    const interval = setInterval(fetchMarketData, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // if (loading) {
  //   return (
  //     <div className="hidden border-b-1 border-border bg-surface-elevated px-4 py-1 md:block">
  //       <div className="terminal-text flex items-center justify-between text-xs">
  //         <div className="flex items-center">
  //           <div className="flex items-center">
  //             <div className="flex items-center px-6 py-0.5">
  //               <span className="text-gray-700 font-medium">Loading market data...</span>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  // console.log(`SubHeader renders, Tesla: ${marketData.TSLA}`)

  return (
    <div className="flex-0 flex flex-col xl:flow-row">
      <div className="border-b-1 border-border bg-surface-elevated">
      <div className="terminal-text flex items-center justify-between text-xs">
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-400 text-yellow-700 px-4 py-1 text-xs z-10">
            <p className="font-bold">Warning</p>
            <p>{error}</p>
          </div>
        )}
        <div className="flex items-center animate-ticker-roller">
          {/* Repeat the List again for a infinite rolling animation */}
          {SYMBOL_LIST_2X.map((key, index) => marketData[key] && (
            <div key={`${index}-${key}`} className="flex items-center min-w-20 relative">
              <Ticker symbol={key} data={marketData[key]} />
              {index < SYMBOL_LIST_2X.length - 1 && (
                <div className="w-px h-8 bg-gray-300 absolute right-0"></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xl font-thin text-foreground-subtle">|</span>
        </div>
      </div>
      </div>
        
    </div>
  )
}