import { useEffect, useState } from 'react';
import { CaloriesCard } from '../components/ptf/CaloriesCard';
import { MacroCard } from '../components/ptf/MacroCard';
import { InsightsCard } from '../components/ptf/InsightsCard';
import { apiFetch } from "../services/api";

interface CaloriesActivity {
  date: string;
  dayName: string;
  caloriesConsumed: number;
  caloriesBurned: number;
}

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

type GoalStatus = 'on_track' | 'slightly_behind' | 'off_track' | null;

interface MetricsResponse {
  rangeDays: number;
  caloriesActivity: CaloriesActivity[];
  macros: MacroData;
  workouts: {
    totalCount: number;
    streakDays: number;
    history: number[];
  };
  goals: {
    hasGoals: boolean;
    calorieGoal: number;
    workoutGoalPerWeek: number;
  };
  status: {
    calories: GoalStatus;
    workouts: GoalStatus;
  };
}

interface InsightResponse {
  summary: string[];
  nextFocus: string;
  isFallback: boolean; // True if Gemini failed or no data
}

const ErrorCardPlaceholder = ({ title, message }: { title: string, message: string }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 h-full flex flex-col items-center justify-center text-center min-h-[300px]">
    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-gray-800 font-bold mb-1">{title}</h3>
    <p className="text-xs text-gray-400 max-w-[200px]">{message}</p>
  </div>
);

export function ProgressDashboardPage() {
  const [macroRange, setMacroRange] = useState<number>(7);
  const [caloriesRange, setCaloriesRange] = useState<number>(7);

  // const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse>(MOCK_METRICS);

  // Error States
  const [macroError, setMacroError] = useState(false);
  const [caloriesError, setCaloriesError] = useState(false);
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [activeTab, setActiveTab] = useState('progress');
  

  // FETCH 1: MACROS
  useEffect(() => {
    const fetchMacros = async () => {
      setMacroError(false);
      try {
        const macroData = await apiFetch<MacroData>(`/ptf/macros?days=${macroRange}`);

        console.log('Fetched Macro Data:', macroData);
        
        setMetrics(prev => ({
            ...prev,
            macros: macroData
          }));
      } catch (err) { console.error(err); setMacroError(true); }
    };
    
    fetchMacros();
  }, [macroRange]);

  // FETCH 2: CALORIES ACTIVITY
  useEffect(() => {
    const fetchCalories = async () => {
      try {
        const activityData = await apiFetch<CaloriesActivity[]>(`/ptf/calories?days=${caloriesRange}`);

        setMetrics(prev => ({
          ...prev,
            caloriesActivity: activityData
          }));
      } catch (err) { console.error(err); 
        setCaloriesError(true);
      }
    };

    fetchCalories();
  }, [caloriesRange]);

  // FETCH 3: WEEKLY INSIGHTS
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await apiFetch<InsightResponse>(`/ptf/insights`);
        setInsight(response);
      } catch (err) {
        console.error(err);
        setInsight(MOCK_INSIGHTS);
      }
    };

    fetchInsights();
  }, []);

  return (
    <div className="min-h-screen w-full p-10 bg-cover bg-[#F5F7FA] md:p-2 flex justify-center font-sans">
      {/* Container */}
      <div className="w-full max-w-[1800px] m-4 md:p-2 flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-64 bg-white rounded-2xl shadow-sm p-4 flex-shrink-0">
          
          <nav className="space-y-4">
            <button 
              onClick={() => setActiveTab('progress')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'progress' 
                  ? 'bg-[#CDEE6E] text-black shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <img src="src/assets/Progress/Progress.svg" className="w-5 h-5" />
              Progress
            </button>

            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full font-medium text-gray-400 hover:text-gray-600 hover:bg-white/50`}
            >
              <div className="flex items-center gap-3">
                <img src="src/assets/Progress/Bell.svg" className="w-5 h-5" />
                Notification
              </div>
            </button>

            <div className="px-4 py-2">
              <div className="flex items-center justify-between text-gray-400 mb-2 cursor-pointer hover:text-gray-600">
                <div className="flex items-center gap-3 font-medium">
                  <img src="src/assets/Progress/Recommendation.svg" className="w-5 h-5" />
                  Recommendation
                </div>
              </div>
              <div className="pl-12 space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2 hover:text-gray-600 cursor-pointer">
                  <span className="w-4 border-b border-gray-300"></span>Recipe
                </div>
                <div className="flex items-center gap-2 hover:text-gray-600 cursor-pointer">
                  <span className="w-4 border-b border-gray-300"></span>Workout
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* MAIN CONTAINER */}
        <main className="flex-1">

          <section className="mb-6">
            <InsightsCard insight={insight} /*loading={loading}*/ />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="min-w-0">
            {caloriesError ? (
                 <ErrorCardPlaceholder title="Calories Unavailable" message="Could not load activity data. Check connection." />
              ) : (
              <CaloriesCard 
              data={metrics.caloriesActivity} 
              goal={metrics.goals.calorieGoal}
              status={metrics.status.calories}
              rangeValue={caloriesRange}
              onRangeChange={setCaloriesRange}
            />)}
            </div>
            <div className="min-w-0">
              {macroError ? (
                 <ErrorCardPlaceholder title="Macros Unavailable" message="Could not load macronutrient data. Check connection." />
              ) : (
            <MacroCard data={metrics.macros} rangeDays={macroRange} onRangeChange={setMacroRange} />)}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

// DUMMY DATA

const MOCK_METRICS: MetricsResponse = {
  rangeDays: 7,
  caloriesActivity: [
    { date: '2025-10-20', dayName: 'Mon', caloriesConsumed: 1800, caloriesBurned: 450},
    { date: '2025-10-21', dayName: 'Tue', caloriesConsumed: 1650, caloriesBurned: 300},
    { date: '2025-10-22', dayName: 'Wed', caloriesConsumed: 2100, caloriesBurned: 500},
    { date: '2025-10-23', dayName: 'Thu', caloriesConsumed: 1950, caloriesBurned: 400},
    { date: '2025-10-24', dayName: 'Fri', caloriesConsumed: 1750, caloriesBurned: 350},
    { date: '2025-10-25', dayName: 'Sat', caloriesConsumed: 2200, caloriesBurned: 600},
    { date: '2025-10-26', dayName: 'Sun', caloriesConsumed: 1850, caloriesBurned: 300},
  ],
  
  macros: {
    current: {
      totalCalories: 7500,
      carbs: 210,
      protein: 498,
      fat: 285,
    },
    previous: {
      totalCalories: 7200,
      carbs: 200,
      protein: 480,
      fat: 260,
    },
    deltaPercent: {
      calories: 1.45,
      carbs: 0.78,
      protein: -2.84,
      fat: 4.16,
    },
  },
  workouts: {
    totalCount: 3,
    streakDays: 2,
    history: [1, 0, 1, 1, 0, 1, 1]
  },
  goals: {
    hasGoals: true,
    calorieGoal: 2000,
    workoutGoalPerWeek: 4
  },
  status: {
    calories: 'on_track', 
    workouts: 'slightly_behind' 
  }
};

const MOCK_INSIGHTS: InsightResponse = {
  summary: [
    "Your protein intake is slightly lower than last week (-2.84%).",
    "Great job maintaining a 2-day workout streak!",
    "Calorie consumption is stable and within 10% of your goal."
  ],
  nextFocus: "Try adding a protein shake after your Thursday workout.",
  isFallback: false
};