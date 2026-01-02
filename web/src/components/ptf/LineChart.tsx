interface WorkoutData {
  date: string;
  label: string; 
  count: number; 
}

export function LineChart ({ data }: { data: WorkoutData[] }) {
  const height = 180;
  const width = 800;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(5, ...data.map(d => d.count));
  
  // Scale
  const getY = (val: number) => {
    const availableHeight = height - (paddingY * 2);
    const percent = val / maxVal;
    return height - paddingY - (percent * availableHeight);
  };

  const getX = (index: number) => {
    const availableWidth = width - (paddingX * 2);
    const step = availableWidth / (data.length - 1);
    return paddingX + (index * step);
  };

  // Line Path
  const points = data
    .map((d, i) => `${getX(i)},${getY(d.count)}`)
    .join(" ");

  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center max-md:justify-start max-md:overflow-x-auto max-md:[-webkit-overflow-scrolling:touch]">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible max-md:min-w-[800px]"
        preserveAspectRatio="none"
      >
        {/* Grid Lines (Y-Axis) */}
        {[0, 0.5, 1].map((tick) => {
          const val = Math.round(maxVal * tick);
          const yPos = getY(val);
          return (
            <g key={tick}>
              {/* Dashed Line */}
              <line 
                x1={paddingX} y1={yPos} 
                x2={width - paddingX} y2={yPos} 
                stroke="#e5e7eb" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
              {/* Axis Label */}
              <text 
                x={paddingX - 10} y={yPos} 
                textAnchor="end" 
                dominantBaseline="middle" 
                className="text-[10px] fill-gray-400"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Trend Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />

        {/* Data Points & Interaction */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.count);

          return (
            <g key={i} className="group cursor-pointer">
              
              {/* Hit Area */}
              <circle cx={x} cy={y} r="12" fill="transparent" />

              {/* Visible Dot */}
              <circle 
                cx={x} 
                cy={y} 
                r="4" 
                fill="white" 
                stroke="#10B981" 
                strokeWidth="2" 
                className="transition-all duration-200 group-hover:r-6 group-hover:fill-[#10B981]" 
              />

              {/* X-Axis Label */}
              <text 
                x={x} 
                y={height - 5} 
                textAnchor="middle" 
                className="text-[10px] fill-gray-400 font-medium"
              >
                {/* Show label for every item */}
                {d.label}
              </text>

              {/* Tooltip */}
              <foreignObject
                x={x - 40}
                y={y - 50} 
                width="80" 
                height="50" 
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              >
                <div className="flex flex-col items-center justify-center">
                   <div className="bg-gray-900/90 text-white text-[10px] py-1 px-2 rounded shadow-lg backdrop-blur-sm whitespace-nowrap z-50">
                      <span className="font-bold">{d.count}</span> Workouts
                      <div className="text-[8px] text-gray-300">{d.date}</div>
                   </div>
                   <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-900/90"></div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};