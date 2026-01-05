import { useState } from "react";

interface ChartData {
  label: string;
  val1: number; // Consumed
  val2: number; // Burned
}

function getScale(maxValue: number) {
  if (maxValue === 0) return { maxVal: 100, ticks: [0, 25, 50, 75, 100] };
  const targetMax = maxValue * 1.1;
  const targetTicks = 4;
  const roughStep = targetMax / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;

  let niceStep;
  if (normalizedStep <= 1) niceStep = 1;
  else if (normalizedStep <= 2) niceStep = 2;
  else if (normalizedStep <= 5) niceStep = 5;
  else niceStep = 10;
  const step = niceStep * magnitude;
  const maxVal = Math.ceil(targetMax / step) * step;

  const ticks = [];
  const numTicks = Math.round(maxVal / step);
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return { maxVal, ticks };
}

export function BarChart ({ data }: { data: ChartData[] }) {
  const height = 180;
  const barWidth = 18; 
  const groupGap = 18; 
  const paddingLeft = 30; 
  const paddingRight = 20; 
  const totalItemWidth = barWidth * 2 + groupGap;
  const contentWidth = (totalItemWidth * data.length) - groupGap;
  const width = contentWidth + paddingLeft + paddingRight - groupGap; // Total SVG width
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const normalised = data.map(d => {
  const v1 = Number(d.val1) || 0;
  const v2 = Number(d.val2) || 0;
  return { ...d, val1: v1, val2: v2 };
  });
  const values = normalised.flatMap(d => [d.val1, d.val2]);
  const rawMax = values.length ? Math.max(...values) : 0;
  const { maxVal, ticks } = getScale(rawMax);
  const yAxisOffset = 30;
  
  return (
    <div className="w-full h-58 relative absolute z-50 flex items-end justify-center my-6 max-md:justify-start max-md:overflow-x-auto max-md:overflow-y-hidden max-md:my-3 max-md:px-1 max-md:[-webkit-overflow-scrolling:touch]">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ ['--chartW' as any]: width }}
        className="w-full h-full overflow-visible max-md:w-[calc(var(--chartW)*1px)] max-md:max-w-none"
        preserveAspectRatio="xMidYMid meet" 
      >

        {/* Y-Axis Grid Lines */}
        {ticks.map((value) => {
        const y = height - (value / maxVal * height);

        return (
          <g key={value}>
            <line
              x1={yAxisOffset}
              y1={y}
              x2={width}
              y2={y}
              stroke="#f0f0f0"
              strokeDasharray="4"
            />
            <text
              x={2}
              y={y}
              textAnchor="start"
              dominantBaseline="middle"
              className="text-[10px] fill-gray-400"
            >
              {value}
            </text>
          </g>
        );
      })}

        {normalised.map((d, i) => {
          const xPos = paddingLeft + i * totalItemWidth;
          
          const h1Raw = (d.val1 / maxVal) * height;
          const h2Raw = (d.val2 / maxVal) * height;

          const h1 = Number.isFinite(h1Raw) ? h1Raw : 0;
          const h2 = Number.isFinite(h2Raw) ? h2Raw : 0;

          return (
            <g key={i} className="group cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              {/* Bar 1: Consumed (Yellow) */}
              <rect 
                x={xPos} 
                y={height - h1} 
                width={barWidth} 
                height={h1} 
                rx={3} 
                fill="#FCD34D" 
                className="transition-opacity hover:opacity-80"
              />
              
              {/* Bar 2: Burned (Orange) */}
              <rect 
                x={xPos + barWidth + 2} 
                y={height - h2} 
                width={barWidth} 
                height={h2} 
                rx={3} 
                fill="#FB923C" 
                className="transition-opacity hover:opacity-80"
              />

              {/* X Axis Label */}
              <text 
                x={xPos + barWidth} 
                y={height + 20} 
                textAnchor="middle" 
                className="text-[12px] fill-gray-400 font-medium"
                style={{ fontSize: data.length > 5 ? '10px' : '12px' }}
              >
                {d.label}
              </text>
            </g>
          );
        })}

      {hoveredIdx !== null && (() => {
        const d = normalised[hoveredIdx];

        const xPos = paddingLeft + hoveredIdx * totalItemWidth;

        const h1Raw = (d.val1 / maxVal) * height;
        const h2Raw = (d.val2 / maxVal) * height;
        const h1 = Number.isFinite(h1Raw) ? h1Raw : 0;
        const h2 = Number.isFinite(h2Raw) ? h2Raw : 0;

        const topY = height - Math.max(h1, h2);

        const tooltipW = 100;
        const tooltipH = 40;
        const arrowH = 6;

        let tx = xPos + barWidth;                
        let x = tx - tooltipW / 2;
        let y = topY - tooltipH - arrowH - 6;

        x = Math.max(0, Math.min(x, width - tooltipW));
        y = Math.max(0, y);

        return (
          <g pointerEvents="none">
            {/* tooltip box */}
            <rect
              x={x}
              y={y}
              width={tooltipW}
              height={tooltipH}
              rx={6}
              fill="rgba(17,24,39,0.9)"
            />

            {/* text */}
            <text x={x + tooltipW / 2} y={y + 15} fontSize="9" fontWeight="600" fill="#FCD34D" textAnchor="middle" dominantBaseline="middle">
              Consumed: {d.val1}
            </text>
            <text x={x + tooltipW / 2} y={y + 28} fontSize="9" fontWeight="600" fill="#FB923C" textAnchor="middle" dominantBaseline="middle">
              Burned: {d.val2}
            </text>

            {/* arrow */}
            <path
              d={`M ${tx - 6} ${y + tooltipH} L ${tx + 6} ${y + tooltipH} L ${tx} ${y + tooltipH + arrowH} Z`}
              fill="rgba(17,24,39,0.9)"
            />
          </g>
        );
      })()}
      </svg>
    </div>
  );
}