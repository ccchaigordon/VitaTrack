import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaloriesCard } from '../components/ptf/CaloriesCard';
import { MacroCard } from '../components/ptf/MacroCard';
import { InsightsCard } from '../components/ptf/InsightsCard';
import { LineChart } from '../components/ptf/LineChart'; 
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

interface WorkoutData {
  date: string; 
  label: string; 
  count: number; 
}

type ResourceItem = {
  id: string;
  title: string;
  summary: string;
  badge: string;
  link?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  category?: string;
  content?: string;
  cooking_time?: number;
  ingredients?: string[];
  isRecipe?: boolean;
  image_url?: string;
  dietary_tags?: string[];
};

interface MetricsResponse {
  rangeDays: number;
  caloriesActivity: CaloriesActivity[];
  macros: MacroData;
  workouts: WorkoutData[];
  goals: {
    hasGoal: boolean;
    calorieGoal: number | null;
  };
}

interface InsightResponse {
  summary: string[];
  nextFocus: string;
  isFallback: boolean;
}

interface CaloriesResponse {
  history: CaloriesActivity[];
  goal: number | null;
}

interface NotificationItem {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  action_link?: string;
  type: 'alert' | 'info' | 'success' | 'reminder';
}

const LoadingPlaceholder = ({ text = "Loading data...", height = "h-full", minHeight = "min-h-[200px]" }: { text?: string, height?: string, minHeight?: string }) => (
  <div className={`flex items-center justify-center ${height} ${minHeight} bg-white rounded-2xl border border-gray-200`}>
    <span className="text-gray-500 font-medium">{text}</span>
  </div>
);

const FallbackCard = ({ title, message }: { title: string, message: string }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full flex flex-col items-center justify-center text-center min-h-[40px]">
    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-gray-800 font-bold mb-1">{title}</h3>
    <p className="text-xs text-gray-400 max-w-[200px]">{message}</p>
  </div>
);

interface NavContentProps {
  activeTab: string;
  recOpen: boolean;
  onProgress: () => void;
  onRecToggle: () => void;
  onChildClick: (tab: "recipe" | "workout") => void;
}

