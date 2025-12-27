const express = require("express");
const healthDataService = require("../services/healthDataService");

const router = express.Router();

/**
 * PERSONALIZED FEED - Wellness content based on user's fitness profile
 */

/**
 * GET /api/feed
 * Get personalized wellness content for a user based on their fitness profile
 * Query: userId, contentType? (recipe|article|tutorial|all)
 */
router.get("/feed", async (req, res) => {
  try {
    const { userId, contentType = "all" } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const result = await healthDataService.getPersonalizedFeed(
      userId,
      contentType
    );

    if (!result.success) {
      const status = result.error?.toLowerCase().includes("not found")
        ? 404
        : 500;
      return res
        .status(status)
        .json({ error: result.error || "Failed to fetch personalized feed" });
    }

    const resources = result.data.resources || [];

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

/**
 * RECIPES - Healthy food recipes
 */

/**
 * GET /api/recipes
 * Get recipes, optionally filtered by search/category
 * Query: search?, category?, dietaryRestriction?
 */
router.get("/recipes", async (req, res) => {
  try {
    const { search, category, dietaryRestriction } = req.query;

    const result = await healthDataService.getRecipes({
      search,
      category,
      dietaryRestriction
    });

    if (!result.success) {
      return res
        .status(500)
        .json({ error: result.error || "Failed to fetch recipes" });
    }

    res.json({ success: true, recipes: result.data });
  } catch (err) {
    console.error("Get recipes error:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

/**
 * GET /api/recipes/:recipeId
 * Get detailed recipe information
 */
router.get("/recipes/:recipeId", async (req, res) => {
  try {
    const { recipeId } = req.params;

    const result = await healthDataService.getRecipeById(recipeId);

    if (!result.success || !result.data) {
      const status = result.error?.toLowerCase().includes("not found") ||
        result.error?.toLowerCase().includes("no rows")
          ? 404
          : 500;
      return res
        .status(status)
        .json({ error: result.error || "Recipe not found" });
    }

    res.json({ success: true, recipe: result.data });
  } catch (err) {
    console.error("Get recipe details error:", err);
    res.status(500).json({ error: "Failed to fetch recipe details" });
  }
});

/**
 * WELLNESS RESOURCES - Articles, tutorials, guides
 */

/**
 * GET /api/resources
 * Get wellness articles and tutorials
 * Query: search?, category?, resourceType? (article|tutorial|guide)
 */
router.get("/resources", async (req, res) => {
  try {
    const { search, category, resourceType } = req.query;

    const result = await healthDataService.getWellnessResources({
      search,
      category,
      resourceType
    });

    if (!result.success) {
      return res
        .status(500)
        .json({
          error: result.error || "Failed to fetch wellness resources"
        });
    }

    res.json({ success: true, resources: result.data });
  } catch (err) {
    console.error("Get resources error:", err);
    res.status(500).json({ error: "Failed to fetch wellness resources" });
  }
});

/**
 * GET /api/resources/:resourceId
 * Get resource details with full content
 */
router.get("/resources/:resourceId", async (req, res) => {
  try {
    const { resourceId } = req.params;

    const result = await healthDataService.getResourceById(resourceId);

    if (!result.success || !result.data) {
      const status = result.error?.toLowerCase().includes("not found") ||
        result.error?.toLowerCase().includes("no rows")
          ? 404
          : 500;
      return res
        .status(status)
        .json({ error: result.error || "Resource not found" });
    }

    res.json({ success: true, resource: result.data });
  } catch (err) {
    console.error("Get resource details error:", err);
    res.status(500).json({ error: "Failed to fetch resource details" });
  }
});

/**
 * GET /api/resources/category/:category
 * Get all resources in a specific category
 */
router.get("/resources/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const result = await healthDataService.getWellnessResources({ category });

    if (!result.success) {
      return res.status(500).json({
        error: result.error || "Failed to fetch resources by category"
      });
    }

    res.json({ success: true, resources: result.data });
  } catch (err) {
    console.error("Get resources by category error:", err);
    res.status(500).json({ error: "Failed to fetch resources by category" });
  }
});

module.exports = router;
