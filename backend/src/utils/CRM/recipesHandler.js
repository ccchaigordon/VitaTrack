/*-------------------------------------------------------------
  Transforms Spoonacular API raw data and inserts into Supabase recipes table
 -------------------------------------------------------------*/

const supabaseServer = require("../../services/supabaseClient");
const fs = require("fs");
const path = require("path");

// Load all JSON data files
const recipesData = require("./recipes_data.json");
const ketogenicData = require("./keto_data.json");
const paleoPaleo30Data = require("./paleo_whole30_data.json");
const plantBasedAllergenFreeData = require("./plantBased_allergenFree_data.json");
const highProteinData = require("./high_protein_data.json");

// Combine all data into one array
const rawData = {
  results: [
    ...recipesData.results,
    ...ketogenicData.results,
    ...paleoPaleo30Data.results,
    ...plantBasedAllergenFreeData.results,
    ...highProteinData.results,
  ],
};

// Pointing specifically to the results array
const spoonacularData = rawData.results;

// Clean and format text (REMOVE HTML TAGS, EMOJIS, EXTRA SPACES)
function cleanText(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]*>?/gm, "") // Remove HTML tags
    .replace(/\p{Extended_Pictographic}/gu, "") // Remove emojis/symbols
    .replace(/\s+/g, " ") // Collapse multiple spaces/newlines into one
    .trim();
}

// Clean procedure text specifically (remain newlines for readability of procedure/instructions)
function cleanProcedure(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]*>?/gm, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .trim();
}

/*-------------------------------------------------------------
    MAIN LOGIC: transform Spoonacular recipe to supabase schema
 -------------------------------------------------------------*/

function transformRecipe(r) {
  // Extract macronutrients only
  const tags = r.diets ? [...r.diets] : [];
  const nutrition = {};
  if (r.nutrition?.nutrients) {
    const targets = {
      calories: "Calories",
      protein: "Protein",
      carbs: "Carbohydrates",
      fat: "Fat",
    };
    Object.entries(targets).forEach(([key, label]) => {
      // Find matching nutrient and round value
      const match = r.nutrition.nutrients.find((n) => n.name === label);
      if (match) nutrition[key] = Math.round(match.amount);
    });
  }

  /* Manual Calculation for dietary tags */
  // Check for high protein
  if (nutrition.protein > 25) {
    tags.push("high protein");
  }
  // Check for low carb
  if (nutrition.carbs < 20) {
    tags.push("low carb");
  }
  // Check for low sodium
  const sodium = r.nutrition.nutrients.find((n) => n.name === "Sodium");
  if (sodium && sodium.amount < 300) {
    tags.push("low sodium");
  }

  // Combine flags into dietary_tags
  /* Spoonacular splits diet info between the 'diets' array and boolean flags.
     We manually check flags (e.g., r.vegetarian = true) to ensure no tags are missed.*/
  if (r.vegetarian) tags.push("vegetarian");
  if (r.vegan) tags.push("vegan");
  if (r.glutenFree) tags.push("gluten free");
  if (r.dairyFree) tags.push("dairy free");
  if (r.veryPopular) tags.push("popular");
  if (r.lowFodmap) tags.push("low FODMAP");
  // Remove duplicates and capitalize first letter to match diet_type format (e.g. 'vegan' -> 'Vegan')
  const uniqueTags = [...new Set(tags)].map(
    (t) => t.charAt(0).toUpperCase() + t.slice(1)
  );

  // Procedure logic
  let procedureText = "";
  if (
    r.analyzedInstructions?.length > 0 &&
    r.analyzedInstructions[0].steps?.length > 0
  ) {
    procedureText = r.analyzedInstructions[0].steps
      .map((s) => `${s.number}. ${s.step}`)
      .join("\n\n");  // Format with spacing between steps
  } else if (r.instructions) {
    // Format numbered lists with spacing
    procedureText = r.instructions.replace(/(\d+\.\s)/g, "\n\n$1");
  } else {
    procedureText =
      r.summary || "Instructions for this recipe are currently unavailable.";
  }

  // Final return object matching Supabase schema
  return {
    title: cleanText(r.title),
    image_url: r.image,
    source_url: r.sourceUrl || null,
    nutrition_info: nutrition,
    ingredients: (r.extendedIngredients || []).map((i) =>
      cleanText(i.original)
    ),
    procedure: cleanProcedure(procedureText),
    dietary_tags: uniqueTags,
    cooking_time: r.readyInMinutes || null,
  };
}

// Insert transformed recipes into Supabase
async function insertRecipes() {
  if (!spoonacularData || spoonacularData.length === 0) {
    console.log("No data found to migrate.");
    return;
  }

  console.log(`Starting migration for ${spoonacularData.length} recipes.`);

  try {
    const transformed = spoonacularData.map(transformRecipe);

    // Remove duplicates by source_url (keep first occurrence)
    const deduplicated = [];
    const sourceUrlSet = new Set();
    for (const recipe of transformed) {
      if (recipe.source_url && !sourceUrlSet.has(recipe.source_url)) {
        deduplicated.push(recipe);
        sourceUrlSet.add(recipe.source_url);
      } else if (!recipe.source_url) {
        // Include recipes without source_url
        deduplicated.push(recipe);
      }
    }

    console.log(
      `Deduplicated: ${transformed.length} → ${deduplicated.length} recipes.`
    );

    // Check for existing source_urls in database to avoid duplicates
    const { data: existingRecipes } = await supabaseServer
      .from("recipes")
      .select("source_url");

    const existingSourceUrls = new Set(
      existingRecipes?.map((r) => r.source_url).filter(Boolean) || []
    );

    // Filter out recipes that already exist
    const newRecipes = deduplicated.filter(
      (recipe) =>
        !recipe.source_url || !existingSourceUrls.has(recipe.source_url)
    );

    console.log(
      `After filtering existing: ${deduplicated.length} → ${newRecipes.length} new recipes.`
    );

    const { data, error } = await supabaseServer
      .from("recipes")
      .insert(newRecipes)
      .select("title");

    if (error) {
      console.error("Database error:", error.message);
      return;
    }

    console.log(`Success: Inserted ${data.length} recipes.`);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  insertRecipes().then(() => {
    console.log("Process complete.");
    process.exit(0);
  });
}
