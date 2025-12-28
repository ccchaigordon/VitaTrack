/**
 * Spoonacular Recipe Migration Handler
 * Transforms Spoonacular API data and inserts into Supabase recipes table
 */

const supabaseServer = require("../../services/supabaseClient");
const fs = require("fs");
const path = require("path");

// 1. READ DATA FROM EXTERNAL FILE
const filePath = path.join(__dirname, "recipes_data.json");
const fileContent = fs.readFileSync(filePath, "utf8");
const rawData = JSON.parse(fileContent);

// Pointing specifically to the results array
const spoonacularData = rawData.results || rawData[0].results;

/** * Clean standard text (titles, ingredients)
 */
function cleanText(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]*>?/gm, "") // Remove HTML tags
    .replace(/\p{Extended_Pictographic}/gu, "") // Remove emojis/symbols
    .replace(/\s+/g, " ") // Collapse multiple spaces/newlines into one
    .trim();
}

/** * Clean and format instructions (PRESERVE NEWLINES)
 */
function cleanProcedure(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]*>?/gm, "") 
    .replace(/\p{Extended_Pictographic}/gu, "") 
    .trim();
}

/**
 * Maps Spoonacular JSON to your Supabase schema
 */
function transformRecipe(r) {
  // Extract key nutrients into a simple object
  const nutrition = {};
  if (r.nutrition?.nutrients) {
    const targets = {
      calories: "Calories",
      protein: "Protein",
      carbs: "Carbohydrates",
      fat: "Fat",
    };
    Object.entries(targets).forEach(([key, label]) => {
      const match = r.nutrition.nutrients.find((n) => n.name === label);
      if (match) nutrition[key] = Math.round(match.amount);
    });
  }

  // Combine flags into dietary_tags
  const tags = r.diets ? [...r.diets] : [];
  if (r.vegetarian) tags.push("vegetarian");
  if (r.vegan) tags.push("vegan");
  if (r.glutenFree) tags.push("gluten free");
  if (r.dairyFree) tags.push("dairy free");
  const uniqueTags = [...new Set(tags)].map(
    (t) => t.charAt(0).toUpperCase() + t.slice(1)
  );

  // Procedure logic
  let procedureText = "";
  if (r.analyzedInstructions?.length > 0 && r.analyzedInstructions[0].steps?.length > 0) {
    procedureText = r.analyzedInstructions[0].steps
      .map((s) => `${s.number}. ${s.step}`)
      .join("\n\n"); 
  } else if (r.instructions) {
    // If only raw instructions exist, force newlines before numbers
    procedureText = r.instructions.replace(/(\d+\.)/g, "\n\n$1");
  } else {
    procedureText =
      r.summary || "Instructions for this recipe are currently unavailable.";
  }

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

async function insertRecipes() {
  if (!spoonacularData || spoonacularData.length === 0) {
    console.log("No data found to migrate.");
    return;
  }

  console.log(`Starting migration for ${spoonacularData.length} recipes.`);

  try {
    const transformed = spoonacularData.map(transformRecipe);

    const { data, error } = await supabaseServer
      .from("recipes")
      .upsert(transformed, { onConflict: 'title' })
      .select('title');

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
