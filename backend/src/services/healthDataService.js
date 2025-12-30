const supabaseServer = require("./supabaseClient");

// Map database row to recipe object
function mapRecipeRow(row) {
  const nutrition = row.nutrition_info || {};
  return {
    recipe_id: row.recipe_id,
    title: row.title,
    image_url: row.image_url,
    ingredients: row.ingredients,
    procedure: row.procedure,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    dietary_tags: row.dietary_tags,
    cooking_time: row.cooking_time,
    external_api_id: row.external_api_id,
  };
}

/**
 * Get recipes from database (current schema fields: title, nutrition_info, procedure)
 */
async function getRecipes(filters = {}, userAccessToken = null) {
  try {
    const client = userAccessToken
      ? supabaseServer.createUserSupabaseClient(userAccessToken)
      : supabaseServer;

    let query = client.from("recipes").select("*");

    if (filters.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }
    if (filters.dietaryRestriction) {
      query = query.contains("dietary_tags", [filters.dietaryRestriction]);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: (data || []).map(mapRecipeRow) };
  } catch (err) {
    console.error("Get recipes error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get single recipe by ID
 */
async function getRecipeById(recipeId, userAccessToken = null) {
  try {
    const client = userAccessToken
      ? supabaseServer.createUserSupabaseClient(userAccessToken)
      : supabaseServer;

    const { data, error } = await client
      .from("recipes")
      .select("*")
      .eq("recipe_id", recipeId)
      .single();

    if (error) throw error;
    return { success: true, data: mapRecipeRow(data) };
  } catch (err) {
    console.error("Get recipe by ID error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get wellness resources from database
 */
async function getWellnessResources(filters = {}, userAccessToken = null) {
  try {
    const client = userAccessToken
      ? supabaseServer.createUserSupabaseClient(userAccessToken)
      : supabaseServer;

    let query = client.from("wellness_resources").select("*");

    if (filters.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }
    if (filters.category) {
      query = query.contains("category_tags", [filters.category]);
    }
    if (filters.resourceType) {
      query = query.ilike("type", `%${filters.resourceType}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Get wellness resources error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get single wellness resource by ID
 */
async function getResourceById(resourceId, userAccessToken = null) {
  try {
    const client = userAccessToken
      ? supabaseServer.createUserSupabaseClient(userAccessToken)
      : supabaseServer;

    const { data, error } = await client
      .from("wellness_resources")
      .select("*")
      .eq("resource_id", resourceId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Get resource by ID error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get personalized content feed based on user's fitness profile
 */
async function getPersonalizedFeed(
  userId,
  contentType = "all",
  userAccessToken = null
) {
  try {
    const client = userAccessToken
      ? supabaseServer.createUserSupabaseClient(userAccessToken)
      : supabaseServer;

    // Fetch user profile to get diet type, goals, allergies
    const { data: userProfile, error: profileError } = await client
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) throw profileError;

    let finalResources = [];
    const type = contentType.toLowerCase(); // Normalize type for consistent checking

    // Check user allergies to exclude certain recipes
    // 1. Map allergies to dietary tags to exclude
    const allergies = userProfile.allergies
      ? userProfile.allergies.split(",")
      : [];
    const essentialTags = [];
    if (allergies.includes("Gluten")) essentialTags.push("Gluten Free");
    if (allergies.includes("Dairy")) essentialTags.push("Dairy Free");

    // 2. Map allergies to ingredient keywords to exclude
    let keywordsToExclude = [];
    allergies.forEach((a) => {
      const allergy = a.trim().toLowerCase();

      // Map Categories to actual ingredient names
      if (allergy === "shellfish") {
        keywordsToExclude.push(
          "shrimp",
          "prawn",
          "crab",
          "lobster",
          "clam",
          "mussel",
          "oyster"
        );
      } else if (allergy === "tree nuts") {
        keywordsToExclude.push(
          "almond",
          "cashew",
          "walnut",
          "pecan",
          "pistachio"
        );
      } else if (allergy === "peanuts") {
        keywordsToExclude.push("peanut", "pb2");
      } else if (allergy !== "gluten" && allergy !== "dairy") {
        keywordsToExclude.push(allergy); // Unknown allergies, direct text search ingredients
      }
    });

    // RECIPES
    if (type === "recipes" || type === "all") {
      let query = client.from("recipes").select("*");

      // 1. Apply diet filter
      if (userProfile.diet_type && userProfile.diet_type !== "Balanced") {
        const dietArray = userProfile.diet_type
          .split(",")
          .map((item) => item.trim());
        query = query.overlaps("dietary_tags", dietArray);
      } else {
        query = query.contains("dietary_tags", ["Popular"]); // if diet tags is Balanced, show popular recipes
      }

      // 2. Apply allergy filters (essential dietary tags)
      if (essentialTags.length > 0) {
        query = query.contains("dietary_tags", essentialTags);
      }

      let { data: recipeData, error: recipeError } = await query;
      if (recipeError) throw recipeError;

      // 3. Apply ingredient keyword exclusion
      if (recipeData && keywordsToExclude.length > 0) {
        recipeData = recipeData.filter((r) => {
          const ingText = JSON.stringify(r.ingredients).toLowerCase(); // Normalization for easy searching
          // Check if keyword exists in this recipe
          const hasAllergyWord = keywordsToExclude.some((word) =>
            ingText.includes(word)
          );
          return !hasAllergyWord;
        });
      }

      // fallback if no recipes found
      if (!recipeData || recipeData.length === 0) {
        const { data: fallback } = await client
          .from("recipes")
          .select("*")
          .limit(20);
        recipeData = fallback || [];
      }

      const mappedRecipes = recipeData.map(mapRecipeRow);
      finalResources = [...finalResources, ...mappedRecipes];
    }

    // WELLNESS RESOURCES
    if (type !== "recipes") {
      let query = client.from("wellness_resources").select("*");

      if (type !== "all") {
        const singleType = type.replace(/s$/, "");
        const capType =
          singleType.charAt(0).toUpperCase() + singleType.slice(1);
        query = query.eq("type", capType);
      }

      if (userProfile.goals) {
        const formattedGoal = userProfile.goals
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");
        query = query.contains("category_tags", [formattedGoal]);
      }

      let { data: wellnessData, error: wellnessError } = await query;
      if (wellnessError) throw wellnessError;

      if (!wellnessData || wellnessData.length === 0) {
        const { data: fallbackW } = await client
          .from("wellness_resources")
          .select("*")
          .limit(20);
        wellnessData = fallbackW || [];
      }

      finalResources = [...finalResources, ...wellnessData];
    }

    // Return user profile summary along with resources
    return {
      success: true,
      data: {
        userProfile: {
          goals: userProfile.goals,
          diet_type: userProfile.diet_type,
        },
        contentCount: finalResources.length,
        resources: finalResources,
      },
    };
  } catch (err) {
    console.error("Get personalized feed error:", err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getRecipes,
  getRecipeById,
  getWellnessResources,
  getResourceById,
  getPersonalizedFeed,
};
