import { BarChart } from './BarChart';
import { GoalBadge } from './GoalBadge';
import { RangeSelect, type RangeOption } from './RangeSelect';

interface CaloriesActivity {
  date: string;
  dayName: string; 
  caloriesConsumed: number;
  caloriesBurned: number;
}

type GoalStatus = 'on_track' | 'slightly_behind' | 'off_track' | null;

const caloriesOptions: RangeOption[] = [
  { label: 'This Week', value: 7 },        
  { label: 'Last Week', value: 14 },       
  { label: '2 Weeks Ago', value: 21 }      
];

interface Props {
  data: CaloriesActivity[];
  goal: number;
  status: GoalStatus;
  rangeValue: number;
  onRangeChange: (val: number) => void;
}

export function CaloriesCard ({ data, goal, status, rangeValue, onRangeChange }: Props) {
  // DUMMY : WAIT GOAL FROM USER MODULE
  const lastEntry = data[data.length - 1] || { caloriesConsumed: 0 };
  const kcalLeft = Math.max(0, goal - lastEntry.caloriesConsumed);

  const chartData = data.map(d => ({
    label: d.dayName,
    val1: d.caloriesConsumed,
    val2: d.caloriesBurned
  }));

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-left text-xl font-bold text-gray-800">Calories Activities</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">{kcalLeft}</span>
            <span className="text-sm text-gray-400 font-medium">kcal left</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            Goal: {goal.toLocaleString()} kcal
            {status && <GoalBadge status={status} />}
          </div>
        </div>

      <div className="flex flex-col gap-1 text-[12px] text-gray-400 mr-2">
        <div className="mb-4">
        <RangeSelect
          value={rangeValue}
          options={caloriesOptions}
          onChange={onRangeChange}
        />
        </div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FCD34D]"></div> Consumed</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FB923C]"></div> Burned</div>
      </div>
    </div>
      <BarChart data={chartData} />
    </div>
  );
};