const supabaseServer = require("./supabaseClient");

/**
 * CRM Data Service - Recipes and Wellness Resources
 * Handles database operations for content and recipes module
 */

// Utility to project recipe fields from current schema
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
async function getPersonalizedFeed(userId, contentType = "all", userAccessToken = null) {
  try {
    const client = userAccessToken
      ? supabaseServer.createUserSupabaseClient(userAccessToken)
      : supabaseServer;

    // Get user profile
    const { data: userProfile, error: profileError } = await client
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) throw profileError;

    // Build query based on user's fitness goals
    let query = client.from("wellness_resources").select("*");

    if (contentType !== "all") {
      query = query.ilike("type", contentType);
    }

    // Optional: filter by category_tags matching fitness_goal, if present
    if (userProfile.fitness_goal) {
      query = query.contains("category_tags", [userProfile.fitness_goal]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: {
        userProfile: {
          fitness_goal: userProfile.fitness_goal,
          dietary_preferences: userProfile.dietary_preferences
        },
        resources: data
      }
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
  getPersonalizedFeed
};
