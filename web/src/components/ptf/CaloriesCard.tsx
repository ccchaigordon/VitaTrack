import { useNavigate } from 'react-router-dom';
import { BarChart } from './BarChart';
import { RangeSelect, type RangeOption } from './RangeSelect';

interface CaloriesActivity {
  date: string;
  dayName: string; 
  caloriesConsumed: number;
  caloriesBurned: number;
}

const caloriesOptions: RangeOption[] = [
  { label: 'This Week', value: 7 },        
  { label: 'Last Week', value: 14 },       
  { label: '2 Weeks Ago', value: 21 }      
];

interface Props {
  data: CaloriesActivity[];
  goal: number | null;
  rangeValue: number;
  onRangeChange: (val: number) => void;
}

export function CaloriesCard ({ data, goal, rangeValue, onRangeChange }: Props) {
  const navigate = useNavigate();
  const totalBurned = data.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
  const hasGoal = goal !== null && goal > 0;
  const currentGoal = goal || 0;
  const remaining = Math.max(0, currentGoal - totalBurned);
  const isGoalMet = hasGoal && remaining === 0;
  const isCurrentWeek = rangeValue === 7;

  const chartData = data.map(d => ({
    label: d.dayName,
    val1: d.caloriesConsumed,
    val2: d.caloriesBurned
  }));

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-left text-xl font-bold text-gray-800">Calories Activities</h3>
          
          {!isCurrentWeek && (
             <div className="flex flex-col items-start gap-1 mt-2">
               <div className="flex items-center gap-2">
                 <span className="text-2xl font-bold text-gray-900">
                    {totalBurned.toLocaleString()}
                 </span>
                 <span className="text-sm text-gray-400 font-medium">kcal burned</span>
               </div>
               {hasGoal && (
                 <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                   totalBurned >= currentGoal 
                     ? "bg-green-100 text-green-700" 
                     : "bg-gray-100 text-gray-500"
                 }`}>
                   {totalBurned >= currentGoal ? "Goal met 🎉" : "Goal missed"}
                 </span>
               )}
             </div>
          )}

          {isCurrentWeek && (
            <>
              {/* Case A: No Goal */}
              {!hasGoal && (
                <>
                  <div className="flex items-center gap-2 my-1">
                    <span className="text-2xl font-bold text-gray-900">0</span>
                    <span className="text-sm text-gray-400 font-medium">kcal left</span>
                  </div>
                  <button
                      onClick={() => navigate('/profile/edit')}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-600 font-medium py-1 px-3 rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Set goal ✏️
                  </button>
                </>
              )}

              {/* Case B: In Progress */}
              {hasGoal && !isGoalMet && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{remaining.toLocaleString()}</span>
                    <span className="text-sm text-gray-400 font-medium">kcal left</span>
                  </div>
                  <div className="flex flex-col items-start gap-2 mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      Goal: {currentGoal.toLocaleString()} kcal / week
                    </span>
                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium text-sm">
                      Burned so far: {totalBurned.toLocaleString()} kcal
                    </span>
                  </div>
                </>
              )}

              {/* Case C: Goal Met */}
              {hasGoal && isGoalMet && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">0</span>
                    <span className="text-sm text-gray-400 font-medium">kcal left</span>
                  </div>
                  <div className="flex flex-col items-start gap-2 mb-2">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      Goal met! {totalBurned.toLocaleString()} kcal burned this week🎉
                    </span>
                    <button
                      onClick={() => navigate('/profile/edit')}
                      className="bg-[#CDEE6E] hover:bg-[#bfe05e] text-black text-xs px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 cursor-pointer w-fit"
                    >
                      Set new goal✏️
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-1 text-[12px] text-gray-400 mr-2">
          <div className="mb-4">
            <RangeSelect
              value={rangeValue}
              options={caloriesOptions}
              onChange={onRangeChange}
            />
          </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-[#FCD34D]"></div> Consumed
          </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-[#FB923C]"></div> Burned
          </div>
        </div>
      </div>
      <BarChart data={chartData} />
    </div>
  );
};