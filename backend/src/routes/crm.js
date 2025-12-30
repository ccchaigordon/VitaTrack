const express = require("express");
const healthDataService = require("../services/healthDataService");

const router = express.Router();

// GET /api/feed
// Fetch personalized feed (recipes/articles) based on user profile
// Query: userId?, contentType? (recipes|all|wellness)
router.get("/feed", async (req, res) => {
  try {
    const { userId, contentType = "all" } = req.query;
    const userAccessToken = req.user?.accessToken;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    // Fetch personalized feed from healthDataService
    const result = await healthDataService.getPersonalizedFeed(
      userId,
      contentType,
      userAccessToken
    );

    // Check if the service call was successful or not
    if (!result.success) {
      const status = result.error?.toLowerCase().includes("not found")
        ? 404
        : 500;  // default to server error
      return res
        .status(status)
        .json({ error: result.error || "Failed to fetch personalized feed" });
    }

    // Grab the list of matching content, default to empty array if no resources found
    const resources = result.data.resources || [];

    // Send the success response back to app
    res.json({
      success: true,
      userProfile: result.data.userProfile,
      contentCount: resources.length,
      resources
    });
  } catch (err) {
    console.error("Get feed error:", err);
    res.status(500).json({ error: "Failed to fetch personalized feed" });
  }
});


// GET /api/recipes
// Fetch recipes with optional search and dietary filters
// Query: search?, dietaryRestriction?
router.get("/recipes", async (req, res) => {
  try {
    const { search, dietaryRestriction } = req.query;
    const userAccessToken = req.user?.accessToken;

    // Ask healthDataService to fetch recipes with filters
    const result = await healthDataService.getRecipes(
      {
        search,
        dietaryRestriction
      },
      userAccessToken
    );

    // Check if the service call was successful or not
    if (!result.success) {
      return res
        .status(500)
        .json({ error: result.error || "Failed to fetch recipes" });
    }

    // Return success response with recipes
    res.json({ success: true, recipes: result.data });
  } catch (err) {
    console.error("Get recipes error:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});


// GET /api/recipes/:recipeId
// Fetch detailed recipe info by ID
router.get("/recipes/:recipeId", async (req, res) => {
  try {
    const { recipeId } = req.params;  
    const userAccessToken = req.user?.accessToken;

    const result = await healthDataService.getRecipeById(recipeId, userAccessToken);

    // Check if recipe is missing or call failed
    if (!result.success || !result.data) {
      const status = result.error?.toLowerCase().includes("not found") ||
        result.error?.toLowerCase().includes("no rows")
          ? 404
          : 500;
      return res
        .status(status)
        .json({ error: result.error || "Recipe not found" });
    }

    res.json({ success: true, recipe: result.data }); // return full formatted recipe details
  } catch (err) {
    console.error("Get recipe details error:", err);
    res.status(500).json({ error: "Failed to fetch recipe details" });
  }
});


// GET /api/resources
// Fetch wellness resources (article, video) with filters
// Query: search?, category?, resourceType?
router.get("/resources", async (req, res) => {
  try {
    const { search, category, resourceType } = req.query;
    const userAccessToken = req.user?.accessToken;

    // Fetch wellness resources from healthDataService
    const result = await healthDataService.getWellnessResources(
      {
        search,
        category,
        resourceType
      },
      userAccessToken
    );

    // Check if the service call was successful or not
    if (!result.success) {
      return res
        .status(500)
        .json({
          error: result.error || "Failed to fetch wellness resources"
        });
    }

    // Return success response with wellness resources
    res.json({ success: true, resources: result.data });
  } catch (err) {
    console.error("Get resources error:", err);
    res.status(500).json({ error: "Failed to fetch wellness resources" });
  }
});


// GET /api/resources/:resourceId
// Fetch full details for a specific resource
router.get("/resources/:resourceId", async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userAccessToken = req.user?.accessToken;

    // Fetch resource details from healthDataService
    const result = await healthDataService.getResourceById(resourceId, userAccessToken);

    // Check if resource is missing or call failed
    if (!result.success || !result.data) {
      const status = result.error?.toLowerCase().includes("not found") ||
        result.error?.toLowerCase().includes("no rows")
          ? 404
          : 500;
      return res
        .status(status)
        .json({ error: result.error || "Resource not found" });
    }

    // Return success response with resource details
    res.json({ success: true, resource: result.data });
  } catch (err) {
    console.error("Get resource details error:", err);
    res.status(500).json({ error: "Failed to fetch resource details" });
  }
});


// GET /api/resources/category/:category
// Fetch resources filtered by category name
// router.get("/resources/category/:category", async (req, res) => {
//   try {
//     const { category } = req.params;
//     const userAccessToken = req.user?.accessToken;

//     // Fetch wellness resources by category from healthDataService
//     const result = await healthDataService.getWellnessResources(
//       { category },
//       userAccessToken
//     );

//     // Check for failure
//     if (!result.success) {
//       return res.status(500).json({
//         error: result.error || "Failed to fetch resources by category"
//       });
//     }
    
//     // Return success response with filtered resources
//     res.json({ success: true, resources: result.data });
//   } catch (err) {
//     console.error("Get resources by category error:", err);
//     res.status(500).json({ error: "Failed to fetch resources by category" });
//   }
// });

module.exports = router;
