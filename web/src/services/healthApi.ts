import { apiFetch } from './api';

// PERSONALIZED FEED - Recipes and wellness resources based on user profile
export async function getPersonalizedFeed(userId: string, contentType: string = "all") {
  const params = new URLSearchParams({ userId });
  if (contentType !== "all") params.append("contentType", contentType);

  return apiFetch<{
    success: boolean;
    userProfile?: unknown;
    contentCount?: number;
    resources?: unknown[];
  }>(`/feed?${params}`);
}

// Fetch detailed info for a specific recipe by ID
export async function getRecipeDetails(recipeId: string) {
  return apiFetch<{
    success: boolean;
    recipe?: unknown;
  }>(`/recipes/${recipeId}`);
}

// If want to browse all resources without filters
// RECIPE APIs - Fetch all recipes and details
export async function getRecipes(
  search: string | null = null,
  category: string | null = null,
  dietaryRestriction: string | null = null
) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (dietaryRestriction) params.append("dietaryRestriction", dietaryRestriction);

  return apiFetch<{
    success: boolean;
    recipes?: unknown[];
  }>(`/recipes?${params}`);
}

// WELLNESS RESOURCES APIs - Fetch all resources and details
export async function getResources(
  search: string | null = null,
  category: string | null = null,
  resourceType: string | null = null
) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (resourceType) params.append("resourceType", resourceType);

  return apiFetch<{
    success: boolean;
    resources?: unknown[];
  }>(`/resources?${params}`);
}

// Fetch detailed info for a specific resource by ID
export async function getResourceDetails(resourceId: string) {
  return apiFetch<{
    success: boolean;
    resource?: unknown;
  }>(`/resources/${resourceId}`);
}
