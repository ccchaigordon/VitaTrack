import { RangeSelect, type RangeOption  } from './RangeSelect';
import Calorie from '../../assets/Progress/Calorie.svg';
import Carbs from '../../assets/Progress/Carbs.svg';
import Protein from '../../assets/Progress/Protein.svg';
import Fats from '../../assets/Progress/Fats.svg'; 

interface MacroData {
  current: {
    carbs: number;
    fat: number;
    protein: number;
    totalCalories: number;
  }
  deltaPercent: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  }
  previous: {
    carbs: number;
    fat: number;
    protein: number;
    totalCalories: number;
  };
}

interface Props {
  data: MacroData;
  rangeDays: number;
  onRangeChange: (days: number) => void;
}

const macroOptions: RangeOption[] = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
];

const MacroItem: React.FC<{ icon: string; color?: string; label: string; value: number; unit: string; delta: number; comparison: string; }> 
= ({ icon, color, label, value, unit, delta, comparison }) => {
  const isPositive = delta > 0;
  return (
    <div className="flex items-center gap-3 p-1">
      <div className={`p-2 rounded-xl ${color} flex items-center justify-center w-12 md:w-14 aspect-square`}>
        <img src={icon} className="w-6 h-6" />
      </div>
      <div className="flex flex-col items-start text-left">
        <p className="text-[15px] text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value.toLocaleString()} <span className="text-xs font-normal text-gray-400">{unit}</span></p>
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? 
          <img src="src/assets/Progress/TrendUp.svg" className="w-4 h-4"/> : 
          <img src="src/assets/Progress/TrendDown.svg" className="w-4 h-4"/>}
          <span className="text-[12px] font-bold text-gray-500">{Math.abs(delta)}% <span className="font-normal text-gray-400">{comparison}</span></span>
        </div>
      </div>
    </div>
  );
};

export function MacroCard ({ data, rangeDays, onRangeChange }: Props) {
  const comparison = rangeDays === 7 ? 'vs last week' : 'vs last month';
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200"> 
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Macronutrients</h3>
        <RangeSelect value={rangeDays} options={macroOptions} onChange={onRangeChange}  />
      </div>
      
      <div className="grid grid-cols-2 gap-y-8 gap-x-4">
        <MacroItem icon={Calorie} color='bg-lime-300' label="Total Calories" value={data.current.totalCalories} unit="kcal" delta={data.deltaPercent.calories} comparison={comparison}/>
        <MacroItem icon={Carbs} color="bg-amber-300" label="Total Carb" value={data.current.carbs} unit="g" delta={data.deltaPercent.carbs} comparison={comparison}/>
        <MacroItem icon={Protein} color="bg-orange-300" label="Total Proteins" value={data.current.protein} unit="g" delta={data.deltaPercent.protein} comparison={comparison}/>
        <MacroItem icon={Fats} color="bg-gray-100" label="Total Fats" value={data.current.fat} unit="g" delta={data.deltaPercent.fat} comparison={comparison}/>
      </div>
    </div>
  );
};