const SidebarContent = ({ activeTab, recOpen, onProgress, onRecToggle, onChildClick }: NavContentProps) => {
  const activeBtn = "bg-[#2A4A2D] text-white shadow-sm";
  const inactiveBtn = "text-black hover:bg-gray-50";
  const recSectionActive = activeTab === "recommendation" || activeTab === "recipe" || activeTab === "workout";
  const recParentSelected = activeTab === "recommendation";

  return (
    <nav className="space-y-4">
      <button 
        onClick={onProgress}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium cursor-pointer ${
          activeTab === 'progress' ? activeBtn : inactiveBtn
        }`}>
        <img src={activeTab === "progress" ? "src/assets/Progress/Progress_active.svg" : 
          "src/assets/Progress/Progress.svg"} className="w-5 h-5" alt="Progress" />
        Progress
      </button>

      <button
        onClick={onRecToggle}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium cursor-pointer 
          ${recParentSelected ? activeBtn : recSectionActive ? "text-black" : inactiveBtn}`}
      >
        <div className="flex items-center gap-3">
          <img
            src={recSectionActive ? "src/assets/Progress/Recommendation.svg" :
              "src/assets/Progress/Recommendation.svg"}
            className="w-5 h-5" alt="Recommendation" />
          Recommendation
        </div>
        <span className={`text-xl transition-transform ${recOpen ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>

      {recOpen && (
        <div className="pl-12 space-y-2">
          <button
            onClick={() => onChildClick("recipe")}
            className={`w-full flex items-center gap-2 font-medium rounded-lg px-3 py-2 cursor-pointer
              ${activeTab === "recipe" ? activeBtn : inactiveBtn}`}
          >Recipe
          </button>

          <button
            onClick={() => onChildClick("workout")}
            className={`w-full flex items-center gap-2 font-medium rounded-lg px-3 py-2 cursor-pointer 
              ${activeTab === "workout" ? activeBtn : inactiveBtn}`}
          >Workout
          </button>
        </div>
      )}
    </nav>
  );
};

function RecipeImage({
    imageUrl,
    title,
  }: {
    imageUrl: string;
    title: string;
  }) {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
      return (
        <div className="w-16 h-16 rounded-md bg-[#DDF3D8] flex items-center justify-center shrink-0 border border-gray-200">
          <span className="text-xs font-medium text-[#1A381D]">Recipe</span>
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={title}
        className="w-16 h-16 rounded-md object-cover shrink-0 border border-gray-200"
        onError={() => setImageError(true)}
      />
    );
  }

  function ResourceCard({
    item,
    navigate,
  }: {
    item: ResourceItem;
    navigate: (path: string) => void;
  }) {
    const handleCardClick = () => {
      if (item.isRecipe) {
        navigate(`/resources/recipes/${item.id}`);
      } else if (item.link) {
        window.open(item.link, "_blank");
      }
    };

    return (
      <div
        onClick={handleCardClick}
        className={`flex flex-col rounded-lg border border-gray-200 bg-white p-6 h-full ${
          item.isRecipe || item.link
            ? "cursor-pointer hover:border-[#2A4A2D] hover:shadow-sm"
            : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight flex-1">
            {item.title}
          </h3>
          {item.isRecipe && item.image_url ? (
            <RecipeImage imageUrl={item.image_url} title={item.title} />
          ) : (
            <span className="rounded-md bg-[#DDF3D8] px-2.5 py-1 text-xs font-medium text-[#1A381D] whitespace-nowrap shrink-0">
              {item.badge}
            </span>
          )}
        </div>

        {/* Recipe Card: Show Macros */}
        {item.isRecipe && (
          <div className="mb-4 grid grid-cols-4 gap-2">
            <div className="bg-[#DDF3D8] rounded-md p-2.5 text-center">
              <div className="text-sm font-semibold text-[#1A381D]">
                {item.calories || 0}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">Cal</div>
            </div>
            <div className="bg-[#E8F5E3] rounded-md p-2.5 text-center">
              <div className="text-sm font-semibold text-[#2A4A2D]">
                {item.carbs || 0}g
              </div>
              <div className="text-xs text-gray-600 mt-0.5">Carbs</div>
            </div>
            <div className="bg-[#DDF3D8] rounded-md p-2.5 text-center">
              <div className="text-sm font-semibold text-[#1A381D]">
                {item.protein || 0}g
              </div>
              <div className="text-xs text-gray-600 mt-0.5">Protein</div>
            </div>
            <div className="bg-[#E8F5E3] rounded-md p-2.5 text-center">
              <div className="text-sm font-semibold text-[#2A4A2D]">
                {item.fat || 0}g
              </div>
              <div className="text-xs text-gray-600 mt-0.5">Fat</div>
            </div>
          </div>
        )}

        {/* Recipe Card: Show Ingredients and Cooking Time */}
        {item.isRecipe && (
          <div className="mb-4 space-y-1.5">
            {item.cooking_time && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-400">Time:</span>
                <span>{item.cooking_time} min</span>
              </div>
            )}
            {item.ingredients && item.ingredients.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-400">Ingredients:</span>
                <span>{item.ingredients.length}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3 flex-1">
            {item.summary}
          </p>

          {/* External Link for Articles/Tutorials */}
          {!item.isRecipe && item.link && (
            <div className="text-sm font-medium text-[#2A4A2D] mt-auto">
              View More →
            </div>
          )}

          {/* Recipe Card: Click to View Full Recipe */}
          {item.isRecipe && (
            <div className="text-sm font-medium text-[#2A4A2D] mt-auto">
              View Full Recipe →
            </div>
          )}
        </div>
      </div>
    );
  }

export function ProgressDashboardPage() {
  const navigate = useNavigate();
  const [macroRange, setMacroRange] = useState<number>(7);
  const [caloriesRange, setCaloriesRange] = useState<number>(7);
  const [streak, setStreak] = useState<number>(0);
  const [metrics, setMetrics] = useState<MetricsResponse>(INITIAL_METRICS);
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [recRecipes, setRecRecipes] = useState<ResourceItem[]>([]);
  const [recWorkouts, setRecWorkouts] = useState<ResourceItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Error States
  const [macroError, setMacroError] = useState(false);
  const [caloriesError, setCaloriesError] = useState(false);

  // Navigation States
  const [activeTab, setActiveTab] = useState('progress');
  const [recOpen, setRecOpen] = useState(false);

  // Loading States
  const [loadingMacros, setLoadingMacros] = useState(true);
  const [loadingCalories, setLoadingCalories] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Mobile Menu States
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAnimating, setMobileAnimating] = useState(false);

  function openMobileMenu() {
    setMobileOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMobileAnimating(true);
      });
    });
  }

  function closeMobileMenu() {
    setMobileAnimating(false);
    setTimeout(() => setMobileOpen(false), 300);
  }

  const handleProgress = () => {
    setActiveTab("progress");
    setRecOpen(false);
    if (mobileOpen) closeMobileMenu();
  };

  const handleRecommendation = () => {
    setRecOpen((prev) => !prev);
    if (!recOpen) setActiveTab("progress");
  };

  const handleChild = (tab: "recipe" | "workout") => {
    setActiveTab(tab);
    setRecOpen(true);
    if (mobileOpen) closeMobileMenu();
  };

  // Data Fetching  
  // Fetch 1: Macronutrients
  useEffect(() => {
    const fetchMacros = async () => {
      setLoadingMacros(true);
      setMacroError(false);
      try {
        const macroData = await apiFetch<MacroData>(`/ptf/macros?days=${macroRange}`);
        setMetrics(prev => ({ ...prev, macros: macroData }));
      } catch (err) {
        console.error(err); setMacroError(true); 
      } finally {
        setLoadingMacros(false);
      }
    };
    fetchMacros();
  }, [macroRange]);

  // Fetch 2: Calories Activity
  useEffect(() => {
    const fetchCalories = async () => {
      setLoadingCalories(true);
      setCaloriesError(false);
      try {
        const caloriesData = await apiFetch<CaloriesResponse>(`/ptf/calories?days=${caloriesRange}`);
        setMetrics(prev => ({ 
          ...prev, 
          caloriesActivity: caloriesData.history,
          goals: { ...prev.goals, calorieGoal: caloriesData.goal }
        }));
      } catch (err) { 
        console.error(err); 
        setCaloriesError(true); 
      } finally {
        setLoadingCalories(false);
      }
    };
    fetchCalories();
  }, [caloriesRange]);

  // Fetch 3: Weekly Insights
  const hasFetchedInsights = useRef(false);

  useEffect(() => {
    if (hasFetchedInsights.current) return;
    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        hasFetchedInsights.current = true; 
        const response = await apiFetch<InsightResponse>(`/ptf/insights`);
        setInsight(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, []);

  // Fetch 4: Workouts Data
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const workoutData = await apiFetch<WorkoutData[]>(`/ptf/workout`);
        setMetrics(prev => ({ ...prev, workouts: workoutData }));
      } catch (err) { console.error(err); }
    };
    fetchWorkout();
  }, []);

  // Fetch 5: Streak Data
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await apiFetch<{ streakDays: number }>('/ptf/streak');
        setStreak(res.streakDays);
      } catch (err) { console.error(err); }
    };
    fetchStreak();
  }, []);

  // Fetch 6: Recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (activeTab === 'recipe' && recRecipes.length === 0) {
        setLoadingRecs(true);
        try {
          const res = await apiFetch<{ recommendations: ResourceItem[] }>('/ptf/recommendationRecipes');
          setRecRecipes(res.recommendations);
        } catch (e) { console.error(e); } finally { setLoadingRecs(false); }
      }
      
      if (activeTab === 'workout' && recWorkouts.length === 0) {
        setLoadingRecs(true);
        try {
          const res = await apiFetch<{ recommendations: ResourceItem[] }>('/ptf/recommendationWorkouts');
          setRecWorkouts(res.recommendations);
        } catch (e) { console.error(e); } finally { setLoadingRecs(false); }
      }
    };
    fetchRecommendations();
  }, [activeTab]);

  const currentItems = activeTab === 'recipe' ? recRecipes : recWorkouts;
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = currentItems.slice(startIndex, startIndex + itemsPerPage);

  // Main content
  const renderContent = () => {
    if (activeTab === 'progress') {
      return (
        <>
          <section className="mb-6">
            {loadingInsights ? (
               <LoadingPlaceholder text="Generating insights..." minHeight="min-h-[150px]" />
            ) : (
               <InsightsCard insight={insight} />
            )}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="min-w-0 h-full">
              {loadingCalories ? (
                <LoadingPlaceholder text="Loading calories..." />
              ) : caloriesError ? (
                <FallbackCard title="Calories Unavailable" message="Could not load activity data." />
              ) : (
                <CaloriesCard
                  data={metrics.caloriesActivity}
                  goal={metrics.goals.calorieGoal}
                  rangeValue={caloriesRange}
                  onRangeChange={setCaloriesRange}
                />
              )}
            </div>

            <div className="flex flex-col gap-6 h-full">
              <div className="w-full">
                {loadingMacros ? (
                   <LoadingPlaceholder text="Loading macros..." />
                ) : macroError ? (
                  <FallbackCard title="Macros Unavailable" message="Could not load macronutrient data." />
                ) : (
                  <MacroCard 
                    data={metrics.macros} 
                    rangeDays={macroRange} 
                    onRangeChange={setMacroRange} 
                  />
                )}
              </div>
              <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-gray-800">{streak}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Days Streak</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">Workout Progress</h3>
            <LineChart data={metrics.workouts} />
          </section>
        </>
      );
    }

    if (activeTab === 'recipe' || activeTab === 'workout') {
      const currentItems = activeTab === 'recipe' ? recRecipes : recWorkouts;
      
      return (
        <div>
          {/* Header & Pagination Count */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
             <div>
               <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab} Recommendations</h2>
               <p className="mt-1 text-sm text-gray-600">
                  {loadingRecs ? "Loading..." : `${currentItems.length} items available`}
               </p>
             </div>

           {/* Top Pagination Controls */}
           {!loadingRecs && currentItems.length > 0 && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      if (!showPage) {
                        if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                            currentPage === page
                              ? "bg-[#2A4A2D] text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
           )}
          </div>
          
          <div className="mt-6">
            {loadingRecs ? (
               <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                  <span className="text-gray-500">Loading recommendations...</span>
               </div>
            ) : currentItems.length === 0 ? (
               <FallbackCard title="No Recommendations Available" message="Check back later for new recommendations." />
            ) : (
              <>
                {/* Grid of Items */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedItems.map((item) => (
                    <ResourceCard key={item.id} item={item} navigate={navigate} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen w-full p-4 lg:p-3 bg-cover bg-[#F5F7FA] flex justify-center">
      {/* Container */}
      <div className="w-full max-w-[1800px] lg:m-4 flex flex-col lg:flex-row gap-5 relative">

        {/* Mobile Menu */}
        <div className="lg:hidden flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={openMobileMenu}
            className="flex cursor-pointer items-center rounded-lg p-2 text-gray-600 bg-white border border-gray-200 shadow-sm transition-colors hover:bg-lime-50"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === 'progress' ? 'Progress Dashboard' :
             activeTab === 'recipe' ? 'Recipe Recommendations' :
             activeTab === 'workout' ? 'Workout Recommendations' : 'Dashboard'}
          </h1>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white rounded-2xl p-4 border border-gray-200 h-fit sticky top-4 z-10 ">
          <div>
            <SidebarContent
              activeTab={activeTab}
              recOpen={recOpen}
              onProgress={handleProgress}
              onRecToggle={handleRecommendation}
              onChildClick={handleChild}
            />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[150] lg:hidden">
            {/* Backdrop */}
            <button
              type="button"
              onClick={closeMobileMenu}
              className={`fixed inset-0 bg-black w-full h-full cursor-default transition-opacity duration-300 ${mobileAnimating ? "opacity-25" : "opacity-0"
                }`}
              aria-label="Close menu"
            />

            {/* Sidebar Panel */}
            <nav
              className={`fixed bottom-0 left-0 top-0 flex w-[280px] flex-col overflow-y-auto bg-white shadow-2xl rounded-r-2xl p-5 transition-transform duration-300 ease-out ${mobileAnimating ? "translate-x-0" : "-translate-x-full"
                }`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <span className="font-bold text-lg text-gray-800">Menu</span>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <SidebarContent
                activeTab={activeTab}
                recOpen={recOpen}
                onProgress={handleProgress}
                onRecToggle={handleRecommendation}
                onChildClick={handleChild}
              />
            </nav>
          </div>
        )}

        {/* MAIN CONTAINER CSS */}
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

const INITIAL_METRICS: MetricsResponse = {
    rangeDays: 7,
    caloriesActivity: [],
    macros: {
      current: { totalCalories: 0, carbs: 0, protein: 0, fat: 0 },
      previous: { totalCalories: 0, carbs: 0, protein: 0, fat: 0 },
      deltaPercent: { calories: 0, carbs: 0, protein: 0, fat: 0 },
    },
    workouts: [],
    goals: { 
      hasGoal: false, 
      calorieGoal: null,
    },
  };