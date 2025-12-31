import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRecipeDetails } from "../services/healthApi";
import type { RecipeResponse } from "../services/resources";

export default function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
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
        if (response.recipe && typeof response.recipe === "object") {
          setRecipe(response.recipe as RecipeResponse);
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-lg">Loading recipe...</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || "Recipe not found"}</p>
          <button
            onClick={() => navigate("/resources/recipes")}
            className="px-6 py-2 bg-[#2A4A2D] text-white rounded-md hover:bg-[#1A381D] transition"
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

  // Format procedure text to ensure proper line breaks
  const formatProcedure = (text: string): string => {
    if (!text) return "";

    // Pattern: "1. text 2. text 3. text" -> each on new line
    let formatted = text.replace(/(\d+\.\s+)/g, (_match, p1, offset) => {
      // If this is not at the start and previous char is not a newline, add newline
      if (offset > 0 && text[offset - 1] !== "\n") {
        return "\n\n" + p1;
      }
      return p1;
    });

    // Also handle cases where there's text before a number
    formatted = formatted.replace(/([^\n])(\d+\.\s+)/g, "$1\n\n$2");

    // Split by double newlines first
    const paragraphs = formatted.split(/\n\s*\n/);
    if (paragraphs.length > 1) {
      return paragraphs
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .join("\n\n");
    }

    // If no double newlines, split by single newlines
    const lines = formatted.split(/\n/);
    if (lines.length > 1) {
      return lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n\n");
    }

    formatted = text.replace(/(\d+\.\s+[^0-9]+?)(?=\d+\.\s+|$)/g, "$1\n\n");
    return formatted.trim();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/resources/recipes")}
          className="mb-6 inline-flex items-center text-[#2A4A2D] hover:text-[#1A381D] font-medium text-sm hover:underline cursor-pointer"
        >
          ← Back to Recipes
        </button>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {recipe.title}
            </h1>

            {recipe.image_url && (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
                className="w-full h-80 object-cover rounded-lg border border-gray-200 mb-6"
              />
            )}

            {/* Nutrition Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-2xl font-bold text-[#2A4A2D]">
                  {recipe.calories || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Calories</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-2xl font-bold text-[#2A4A2D]">
                  {recipe.protein || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Protein (g)</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-2xl font-bold text-[#1A381D]">
                  {recipe.carbs || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Carbs (g)</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-2xl font-bold text-[#2A4A2D]">
                  {recipe.fat || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Fat (g)</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-2xl font-bold text-gray-700">
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
                    className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-medium border border-gray-200"
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
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Ingredients
                </h2>
                <ul className="space-y-3">
                  {ingredients.length > 0 ? (
                    ingredients.map((ingredient, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-gray-700"
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#DDF3D8] text-[#1A381D] text-xs font-semibold shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{String(ingredient)}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">
                      No ingredients listed
                    </p>
                  )}
                </ul>
              </div>
            </div>

            {/* Instructions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Instructions
                </h2>
                {recipe.procedure && recipe.procedure.trim() ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {formatProcedure(recipe.procedure)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Instructions for this recipe are currently unavailable.
                    </p>
                    {recipe.source_url && (
                      <a
                        href={recipe.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#2A4A2D] text-white rounded-md hover:bg-[#1A381D] transition font-medium"
                      >
                        <span>View Original Recipe</span>
                        <span>→</span>
                      </a>
                    )}
                  </div>
                )}

                {/* External Source Link */}
                {recipe.procedure &&
                  recipe.procedure.trim() &&
                  recipe.source_url && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <a
                        href={recipe.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#2A4A2D] hover:text-[#1A381D] font-medium text-sm"
                      >
                        <span>View Original Recipe</span>
                        <span className="text-sm">↗</span>
                      </a>
                    </div>
                  )}
              </div>

              {/* Nutrition Breakdown (Visual) */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Macronutrient Breakdown
                </h2>
                <div className="space-y-4">
                  {/* Protein Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Protein
                      </span>
                      <span className="text-sm font-bold text-[#2A4A2D]">
                        {recipe.protein || 0}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#2A4A2D] h-2 rounded-full"
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
                      <span className="text-sm font-semibold text-gray-700">
                        Carbohydrates
                      </span>
                      <span className="text-sm font-bold text-[#1A381D]">
                        {recipe.carbs || 0}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#1A381D] h-2 rounded-full"
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
                      <span className="text-sm font-semibold text-gray-700">
                        Fat
                      </span>
                      <span className="text-sm font-bold text-[#2A4A2D]">
                        {recipe.fat || 0}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#2A4A2D] h-2 rounded-full"
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
    </div>
  );
}
