interface ChartData {
  label: string;
  val1: number; // Consumed
  val2: number; // Burned
}

export function BarChart ({ data }: { data: ChartData[] }) {
  const height = 180;
  const barWidth = 18; 
  const groupGap = 18; 
  const paddingLeft = 50; 
  const paddingRight = 10; 
  const totalItemWidth = barWidth * 2 + groupGap;
  const contentWidth = (totalItemWidth * data.length) - groupGap;
  const width = contentWidth + paddingLeft + paddingRight - groupGap; // Total SVG width

  const normalised = data.map(d => {
  const v1 = Number(d.val1) || 0;
  const v2 = Number(d.val2) || 0;
  return { ...d, val1: v1, val2: v2 };
  });
  const values = normalised.flatMap(d => [d.val1, d.val2]);
  const rawMax = values.length ? Math.max(...values) : 0;
  const ceiling = rawMax > 0 ? rawMax * 1.1 : 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(ceiling)));
  const step = magnitude / 2; 
  const maxVal = Math.ceil(ceiling / step) * step;
  const yAxisOffset = 30;
  
  return (
    <div className="w-full h-58 flex items-end justify-center my-6">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet" 
      >

        {/* Y-Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = height - (height * tick);
        const value = Math.round(maxVal * tick);

        return (
          <g key={tick}>
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
            <g key={i} className="group cursor-pointer">
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

              <foreignObject 
                x={xPos - 15} 
                y={height - Math.max(h1, h2) - 50} 
                width="80" 
                height="50" 
                className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-visible"
              >
                <div className="flex flex-col items-center justify-center">
                 <div className="bg-gray-900/90 text-white text-[8px] p-2 rounded-lg text-center shadow-lg backdrop-blur-sm">
                    <div className="font-bold text-yellow-300">Consumed: {d.val1}</div>
                    <div className="font-bold text-orange-300">Burned: {d.val2}</div>
                 </div>
                 <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-900/90" />
                 </div>
              </foreignObject>
            </g>
          );
        })}

      </svg>
    </div>
  );
}