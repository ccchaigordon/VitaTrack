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
  };
}

// Get recipes from database (current schema fields: title, nutrition_info, procedure)
async function getRecipes(filters = {}, userAccessToken = null) {
  try {
    const client = userAccessToken
      ? supabaseServer.createUserSupabaseClient(userAccessToken)
      : supabaseServer;

    let query = client.from("recipes").select("*");

    if (filters.search) {
      query = query.ilike("title", `%${filters.search}%`);  //  case-insensitive search
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

// Get single recipe by ID
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

// Get wellness resources from database
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

// Get single wellness resource by ID
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

// Get personalized content feed based on user's fitness profile
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

    // Normalize diet_type for reusable filtering
    if (userProfile.diet_type) {
      userProfile.diet_type = userProfile.diet_type.trim().toLowerCase();
      userProfile.diet_type =
        userProfile.diet_type.charAt(0).toUpperCase() +
        userProfile.diet_type.slice(1);
    }

    // Check user allergies to exclude certain recipes
    // 1. Create allergy tags for dietary_tags filtering
    const allergies = userProfile.allergies
      ? userProfile.allergies
          .split(",")
          .map((a) => a.trim().toLowerCase())
          .filter((a) => a.length > 0)  // remove empty strings
      : [];
    const allergiesTags = [];
    if (allergies.includes("gluten")) allergiesTags.push("Gluten free");
    if (allergies.includes("dairy")) allergiesTags.push("Dairy free");

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

    let finalResources = [];
    const type = contentType.toLowerCase(); // Normalize type for consistent checking

    // RECIPES
    if (type === "recipes" || type === "all") {
      let query = client.from("recipes").select("*");

      const isBalanced = userProfile.diet_type === "Balanced";

      // Check if diet_type is set and not Balanced
      // 1. Apply diet type filters
      if (userProfile.diet_type && !isBalanced) {
        const dietArray = userProfile.diet_type
          .split(",")
          .map((item) => item.trim());  // remove extra spaces
        query = query.overlaps("dietary_tags", dietArray);  // overlaps to match any of the diet types
      } else {
        query = query.overlaps("dietary_tags", ["Popular"]); // if diet tags is balanced or none, show 'Popular' recipes
      }

      // 2. Apply allergy filters (mainly dietary tags)
      if (allergiesTags.length > 0) {
        query = query.overlaps("dietary_tags", allergiesTags);
      }

      let { data: recipeData, error: recipeError } = await query;
      if (recipeError) throw recipeError;

      // 3. Apply ingredient keyword exclusion (allergies)
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

      // fallback if no recipes found, get top 300 recipes
      if (!recipeData || recipeData.length === 0) {
        const { data: fallback } = await client
          .from("recipes")
          .select("*")
          .limit(300);
        recipeData = fallback || [];
      }

      const mappedRecipes = recipeData.map(mapRecipeRow);
      finalResources = [...finalResources, ...mappedRecipes];
    }

    // WELLNESS RESOURCES, if the type is not recipes
    if (type !== "recipes") {
      let query = client.from("wellness_resources").select("*");

      // 1. Apply type filter, search by type if specified: Article, Video
      if (type !== "all") {
        const singleType = type.replace(/s$/, "");  // Remove plural 's' of type extracted 
        const capType =
          singleType.charAt(0).toUpperCase() + singleType.slice(1);
        query = query.eq("type", capType); // Article or Video
      }

      // 2. Apply goal-based filtering
      if (userProfile.goals && userProfile.goals.trim().length > 0) { // Ensure goals exist, not empty
        const goalsArray = userProfile.goals
          .split(/,|;|\/|\band\b|&/i) // Regex to split by comma, semicolon, slash, "and" (case-insensitive), or &
          .map((goal) =>
            goal
              .trim()
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")
          )
          .filter((goal) => goal.length > 0); // Remove empty strings

        // Use overlaps to match any of the user's goals (if match category tags)
        if (goalsArray.length > 0) {
          query = query.overlaps("category_tags", goalsArray);
        }
      }

      let { data: wellnessData, error: wellnessError } = await query;
      if (wellnessError) throw wellnessError;

      // Fallback if missing wellness resources, fetch top 300
      if (!wellnessData || wellnessData.length === 0) {
        const { data: fallbackW } = await client
          .from("wellness_resources")
          .select("*")
          .limit(300);
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
