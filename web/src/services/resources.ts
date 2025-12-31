// Define types for wellness resources and recipes
export type ResourceItem = {
  id: string;
  title: string;
  summary: string;
  badge: string;
  link?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  category?: string;
  content?: string;
  cooking_time?: number;
  ingredients?: string[];
  isRecipe?: boolean;
  image_url?: string;
  dietary_tags?: string[];
  category_tags?: string[];
};

export type RecipeResponse = {
  recipe_id: string;
  title: string;
  procedure?: string;
  image_url?: string;
  source_url: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  dietary_tags?: string[];
  cooking_time?: number;
  ingredients?: string[];
};

export type WellnessResourceResponse = {
  resource_id: string;
  title: string;
  type?: string;
  source_url: string;
  description?: string;
  category_tags?: string[];
};
