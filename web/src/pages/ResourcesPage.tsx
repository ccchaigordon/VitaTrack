import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  image_url?: string;
  dietary_tags?: string[];
};

type RecipeResponse = {
  recipe_id: string;
  title: string;
  procedure?: string;
  image_url?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  dietary_tags?: string[];
  cooking_time?: number;
  ingredients?: string[];
};

type WellnessResourceResponse = {
  resource_id: string;
  title: string;
  description?: string;
  source_url: string;
  type?: string;
};

export default function ResourcesPage() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<ResourceItem[]>([]);
  const [articles, setArticles] = useState<ResourceItem[]>([]);
  const [tutorials, setTutorials] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Map URL category to Category type
  const getCategoryFromUrl = (urlCategory?: string): Category => {
    const normalized = urlCategory?.toLowerCase();
    if (normalized === "recipes") return "Recipes";
    if (normalized === "tutorials") return "Tutorials";
    return "Articles"; // default
  };

  const activeTab = getCategoryFromUrl(category);

  // Update URL if no category is specified (default to Articles)
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
        // Fetch recipes
        const recipesRes = await getRecipes();
        const recipesData: ResourceItem[] =
          (recipesRes.recipes as RecipeResponse[])?.map((recipe) => ({
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
          })) || [];
        setRecipes(recipesData);

        // Fetch articles - filters wellness_resources where type contains "Article"
        const articlesRes = await getResources(null, null, "Article");
        const articlesData: ResourceItem[] =
          (articlesRes.resources as WellnessResourceResponse[])?.map(
            (resource) => ({
              id: resource.resource_id,
              title: resource.title,
              summary:
                resource.description || "Read this article to learn more",
              badge: "Article",
              link: resource.source_url,
              content: resource.description,
              isRecipe: false,
            })
          ) || [];
        setArticles(articlesData);

        // Fetch tutorials - filters wellness_resources where type contains "Video"
        // The backend uses ilike('%Video%') for case-insensitive partial matching
        const tutorialsRes = await getResources(null, null, "Video");
        const tutorialsData: ResourceItem[] =
          (tutorialsRes.resources as WellnessResourceResponse[])?.map(
            (resource) => ({
              id: resource.resource_id,
              title: resource.title,
              summary:
                resource.description || "Watch this tutorial to learn more",
              badge: "Tutorial",
              link: resource.source_url,
              content: resource.description,
              isRecipe: false,
            })
          ) || [];
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

  // Get all unique tags from recipes (case-insensitive)
  const allTags = useMemo(() => {
    const normalizedToOriginal = new Map<string, string>();
    recipes.forEach((recipe) => {
      recipe.dietary_tags?.forEach((tag) => {
        const normalized = tag.toLowerCase();
        // Keep the first occurrence of each normalized tag
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
  }, [recipes]);

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

    // Apply tag filter
    if (activeTab === "Recipes" && selectedTags.length > 0) {
      items = items.filter((item) => {
        if (!item.dietary_tags || item.dietary_tags.length === 0) return false;
        const itemTagsNormalized = item.dietary_tags.map((tag) =>
          tag.toLowerCase()
        );
        return selectedTags.every((selectedTag) =>
          itemTagsNormalized.includes(selectedTag.toLowerCase())
        );
      });
    }

    return items;
  }, [activeTab, searchQuery, selectedTags, RESOURCES]);

  // Pagination: 3 rows per page
  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when category, search, or tags change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedTags]);

  // Clear tag filters when switching away from Recipes tab
  useEffect(() => {
    if (activeTab !== "Recipes") {
      setSelectedTags([]);
    }
  }, [activeTab]);

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

                {/* Tag Filter */}
                {activeTab === "Recipes" && allTags.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Filter by Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => {
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
                                // Check if a case variant is already selected
                                const hasVariant = selectedTags.some(
                                  (t) => t.toLowerCase() === tagNormalized
                                );
                                if (!hasVariant) {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }
                              setCurrentPage(1); // Reset to first page when filter changes
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
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedTags([]);
                          setCurrentPage(1);
                        }}
                        className="mt-4 text-xs text-[#2A4A2D] hover:text-[#1A381D] hover:underline font-medium cursor-pointer"
                      >
                        Clear filters
                      </button>
                    )}
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {loading
                    ? "Loading resources..."
                    : `${filteredItems.length} ${
                        filteredItems.length === 1 ? "resource" : "resources"
                      } available`}
                </p>
              </div>
              {/* Pagination Controls */}
              {!loading && filteredItems.length > 0 && totalPages > 1 && (
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
