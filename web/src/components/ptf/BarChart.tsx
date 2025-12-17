interface ChartData {
  label: string;
  val1: number; // Consumed
  val2: number; // Burned
}

export function BarChart ({ data }: { data: ChartData[] }) {
  const height = 180;
  const barWidth = 18; 
  const groupGap = 18; 
  const xPadding = 30;
  const contentWidth = (barWidth * 2 + groupGap) * data.length;
  const width = contentWidth + xPadding  * 2; 

  const values = data.flatMap(d => [d.val1, d.val2]);
  const maxVal = values.length ? Math.max(...values)*1.2 : 100;
  const yAxisOffset = 30;
  
  return (
    <div className="w-full h-48 flex items-end justify-center my-6">
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

        {data.map((d, i) => {
          const xPos = xPadding + i * (barWidth * 2 + groupGap);
          
          const h1 = (d.val1 / maxVal) * height;
          const h2 = (d.val2 / maxVal) * height;

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
              
              {/* Tooltip */}
              <foreignObject 
                x={xPos - 15} 
                y={height - Math.max(h1, h2) - 50} 
                width="80" 
                height="50" 
                className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              >
                 <div className="bg-gray-900/90 text-white text-[8px] p-2 rounded-lg text-center shadow-lg backdrop-blur-sm">
                    <div className="font-bold text-yellow-300">Consumed: {d.val1}</div>
                    <div className="font-bold text-orange-300">Burned: {d.val2}</div>
                 </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};