type InsightResponse = {
  summary: string[] | string;
  nextFocus?: string | null;
  isFallback: boolean;
};

interface Props {
  insight: InsightResponse | null;
}

export function InsightsCard ({ insight }: Props) {
  const lines =
    typeof insight?.summary === "string"
      ? [insight.summary]
      : Array.isArray(insight?.summary)
      ? insight.summary
      : [];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[160px] flex flex-col justify-center border border-gray-50">
      <div className="flex items-left gap-2 mb-3">
        <img src="./src/assets/Progress/Bot.svg" className="w-6 h-6 mt-[2px]" />
        <h3 className="text-xl font-bold text-gray-800">Weekly Insights</h3>
      </div>
      
      {insight ? ( 
         <div className="space-y-2 animate-in fade-in duration-500">
          <ul className="list-disc list-inside space-y-1 text-left">
            {lines.length ? (
              lines.map((line, i) => (
                <li key={i} className="text-sm text-gray-600 leading-relaxed">
                  {line}
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-400 italic">
                No insights available yet.
              </li>
            )}
          </ul>
          
          {insight.nextFocus && (
            <div className="mt-3 bg-emerald-50 p-2 rounded-lg text-xs text-emerald-800 font-medium">
              🚀 Focus: {insight.nextFocus}
            </div>
          )}
          <p className="text-[9px] text-gray-300 mt-2 text-right">Non-medical guidance. Consult a doctor for health risks.</p>
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic">
          Log your meals and workouts to receive personalized AI insights.
        </div>
      )}
    </div>
  );
};