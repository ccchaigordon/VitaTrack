interface MealLogItem {
  created_at: string;
  meal_name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  meal_time: string | null;
}

interface Props {
  logs: MealLogItem[];
}

export function MealLog({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-xl">📝</span>
        </div>
        <p>No meal logs found.</p>
      </div>
    );
  }

return (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full max-h-[600px]">
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <h3 className="font-bold text-gray-800">Recent Meals 🍳</h3>
      <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded-md border border-gray-200">
        Last {logs.length} entries
      </span>
    </div>
    
    <div className="overflow-y-auto flex-1 p-0">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase w-16 text-center">No.</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Date & Time</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Meal</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Food</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Calories</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Protein</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Carbs</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Fat</th>
            
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log, index) => {
            return (
              <tr key={index} className="hover:bg-gray-50 transition-colors">

                <td className="py-3 px-4 text-sm text-gray-500 text-center">
                      {index + 1}
                </td>

                {/* Date */}
                <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'UTC', 
                  }).replace(',', '')}
                </td>
                
                {/* Meal Time */}
                <td className="py-3 px-4 text-sm text-gray-600 text-center">
                  {log.meal_time ? log.meal_time : '-'}
                </td>

                {/* Food Name */}
                <td className="py-3 px-4 text-sm font-medium text-gray-800">
                  {log.meal_name}
                </td>

                {/* Calories */}
                <td className="py-3 px-4 text-sm text-gray-600 text-center">
                  {log.calories ? log.calories : '-'}
                </td>

                {/* Protein */}
                <td className="py-3 px-4 text-sm text-gray-600 text-center">
                  {log.protein ? log.protein : '-'}
                </td>

                {/* Carbs */}
                <td className="py-3 px-4 text-sm text-gray-600 text-center">
                  {log.carbs ? log.carbs : '-'}
                </td>

                {/* Fat */}
                <td className="py-3 px-4 text-sm text-gray-600 text-center text-gray-600">
                  {log.fat ? log.fat : '-'}
                </td>
                
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
};

export default MealLog;