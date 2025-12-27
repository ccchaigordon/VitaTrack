/**
 * API Service for CRM - Content & Recipes Module
 * Provides wellness content (recipes, articles, tutorials) based on user's fitness profile
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * PERSONALIZED FEED - Wellness content tailored to user's fitness profile
 */

export async function getPersonalizedFeed(userId: string, contentType: string = "all") {
  const params = new URLSearchParams({ userId });
  if (contentType !== "all") params.append("contentType", contentType);

  const response = await fetch(`${API_BASE_URL}/feed?${params}`);

  if (!response.ok) throw new Error("Failed to fetch personalized feed");
  return response.json();
}

/**
 * RECIPES (CRM) - Healthy food recipes
 */

export async function getRecipes(search: string | null = null, category: string | null = null, dietaryRestriction: string | null = null) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (dietaryRestriction) params.append("dietaryRestriction", dietaryRestriction);

  const response = await fetch(`${API_BASE_URL}/recipes?${params}`);

  if (!response.ok) throw new Error("Failed to fetch recipes");
  return response.json();
}

export async function getRecipeDetails(recipeId: string) {
  const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`);

  if (!response.ok) throw new Error("Failed to fetch recipe details");
  return response.json();
}

/**
 * WELLNESS RESOURCES (CRM) - Articles, tutorials, guides
 */

export async function getResources(search: string | null = null, category: string | null = null, resourceType: string | null = null) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (resourceType) params.append("resourceType", resourceType);

  const response = await fetch(`${API_BASE_URL}/resources?${params}`);

  if (!response.ok) throw new Error("Failed to fetch wellness resources");
  return response.json();
}

export async function getResourceDetails(resourceId: string) {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`);

  if (!response.ok) throw new Error("Failed to fetch resource details");
  return response.json();
}

export async function getResourcesByCategory(category: string) {
  const response = await fetch(`${API_BASE_URL}/resources/category/${category}`);

  if (!response.ok) throw new Error("Failed to fetch resources by category");
  return response.json();
}
