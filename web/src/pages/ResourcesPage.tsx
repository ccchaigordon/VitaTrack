import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecipes, getResources } from "../services/healthApi";

type Category = "Articles" | "Recipes" | "Tutorials";

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
};

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Category>("Articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<ResourceItem[]>([]);
  const [articles, setArticles] = useState<ResourceItem[]>([]);
  const [tutorials, setTutorials] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch recipes
        const recipesRes = await getRecipes();
        const recipesData = recipesRes.recipes?.map((recipe: any) => ({
          id: recipe.recipe_id,
          title: recipe.title,
          summary: recipe.procedure?.substring(0, 100) + "..." || "Delicious recipe",
          badge: recipe.calories ? `${recipe.calories} kcal` : "Recipe",
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          category: recipe.dietary_tags?.join(", ") || "Recipe",
          content: recipe.procedure,
          cooking_time: recipe.cooking_time,
          ingredients: recipe.ingredients,
          isRecipe: true
        })) || [];
        setRecipes(recipesData);

        // Fetch articles
        const articlesRes = await getResources(null, null, "Article");
        const articlesData = articlesRes.resources?.map((resource: any) => ({
          id: resource.resource_id,
          title: resource.title,
          summary: resource.description || "Read this article to learn more",
          badge: "Article",
          link: resource.source_url,
          content: resource.description,
          isRecipe: false
        })) || [];
        setArticles(articlesData);

        // Fetch tutorials
        const tutorialsRes = await getResources(null, null, "Video");
        const tutorialsData = tutorialsRes.resources?.map((resource: any) => ({
          id: resource.resource_id,
          title: resource.title,
          summary: resource.description || "Watch this tutorial to learn more",
          badge: "Tutorial",
          link: resource.source_url,
          content: resource.description,
          isRecipe: false
        })) || [];
        setTutorials(tutorialsData);

      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const RESOURCES: Record<Category, ResourceItem[]> = {
    Articles: articles,
    Recipes: recipes,
    Tutorials: tutorials,
  };

function ResourceCard({ item, navigate }: { item: ResourceItem; navigate: (path: string) => void }) {
  const handleCardClick = () => {
    if (item.isRecipe) {
      navigate(`/recipe/${item.id}`);
    } else if (item.link) {
      window.open(item.link, "_blank");
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        item.isRecipe ? "cursor-pointer" : item.link ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 whitespace-nowrap">
          {item.badge}
        </span>
      </div>

      {/* Recipe Card: Show Macros */}
      {item.isRecipe && (
        <div className="mb-4 grid grid-cols-4 gap-2">
          <div className="bg-lime-50 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-lime-700">{item.calories || 0}</div>
            <div className="text-xs text-gray-600">Calories</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-blue-600">{item.carbs || 0}g</div>
            <div className="text-xs text-gray-600">Carbs</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-orange-600">{item.protein || 0}g</div>
            <div className="text-xs text-gray-600">Protein</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-red-600">{item.fat || 0}g</div>
            <div className="text-xs text-gray-600">Fat</div>
          </div>
        </div>
      )}

      {/* Recipe Card: Show Ingredients and Cooking Time */}
      {item.isRecipe && (
        <div className="mb-4 space-y-2">
          {item.cooking_time && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">⏱️</span>
              <span>{item.cooking_time} minutes</span>
            </div>
          )}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-lg">🥘</span>
              <span>{item.ingredients.length} ingredients</span>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-gray-600 mb-3">{item.summary}</p>

      {/* External Link for Articles/Tutorials */}
      {!item.isRecipe && item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View More →
        </a>
      )}

      {/* Recipe Card: Click to View Full Recipe */}
      {item.isRecipe && (
        <div className="text-sm font-medium text-blue-600 hover:text-blue-700">
          View Full Recipe →
        </div>
      )}
    </div>
  );
}

  const filteredItems = useMemo(() => {
    const items = RESOURCES[activeTab];
    if (!searchQuery.trim()) return items;
    
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery, RESOURCES]);

  return (
    <div className="flex min-h-screen bg-[#fdfcf0] p-6 sm:p-8">
      <div className="w-64 shrink-0 border-r border-gray-200 pr-6 sm:pr-8">
        <h2 className="mb-6 text-xl font-bold text-gray-800">Category</h2>
        <nav className="space-y-3">
          {(["Articles", "Recipes", "Tutorials"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`w-full rounded-xl p-4 text-left transition-all duration-150 ${
                activeTab === cat
                  ? "bg-lime-800 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="font-semibold">{cat}</div>
              <div className="mt-0.5 text-xs opacity-80">
                {RESOURCES[cat].length} items
              </div>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 pl-6 sm:pl-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{activeTab}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {loading ? "Loading..." : `${filteredItems.length} resources available`}
            </p>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading resources...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources found</h3>
            <p className="text-gray-500">
              {searchQuery ? "Try a different search term" : "No resources available yet"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {filteredItems.map((item) => (
              <ResourceCard key={item.id} item={item} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}