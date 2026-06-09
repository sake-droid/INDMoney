/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { formatIndianCurrency, projectNetWorth, NetWorthDataPoint } from "../utils/finance";

interface NetWorthGraphProps {
  currentAge: number;
  retirementAge: number;
  initialNetWorth: number;
  weightedGrowthRate: number;
}

export default function NetWorthGraph({
  currentAge,
  retirementAge,
  initialNetWorth,
  weightedGrowthRate,
}: NetWorthGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [selectedAge, setSelectedAge] = useState<number>(50);

  // Generate data points up to age 80
  const data: NetWorthDataPoint[] = projectNetWorth(
    currentAge,
    80,
    initialNetWorth,
    weightedGrowthRate
  );

  // Set up resize observer to keep SVG fully responsive
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height, 280),
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value to scale the Y axis
  const maxNominal = Math.max(...data.map((d) => d.nominalValue));

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    // Beautiful linear scaling for intuitive visual impact
    return paddingTop + chartHeight - ((value - 0) / (maxNominal - 0)) * chartHeight;
  };

  // Build SVG Path strings
  let nominalLinePath = "";
  let realLinePath = "";
  let nominalAreaPath = "";
  let realAreaPath = "";

  data.forEach((point, i) => {
    const x = getX(i);
    const yNominal = getY(point.nominalValue);
    const yReal = getY(point.realValue);

    if (i === 0) {
      nominalLinePath = `M ${x} ${yNominal}`;
      realLinePath = `M ${x} ${yReal}`;
      nominalAreaPath = `M ${x} ${paddingTop + chartHeight} L ${x} ${yNominal}`;
      realAreaPath = `M ${x} ${paddingTop + chartHeight} L ${x} ${yReal}`;
    } else {
      nominalLinePath += ` L ${x} ${yNominal}`;
      realLinePath += ` L ${x} ${yReal}`;
      nominalAreaPath += ` L ${x} ${yNominal}`;
      realAreaPath += ` L ${x} ${yReal}`;
    }

    if (i === data.length - 1) {
      nominalAreaPath += ` L ${x} ${paddingTop + chartHeight} Z`;
      realAreaPath += ` L ${x} ${paddingTop + chartHeight} Z`;
    }
  });

  // Handle mouse moves over chart to track closest index
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xMouse = e.clientX - rect.left - paddingLeft;
    const proportionalX = xMouse / chartWidth;
    let index = Math.round(proportionalX * (data.length - 1));
    index = Math.max(0, Math.min(data.length - 1, index));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Generate ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => {
    return (maxNominal / yTicks) * i;
  });

  const displayIndex = hoverIndex !== null ? hoverIndex : data.findIndex((d) => d.age === selectedAge);
  const activePoint = displayIndex !== -1 ? data[displayIndex] : data[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="text-slate-900 text-base sm:text-lg font-bold tracking-tight">
            Wealth Projection
          </h3>
          <div className="relative inline-block group mt-0.5 animate-pulse-subtle">
            <button 
              type="button"
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 focus:outline-none cursor-default"
              aria-label="Projection Info"
            >
              <Info className="w-4 h-4" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-semibold">
              Compounding projection based on current weighted yield of {weightedGrowthRate.toFixed(1)}% p.a.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1422e8] inline-block pointer-events-none"></span>
            <span className="text-slate-600">Nominal wealth</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0ea5e9] inline-block pointer-events-none"></span>
            <span className="text-slate-600">Real value (-6% inflation)</span>
          </div>
        </div>
      </div>

      {/* Target & Values Row - Single Horizontal Line */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 sm:py-2.5 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-4.5 shadow-3xs">
        {/* Interactive Age Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider select-none">Projection Target:</span>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg shadow-3xs px-2 py-0.5">
            <span className="text-slate-500 text-xs font-semibold select-none">Age</span>
            <input
              type="number"
              min={currentAge}
              max={80}
              value={selectedAge}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setSelectedAge(Math.max(currentAge, Math.min(80, val)));
                }
              }}
              className="w-8 bg-transparent text-slate-900 text-sm font-black text-center focus:outline-none select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans"
            />
            {/* Quick Increment/Decrement Buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => setSelectedAge((prev) => Math.min(80, prev + 1))}
                className="text-slate-400 hover:text-slate-705 p-0.5 h-3.5 w-4.5 flex items-center justify-center hover:bg-slate-100 rounded transition-all leading-none"
              >
                <span className="text-[10px] leading-none font-bold">▲</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAge((prev) => Math.max(currentAge, prev - 1))}
                className="text-slate-400 hover:text-slate-705 p-0.5 h-3.5 w-4.5 flex items-center justify-center hover:bg-slate-100 rounded transition-all leading-none"
              >
                <span className="text-[10px] leading-none font-bold">▼</span>
              </button>
            </div>
          </div>
          <span className="text-brand text-xs font-extrabold font-mono">({activePoint.year})</span>
        </div>

        {/* Wealth Value readouts in the same row */}
        <div className="flex flex-row flex-wrap items-center gap-4 sm:gap-6 justify-end">
          {/* Nominal Wealth */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider select-none">Nominal Wealth</span>
            <span className="text-brand text-base sm:text-lg font-black font-sans leading-none bg-brand-light/30 px-2.5 py-1.5 rounded-lg border border-brand/5 shadow-3xs">
              {formatIndianCurrency(activePoint.nominalValue)}
            </span>
          </div>

          {/* Separator */}
          <span className="hidden sm:inline text-slate-205 text-slate-200">|</span>

          {/* Real Value */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider select-none">Real Buying Value</span>
            <span className="text-sky-700 text-base sm:text-lg font-black font-sans leading-none bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100 shadow-3xs">
              {formatIndianCurrency(activePoint.realValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Render interactive graph */}
      <div 
        ref={containerRef} 
        className="w-full h-72 sm:h-80 relative select-none"
      >
        <svg
          width={width}
          height={height}
          className="overflow-visible cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            if (!containerRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const xMouse = e.clientX - rect.left - paddingLeft;
            const proportionalX = xMouse / chartWidth;
            let index = Math.round(proportionalX * (data.length - 1));
            index = Math.max(0, Math.min(data.length - 1, index));
            const point = data[index];
            if (point) {
              setSelectedAge(point.age);
            }
          }}
          id="growth-projection-svg"
        >
          <defs>
            <linearGradient id="nominalGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1422e8" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1422e8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="realGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {yTickValues.map((val, i) => {
            const y = getY(val);
            return (
              <g key={`y-grid-${i}`} className="opacity-70">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  className="pointer-events-none"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize={10}
                  textAnchor="end"
                  fontFamily="monospace"
                  className="pointer-events-none font-bold"
                >
                  {formatIndianCurrency(val, true)}
                </text>
              </g>
            );
          })}

          {/* Vertical grid & ticks */}
          {data.map((point, idx) => {
            const showTick = point.age === currentAge || point.age === retirementAge || point.age % 10 === 0 || point.age === 80;
            if (!showTick) return null;
            
            const x = getX(idx);
            return (
              <g key={`x-grid-${idx}`}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={height - paddingBottom}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  className="opacity-50 pointer-events-none"
                />
                <text
                  x={x}
                  y={height - paddingBottom + 16}
                  fill={point.age === retirementAge ? "#1422e8" : "#94a3b8"}
                  fontSize={10}
                  textAnchor="middle"
                  className="pointer-events-none font-bold"
                >
                  {point.age === currentAge ? `Age 25` : `Age ${point.age}`}
                </text>
              </g>
            );
          })}

          {/* Fills underneath */}
          {nominalAreaPath && (
            <path
              d={nominalAreaPath}
              fill="url(#nominalGlow)"
              className="pointer-events-none"
            />
          )}
          {realAreaPath && (
            <path
              d={realAreaPath}
              fill="url(#realGlow)"
              className="pointer-events-none"
            />
          )}

          {/* Drawing Lines */}
          {realLinePath && (
            <path
              d={realLinePath}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={2}
              strokeDasharray="2 2"
              className="pointer-events-none"
            />
          )}
          {nominalLinePath && (
            <path
              d={nominalLinePath}
              fill="none"
              stroke="#1422e8"
              strokeWidth={3}
              className="pointer-events-none"
            />
          )}

          {/* Vertical Tracker indicator on hover/focus */}
          {activePoint && (
            <g className="pointer-events-none">
              <line
                x1={getX(displayIndex)}
                y1={paddingTop}
                x2={getX(displayIndex)}
                y2={height - paddingBottom}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              
              {/* Nominal Point Circle */}
              <circle
                cx={getX(displayIndex)}
                cy={getY(activePoint.nominalValue)}
                r={6}
                fill="#1422e8"
                stroke="#ffffff"
                strokeWidth={2.5}
              />
              
              {/* Real Point Circle */}
              <circle
                cx={getX(displayIndex)}
                cy={getY(activePoint.realValue)}
                r={5}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={2}
              />
              
              {/* Retirement highlight if active is retirement age */}
              {activePoint.age === retirementAge && (
                <g>
                  <rect
                    x={getX(displayIndex) - 45}
                    y={paddingTop + 5}
                    width={90}
                    height={20}
                    rx={4}
                    fill="#eef1ff"
                    stroke="#1422e8"
                    strokeWidth={1}
                  />
                  <text
                    x={getX(displayIndex)}
                    y={paddingTop + 18}
                    fill="#1422e8"
                    fontSize={9}
                    fontWeight="extrabold"
                    textAnchor="middle"
                  >
                    Retirement age
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
