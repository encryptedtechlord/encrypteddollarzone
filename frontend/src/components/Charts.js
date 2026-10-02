import React, { useState, useEffect } from 'react';
import TradingViewChart from './TradingViewChart';

const SYMBOLS = [
  { label: 'Volatility 10',       tv: 'DERIV:VOLATILITY_10_INDEX' },
  { label: 'Volatility 10 (1s)',  tv: 'DERIV:VOLATILITY_10_1S_INDEX' },
  { label: 'Volatility 25',       tv: 'DERIV:VOLATILITY_25_INDEX' },
  { label: 'Volatility 25 (1s)',  tv: 'DERIV:VOLATILITY_25_1S_INDEX' },
  { label: 'Volatility 50',       tv: 'DERIV:VOLATILITY_50_INDEX' },
  { label: 'Volatility 50 (1s)',  tv: 'DERIV:VOLATILITY_50_1S_INDEX' },
  { label: 'Volatility 75',       tv: 'DERIV:VOLATILITY_75_INDEX' },
  { label: 'Volatility 75 (1s)',  tv: 'DERIV:VOLATILITY_75_1S_INDEX' },
  { label: 'Volatility 100',      tv: 'DERIV:VOLATILITY_100_INDEX' },
  { label: 'Volatility 100 (1s)', tv: 'DERIV:VOLATILITY_100_1S_INDEX' },
  { label: 'Boom 500',            tv: 'DERIV:BOOM_500_INDEX' },
  { label: 'Boom 1000',           tv: 'DERIV:BOOM_1000_INDEX' },
  { label: 'Crash 500',           tv: 'DERIV:CRASH_500_INDEX' },
  { label: 'Crash 1000',          tv: 'DERIV:CRASH_1000_INDEX' },
  { label: 'Step Index',          tv: 'DERIV:STEP_INDEX' },
  { label: 'Range Break 100',     tv: 'DERIV:RANGE_BREAK_100_INDEX' },
  { label: 'Range Break 200',     tv: 'DERIV:RANGE_BREAK_200_INDEX' },
  { label: 'Jump 10',             tv: 'DERIV:JD10_INDEX' },
  { label: 'Jump 25',             tv: 'DERIV:JD25_INDEX' },
  { label: 'Jump 50',             tv: 'DERIV:JD50_INDEX' },
  { label: 'Jump 75',             tv: 'DERIV:JD75_INDEX' },
  { label: 'Jump 100',            tv: 'DERIV:JD100_INDEX' }
];

export default function Charts() {
  const [active, setActive] = useState(SYMBOLS[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className={`charts-page ${isFullscreen ? 'fs-mode' : ''}`}>
      <div className="charts-toolbar">
        <div className="symbol-tabs">
          {SYMBOLS.map((s) => (
            <button
              key={s.tv}
              onClick={() => setActive(s)}
              className={`symbol-tab ${active.tv === s.tv ? 'active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
        </button>
      </div>

      <div className="chart-wrapper">
        <TradingViewChart symbol={active.tv} />
      </div>

      <div className="chart-footer">
        <span>Showing: <strong>{active.label}</strong></span>
        <span className="chart-disclaimer">
          Charts by TradingView · This platform does not execute trades or handle funds.
        </span>
      </div>
    </div>
  );
}