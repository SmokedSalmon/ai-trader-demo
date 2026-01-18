/**
 * Trading Mode Switcher Component
 * Allows users to switch between Testnet and Mainnet
 */
'use client'

import { useTradingMode, TradingMode } from '@/contexts/TradingModeContext';

export default function TradingModeSwitcher() {
  const { tradingMode, setTradingMode } = useTradingMode();

  const modes: { value: TradingMode; label: string; subtitle: string; color: string }[] = [
    {
      value: 'testnet',
      // label: 'Testnet',
      // subtitle: 'Test Money',
      label: 'Testnet',
      subtitle: 'Paper Trade',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      value: 'mainnet',
      label: 'Mainnet 🚧',
      // subtitle: 'Real Money ⚠️',
      subtitle: 'Real Money ',
      color: 'bg-red-500 hover:bg-red-600',
    },
  ];

  const handleModeClick = (mode: TradingMode) => {
    console.log('[TradingModeSwitcher] Button clicked, target mode:', mode);
    console.log('[TradingModeSwitcher] Current tradingMode:', tradingMode);
    try {
      // hide for MVP Demo v1
      // setTradingMode(mode);
      console.log('[TradingModeSwitcher] setTradingMode called successfully');
    } catch (error) {
      console.error('[TradingModeSwitcher] Error calling setTradingMode:', error);
    }
  };

  return (
    <div className="flex items-center space-x-1 md:space-x-2">
      <span className="text-[.6rem] font-medium text-gray-600 md:text-xs">Mode:</span>
      <div className="inline-flex rounded-md bg-white md:p-0.5">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => handleModeClick(mode.value)}
            className={`
              px-2 py-1 rounded border border-gray-300 text-[.6rem] font-medium transition-all md:text-xs md:px-3 md:py-1.5 data-coming:scale-[80%] data-coming:last:-translate-x-12 z-10 data-coming:z-5 hover:z-15 data-coming:hover:z-15 active:z-15 data-coming:active:z-15
              ${
                tradingMode === mode.value
                  ? `${mode.color} text-white shadow-sm`
                  : 'text-gray-700 bg-background hover:bg-gray-100 cursor-not-allowed'
              }
            `}
            data-coming={mode.value === 'mainnet' ? '' : undefined}
          >
            <div className="flex flex-col items-center">
              <span className="truncate">{mode.label}</span>
              <span className="truncate text-[.5rem] opacity-80 whitespace-nowrap md:text-[.6rem]">{mode.subtitle}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
