import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPersonalizedFeed } from "../services/healthApi";
import { useUser } from "../contexts/UserContext";
import type {
  ResourceItem,
  RecipeResponse,
  WellnessResourceResponse,
} from "../services/resources";

type Category = "Articles" | "Recipes" | "Tutorials";

// Component to handle image rendering and fallbacks safely
function RecipeImage({ imageUrl, title }: { imageUrl: string; title: string }) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !imageUrl) {
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

// Card component to display individual items
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
          <MacroBox label="Cal" value={item.calories} />
          <MacroBox
            label="Carbs"
            value={item.carbs}
            suffix="g"
            color="bg-[#E8F5E3] text-[#2A4A2D]"
          />
          <MacroBox label="Protein" value={item.protein} suffix="g" />
          <MacroBox
            label="Fat"
            value={item.fat}
            suffix="g"
            color="bg-[#E8F5E3] text-[#2A4A2D]"
          />
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

// Helper for macros display in recipe cards
type MacroBoxProps = {
  label: string;
  value: number | undefined;
  suffix?: string;
  color?: string;
};

const MacroBox = ({
  label,
  value,
  suffix = "",
  color = "bg-[#DDF3D8] text-[#1A381D]",
}: MacroBoxProps) => (
  <div className={`${color} rounded-md p-2.5 text-center`}>
    <div className={`text-sm font-semibold`}>
      {value || 0}
      {suffix}
    </div>
    <div className="text-xs text-gray-600 mt-0.5">{label}</div>
  </div>
);

// Main Resources Page Component
export default function ResourcesPage() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { me } = useUser();
  const userId = me?.user?.user_id || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recipes, setRecipes] = useState<ResourceItem[]>([]);
  const [articles, setArticles] = useState<ResourceItem[]>([]);
  const [tutorials, setTutorials] = useState<ResourceItem[]>([]);
  const [visibleTagsCount, setVisibleTagsCount] = useState(10);

  // Map URL category to Category type (articles, recipes, tutorials)
  const getCategoryFromUrl = (urlCategory?: string): Category => {
    const normalized = urlCategory?.toLowerCase();
    if (normalized === "recipes") return "Recipes";
    if (normalized === "tutorials") return "Tutorials";
    return "Articles"; // default
  };
  const activeTab = getCategoryFromUrl(category);

  // Redirect if url is empty (default to Articles)
  useEffect(() => {
    if (!category) {
      navigate("/resources/articles", { replace: true });
    }
  }, [category, navigate]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch personalized feed (recipes + wellness resources)
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

        setRecipes(recipeItems);
        setArticles(articlesData);
        setTutorials(tutorialsData);
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Update URL when category changes
  const handleCategoryChange = (newCategory: Category) => {
    const categoryPath = newCategory.toLowerCase();
    navigate(`/resources/${categoryPath}`, { replace: true });
  };

  const RESOURCES = useMemo<Record<Category, ResourceItem[]>>(
    () => ({
      Articles: articles,
      Recipes: recipes,
      Tutorials: tutorials,
    }),
    [articles, recipes, tutorials]
  );

  // Get all unique tags (category_tags + dietary_tags) for the active tab
  const allTags = useMemo(() => {
    const normalizedToOriginal = new Map<string, string>();
    RESOURCES[activeTab].forEach((item) => {
      const tags = [
        ...(item.category_tags || []),
        ...(item.dietary_tags || []),
      ];
      tags.forEach((tag) => {
        const normalized = tag.toLowerCase();
        // Ensure consistent capitalization for tags differing only by case
        if (!normalizedToOriginal.has(normalized)) {
          normalizedToOriginal.set(normalized, tag);
        } else {
          const existing = normalizedToOriginal.get(normalized)!;
          if (
            tag.charAt(0) === tag.charAt(0).toUpperCase() &&
            existing.charAt(0) !== existing.charAt(0).toUpperCase()
          ) {
            normalizedToOriginal.set(normalized, tag);
          }
        }
      });
    });
    return Array.from(normalizedToOriginal.values()).sort();
  }, [RESOURCES, activeTab]);

  // Filter items based on search query and selected tags
  const filteredItems = useMemo(() => {
    let items = RESOURCES[activeTab];

    // Apply search filter
    if (searchQuery.trim()) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tag filter (category_tags + dietary_tags)
    if (selectedTags.length > 0) {
      items = items.filter((item) => {
        const itemTags = [
          ...(item.category_tags || []),
          ...(item.dietary_tags || []),
        ].map((tag) => tag.toLowerCase());

        if (itemTags.length === 0) return false;

        return selectedTags.every((selectedTag) =>
          itemTags.includes(selectedTag.toLowerCase())
        );
      });
    }

    return items;
  }, [RESOURCES, activeTab, searchQuery, selectedTags]);

  // Pagination
  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when category, search, or tags change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedTags]);

  // Reset tags when switching categories to avoid stale filters
  useEffect(() => {
    setSelectedTags([]);
    setVisibleTagsCount(10); // Reset visible tags count when switching categories
  }, [activeTab]);

  // Render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-screen sm:max-w-[95vw] xl:max-w-[85vw] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 lg:self-start">
            <div className="lg:sticky lg:top-8 space-y-4">
              {/* Search Bar - Fixed above sidebar */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-[#2A4A2D] focus:outline-none focus:ring-1 focus:ring-[#2A4A2D]"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Tag Filter (category + dietary) */}
                {allTags.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Filter by Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.slice(0, visibleTagsCount).map((tag) => {
                        const tagNormalized = tag.toLowerCase();
                        const isSelected = selectedTags.some(
                          (selectedTag) =>
                            selectedTag.toLowerCase() === tagNormalized
                        );
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags(
                                  selectedTags.filter(
                                    (t) => t.toLowerCase() !== tagNormalized
                                  )
                                );
                              } else {
                                const hasVariant = selectedTags.some(
                                  (t) => t.toLowerCase() === tagNormalized
                                );
                                if (!hasVariant) {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }
                              setCurrentPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                              isSelected
                                ? "bg-[#2A4A2D] text-white"
                                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {allTags.length > visibleTagsCount && (
                        <button
                          onClick={() => {
                            setVisibleTagsCount((prev) =>
                              Math.min(prev + 10, allTags.length)
                            );
                          }}
                          className="text-xs text-[#2A4A2D] hover:text-[#1A381D] hover:underline font-medium cursor-pointer"
                        >
                          Show more
                        </button>
                      )}
                      {selectedTags.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedTags([]);
                            setCurrentPage(1);
                        }}
                          className="w-full text-xs text-[#2A4A2D] hover:text-[#1A381D] hover:underline font-medium cursor-pointer text-left"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="mb-4 text-base font-semibold text-gray-900">
                  Categories
                </h2>
                <nav className="space-y-1">
                  {(["Articles", "Recipes", "Tutorials"] as Category[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`w-full rounded-md px-3 py-2.5 text-left ${
                          activeTab === cat
                            ? "bg-[#2A4A2D] text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-sm font-medium">{cat}</div>
                        <div
                          className={`text-xs mt-0.5 ${
                            activeTab === cat
                              ? "text-white/80"
                              : "text-gray-500"
                          }`}
                        >
                          {RESOURCES[cat].length}{" "}
                          {RESOURCES[cat].length === 1 ? "item" : "items"}
                        </div>
                      </button>
                    )
                  )}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl text-center sm:text-left font-bold text-gray-900">
                  {activeTab}
                </h1>
                <p className="mt-1 text-sm text-center sm:text-left text-gray-600">
                  {loading
                    ? "Loading resources..."
                    : `${filteredItems.length} ${
                        filteredItems.length === 1 ? "resource" : "resources"
                      } available`}
                </p>
              </div>
              {/* Pagination Controls */}
              {!loading && filteredItems.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center md:justify-start gap-1 md:gap-2 overflow-x-auto">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-0.5 md:gap-1">
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
                              <span
                                key={page}
                                className="px-1 sm:px-2 text-gray-500 shrink-0 text-xs md:text-sm"
                              >
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
                            className={`px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-medium rounded-md cursor-pointer shrink-0 ${
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
                    className="px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
                <div className="text-gray-500 text-sm">
                  Loading resources...
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No resources found
                </h3>
                <p className="text-sm text-gray-600">
                  {searchQuery
                    ? "Try a different search term"
                    : "No resources available yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {paginatedItems.map((item) => (
                    <ResourceCard
                      key={item.id}
                      item={item}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
