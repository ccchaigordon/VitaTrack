/**
 * API Service for CRM - Content & Recipes Module
 * Provides wellness content (recipes, articles, tutorials) based on user's fitness profile
 */

import { apiFetch } from './api';

/**
 * PERSONALIZED FEED - Wellness content tailored to user's fitness profile
 */

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

/**
 * RECIPES (CRM) - Healthy food recipes
 */

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

export async function getRecipeDetails(recipeId: string) {
  return apiFetch<{
    success: boolean;
    recipe?: unknown;
  }>(`/recipes/${recipeId}`);
}

/**
 * WELLNESS RESOURCES (CRM) - Articles, tutorials, guides
 */

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

export async function getResourceDetails(resourceId: string) {
  return apiFetch<{
    success: boolean;
    resource?: unknown;
  }>(`/resources/${resourceId}`);
}

export async function getResourcesByCategory(category: string) {
  return apiFetch<{
    success: boolean;
    resources?: unknown[];
  }>(`/resources/category/${category}`);
}
