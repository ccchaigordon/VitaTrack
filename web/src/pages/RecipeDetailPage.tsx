import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRecipeDetails } from "../services/healthApi";

interface RecipeDetail {
  recipe_id: string;
  title: string;
  image_url?: string;
  procedure: string;
  source_url?: string;
  ingredients: any[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  dietary_tags: string[];
  cooking_time?: number;
}

export default function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) {
        setError("Recipe ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getRecipeDetails(recipeId);
        if (response.recipe) {
          setRecipe(response.recipe);
        } else {
          setError("Recipe not found");
        }
      } catch (err) {
        console.error("Failed to fetch recipe:", err);
        setError("Failed to load recipe details");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfcf0]">
        <div className="text-gray-600 text-lg">Loading recipe...</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdfcf0] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || "Recipe not found"}</p>
          <button
            onClick={() => navigate("/resources", { state: { activeTab: "Recipes" } })}
            className="px-6 py-2 bg-lime-800 text-white rounded-lg hover:bg-lime-900 transition"
          >
            Back to Resources
          </button>
        </div>
      </div>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : recipe.ingredients && typeof recipe.ingredients === "object"
      ? Object.values(recipe.ingredients)
      : [];

  return (
    <div className="min-h-screen bg-[#fdfcf0] p-6 sm:p-8">
      <button
        onClick={() => navigate("/resources", { state: { activeTab: "Recipes" } })}
        className="mb-6 inline-flex items-center text-lime-800 hover:text-lime-900 font-medium"
      >
        ← Back to Resources
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.title}</h1>
          
          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-96 object-cover rounded-2xl shadow-lg mb-6"
            />
          )}

          {/* Nutrition Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-lime-800">
                {recipe.calories || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Calories</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {recipe.protein || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Protein (g)</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">
                {recipe.carbs || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Carbs (g)</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-red-600">
                {recipe.fat || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Fat (g)</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">
                {recipe.cooking_time || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Minutes</div>
            </div>
          </div>

          {/* Tags */}
          {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {recipe.dietary_tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-lime-100 text-lime-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
              <ul className="space-y-3">
                {ingredients.length > 0 ? (
                  ingredients.map((ingredient, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-lime-100 text-lime-700 text-xs font-semibold flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{String(ingredient)}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No ingredients listed</p>
                )}
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
              {recipe.procedure && recipe.procedure.trim() ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {recipe.procedure}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">📖</div>
                  <p className="text-gray-600 mb-4">
                    Instructions for this recipe are currently unavailable.
                  </p>
                  {recipe.source_url && (
                    <a
                      href={recipe.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-lime-800 text-white rounded-lg hover:bg-lime-900 transition font-medium"
                    >
                      <span>View Original Recipe</span>
                      <span>→</span>
                    </a>
                  )}
                </div>
              )}
              
              {/* External Source Link */}
              {recipe.procedure && recipe.procedure.trim() && recipe.source_url && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-lime-700 hover:text-lime-800 font-medium"
                  >
                    <span>View Original Recipe</span>
                    <span className="text-sm">↗</span>
                  </a>
                </div>
              )}
            </div>

            {/* Nutrition Breakdown (Visual) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Macronutrient Breakdown</h2>
              <div className="space-y-4">
                {/* Protein Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Protein</span>
                    <span className="text-sm font-bold text-blue-600">
                      {recipe.protein || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((recipe.protein || 0) / 100) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Carbs Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Carbohydrates</span>
                    <span className="text-sm font-bold text-orange-600">
                      {recipe.carbs || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((recipe.carbs || 0) / 100) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Fat Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Fat</span>
                    <span className="text-sm font-bold text-red-600">
                      {recipe.fat || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((recipe.fat || 0) / 50) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
