import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { getPersonalizedFeed } from "../services/healthApi";
import { apiFetch } from "../services/api";
import type {
  ResourceItem,
  RecipeResponse,
  WellnessResourceResponse,
} from "../services/resources";
import motivationalQuotes from "../data/motivationalQuotes.json";

// Get time-based greeting and background image
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: "Good morning", image: "/src/assets/Home/morning.png" };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good afternoon",
      image: "/src/assets/Home/afternoon.png",
    };
  } else if (hour >= 17 && hour < 19) {
    return {
      greeting: "Good evening",
      image: "/src/assets/Home/evening.png",
    };
  } else {
    return { greeting: "Good night", image: "/src/assets/Home/night.png" };
  }
}

// Get random quote
function getRandomQuote(): string {
  const quotes = motivationalQuotes as string[];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Mini Recipe Card for carousel
function MiniRecipeCard({
  item,
  navigate,
}: {
  item: ResourceItem;
  navigate: (path: string) => void;
}) {
  const handleClick = () => {
    if (item.isRecipe) {
      navigate(`/resources/recipes/${item.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 w-full h-full min-h-[380px] cursor-pointer hover:border-[#2A4A2D] hover:shadow-sm transition-all"
    >
      <div className="relative mb-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-32 object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-32 bg-[#DDF3D8] rounded-md flex items-center justify-center">
            <span className="text-xs font-medium text-[#1A381D]">Recipe</span>
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-md bg-[#2A4A2D] px-2 py-0.5 text-xs font-medium text-white">
          Recipe
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-10 hover:text-[#2A4A2D]">
        {item.title}
      </h3>
      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2 min-h-5">
        {item.calories && <span>{item.calories} cal</span>}
        {item.cooking_time && (
          <span>• {item.cooking_time} min preparation</span>
        )}
      </div>
      <p className="text-xs text-gray-600 line-clamp-2 flex-1 mb-3 min-h-10">
        {item.summary}
      </p>
      <div className="text-xs font-medium text-[#2A4A2D] hover:text-[#1A381D] hover:underline mt-auto">
        View recipe →
      </div>
    </div>
  );
}

// Mini Article/Tutorial Card
function MiniContentCard({ item }: { item: ResourceItem }) {
  const handleClick = () => {
    if (item.link) {
      window.open(item.link, "_blank");
    }
  };

  const isTutorial = item.badge === "Tutorial";
  const imageSrc = isTutorial
    ? "/src/assets/Home/tutorial.jpg"
    : "/src/assets/Home/health.png";

  return (
    <div
      onClick={handleClick}
      className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 w-full h-full min-h-[380px] cursor-pointer hover:border-[#2A4A2D] hover:shadow-sm transition-all"
    >
      <div className="relative mb-3">
        <img
          src={imageSrc}
          alt={item.badge}
          className="w-full h-32 object-cover rounded-md"
        />
        <span className="absolute top-2 left-2 rounded-md bg-[#2A4A2D] px-2 py-0.5 text-xs font-medium text-white">
          {item.badge}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-10 hover:text-[#2A4A2D]">
        {item.title}
      </h3>
      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2 min-h-5">
        {isTutorial ? (
          <>
            <span>Video</span>
            <span>•</span>
            <span>External link</span>
          </>
        ) : (
          <>
            <span>External link</span>
            <span>•</span>
            <span>~5 min read</span>
          </>
        )}
      </div>
      <p className="text-xs text-gray-600 line-clamp-2 flex-1 mb-3 min-h-10">
        {item.summary}
      </p>
      <div className="text-xs font-medium text-[#2A4A2D] hover:text-[#1A381D] hover:underline mt-auto">
        Read more →
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { me, loading: userLoading } = useUser();
  const userId = me?.user?.user_id || "";

  const [personalizedPicks, setPersonalizedPicks] = useState<ResourceItem[]>(
    []
  );
  const [loadingPicks, setLoadingPicks] = useState(true);
  const [quote] = useState(() => getRandomQuote());
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([
    {
      role: "assistant",
      text: "Hello, anything I can help you with today?",
    },
  ]);
  const [todayMetrics, setTodayMetrics] = useState<{
    calories: number;
    caloriesGoal: number;
    workouts: number;
    workoutsGoal: number;
    protein: number;
    proteinGoal: number;
  } | null>(null);
  const [loadingToday, setLoadingToday] = useState(true);

  const timeOfDay = useMemo(() => getTimeOfDay(), []);

  // Fetch personalized picks
  useEffect(() => {
    if (!userId) return;

    const fetchPicks = async () => {
      setLoadingPicks(true);
      try {
        const feed = await getPersonalizedFeed(userId, "all");
        const feedResources =
          (feed.resources as (RecipeResponse | WellnessResourceResponse)[]) ||
          [];

        const recipeItems: ResourceItem[] = feedResources
          .filter((item) => "recipe_id" in item)
          .map((recipe: RecipeResponse) => ({
            id: recipe.recipe_id,
            title: recipe.title,
            summary:
              recipe.procedure?.substring(0, 100) + "..." || "Delicious recipe",
            badge: "Recipe",
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            category: recipe.dietary_tags?.join(", ") || "Recipe",
            content: recipe.procedure,
            cooking_time: recipe.cooking_time,
            ingredients: recipe.ingredients,
            image_url: recipe.image_url,
            dietary_tags: recipe.dietary_tags || [],
            isRecipe: true,
          }));

        const wellnessItems = feedResources.filter(
          (item): item is WellnessResourceResponse =>
            "resource_id" in item || ("type" in item && item.type !== undefined)
        );

        const articlesData: ResourceItem[] = wellnessItems
          .filter((resource) =>
            (resource.type || "").toLowerCase().includes("article")
          )
          .map((resource) => ({
            id: resource.resource_id,
            title: resource.title,
            summary: resource.description || "Read this article to learn more",
            badge: "Article",
            link: resource.source_url,
            content: resource.description,
            isRecipe: false,
            category_tags: resource.category_tags || [],
          }));

        const tutorialsData: ResourceItem[] = wellnessItems
          .filter((resource) => {
            const type = (resource.type || "").toLowerCase();
            return type.includes("video");
          })
          .map((resource) => ({
            id: resource.resource_id,
            title: resource.title,
            summary:
              resource.description || "Watch this tutorial to learn more",
            badge: "Tutorial",
            link: resource.source_url,
            content: resource.description,
            isRecipe: false,
            category_tags: resource.category_tags || [],
          }));

        const picks: ResourceItem[] = [];

        if (recipeItems.length > 0) {
          const shuffledRecipes = [...recipeItems].sort(
            () => Math.random() - 0.5
          );
          picks.push(...shuffledRecipes.slice(0, 2));
        }

        if (articlesData.length > 0) {
          picks.push(
            articlesData[Math.floor(Math.random() * articlesData.length)]
          );
        }

        if (tutorialsData.length > 0) {
          picks.push(
            tutorialsData[Math.floor(Math.random() * tutorialsData.length)]
          );
        }

        setPersonalizedPicks(picks);
      } catch (err) {
        console.error("Failed to fetch personalized picks:", err);
      } finally {
        setLoadingPicks(false);
      }
    };

    fetchPicks();
  }, [userId]);

  // Fetch today's metrics
  useEffect(() => {
    if (!userId) return;

    const fetchTodayMetrics = async () => {
      setLoadingToday(true);
      try {
        const todayData = await apiFetch<{
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          caloriesBurned: number;
          workoutCount: number;
          burnGoal: number | null;
        }>(`/ptf/today`);

        const caloriesGoal = 2000;
        const proteinGoal = 150;
        const workoutsGoal = 1;

        setTodayMetrics({
          calories: Math.round(todayData.calories || 0),
          caloriesGoal,
          workouts: todayData.workoutCount || 0,
          workoutsGoal,
          protein: Math.round(todayData.protein || 0),
          proteinGoal,
        });
      } catch (err) {
        console.error("Failed to fetch today's metrics:", err);
        setTodayMetrics({
          calories: 0,
          caloriesGoal: 2000,
          workouts: 0,
          workoutsGoal: 1,
          protein: 0,
          proteinGoal: 150,
        });
      } finally {
        setLoadingToday(false);
      }
    };

    fetchTodayMetrics();
  }, [userId]);

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: chatInput.trim() },
    ]);
    // Navigate to chatbot with the message as query parameter
    navigate(`/chatbot?message=${encodeURIComponent(chatInput)}`);
    setChatInput("");
  };

  const getDisplayName = () => {
    const username = me?.user?.username?.trim();
    if (username) return username;
    const email = me?.user?.email?.trim();
    if (email) return email.split("@")[0];
    return "there";
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .plan-badge-gradient {
          position: relative;
          z-index: 0;
        }
        .plan-badge-gradient::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1.5px;
          border-radius: 6px;
          background: linear-gradient(180deg, #CCDDF9 45%, #C1B7FF 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: -1;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div
            className="flex items-center mb-6 rounded-lg border border-gray-200 overflow-hidden relative"
            style={{
              backgroundImage: `url(${timeOfDay.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: "200px",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)",
              }}
            ></div>

            {/* Content */}
            <div className="relative px-6 md:px-10 text-white">
              <h1 className="text-xl md:text-2xl font-bold mb-3">
                {timeOfDay.greeting}, {getDisplayName()}!
              </h1>
              <p className="text-xs md:text-sm mb-4">"{quote}"</p>
              <button
                onClick={() => navigate("/progress")}
                className="px-5 py-1.5 rounded-lg text-sm font-semibold bg-transparent text-white cursor-pointer border border-white/40"
              >
                View Progress
              </button>
            </div>
          </div>

          {/* Chat Input & Quick Actions Row */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Section */}
            <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-[#2A4A2D] px-6 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="/vita.png"
                      alt="Vita"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-semibold text-sm">
                        Vita
                      </div>
                      <span className="relative rounded-md bg-black/20 px-2 text-[10px] font-semibold text-[#34A853] plan-badge-gradient">
                        AI
                      </span>
                    </div>
                    <div className="text-white/85 font-normal text-[11px]">
                      Your personalized AI dietitian
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/chatbot")}
                  className="flex items-center gap-1.5 text-white text-xs font-medium hover:text-gray-200 transition-colors cursor-pointer px-3 py-1.5 rounded-md border border-white/30"
                >
                  Expand
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3,5h4V3H1v12h12V9h-2v4H3V5z M16,8V0L8,0v2h4.587L6.294,8.294l1.413,1.413L14,3.413V8H16z" />
                  </svg>
                </button>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto bg-white px-4 py-4 flex flex-col gap-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-full text-sm ${
                        msg.role === "user"
                          ? "bg-[#2A4A2D] text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Row */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleChatSend()
                    }
                    placeholder="Ask Vita anything..."
                    className="flex-1 min-w-0 outline-none text-gray-700 text-sm bg-white border border-gray-300 rounded-lg px-4 py-2 placeholder:text-gray-400 focus:border-[#2A4A2D] focus:ring-1 focus:ring-[#2A4A2D]"
                  />
                  <button
                    className="cursor-pointer w-10 h-10 rounded-full bg-[#2A4A2D] hover:bg-[#1A381D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-md"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                    aria-label="Send message"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white"
                    >
                      <path
                        d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="lg:col-span-1 relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6">
              <div className="relative flex h-full flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Today at a glance
                  </h3>
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                  {/* Calories */}
                  <div className="rounded-xl border border-gray-200 bg-white/70 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Calories
                      </span>
                      <span className="text-xs text-gray-500">
                        {loadingToday
                          ? "..."
                          : todayMetrics
                          ? `${todayMetrics.calories} / ${todayMetrics.caloriesGoal} kcal`
                          : "0 / 2000 kcal"}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#2A4A2D] to-[#4A7C59] transition-all duration-300"
                        style={{
                          width: loadingToday
                            ? "0%"
                            : todayMetrics
                            ? `${Math.min(
                                (todayMetrics.calories /
                                  todayMetrics.caloriesGoal) *
                                  100,
                                100
                              )}%`
                            : "0%",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Workouts */}
                  <div className="rounded-xl border border-gray-200 bg-white/70 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">
                        Workouts
                      </span>
                      <span className="text-xs text-gray-500">
                        {loadingToday
                          ? "..."
                          : todayMetrics
                          ? `${todayMetrics.workouts} / ${todayMetrics.workoutsGoal}`
                          : "0 / 1"}
                      </span>
                    </div>
                  </div>

                  {/* Protein */}
                  <div className="rounded-xl border border-gray-200 bg-white/70 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Protein
                      </span>
                      <span className="text-xs text-gray-500">
                        {loadingToday
                          ? "..."
                          : todayMetrics
                          ? `${todayMetrics.protein} / ${todayMetrics.proteinGoal} g`
                          : "0 / 150 g"}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#2A4A2D] to-[#4A7C59] transition-all duration-300"
                        style={{
                          width: loadingToday
                            ? "0%"
                            : todayMetrics
                            ? `${Math.min(
                                (todayMetrics.protein /
                                  todayMetrics.proteinGoal) *
                                  100,
                                100
                              )}%`
                            : "0%",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Picks */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recommended by Vita
              </h2>
              <button
                onClick={() => navigate("/resources")}
                className="text-sm text-[#2A4A2D] hover:text-[#1A381D] hover:underline font-medium cursor-pointer self-start sm:self-auto"
              >
                View more resources →
              </button>
            </div>
            {loadingPicks ? (
              <div className="text-sm text-gray-500">
                Loading recommendations...
              </div>
            ) : personalizedPicks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {personalizedPicks.map((item) =>
                  item.isRecipe ? (
                    <MiniRecipeCard
                      key={item.id}
                      item={item}
                      navigate={navigate}
                    />
                  ) : (
                    <MiniContentCard key={item.id} item={item} />
                  )
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No personalized recommendations available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
