# VitaTrack CRM - Content & Recipes Module Integration Guide

## Overview
The **CRM (Content & Recipes Module)** provides personalized wellness education by delivering:
- **Healthy Food Recipes** - Searchable recipe database with nutritional info
- **Wellness Articles** - Educational content about nutrition and fitness
- **Exercise Tutorials** - Guided workout and exercise instructions

Content is personalized based on the user's fitness profile and goals.

### Backend Integration:
- **Supabase** - Database (recipes, wellness_resources, user profiles)
- **OpenFoodFacts** - Product nutrition data (for recipe enhancement)
- **Spoonacular** - Ingredient nutrition parsing (for recipe analysis)

## Backend Setup

### 1. Services Created

#### `nutritionService.js`
Unified interface for nutrition data lookup (used for recipe enhancement):
- Tries OpenFoodFacts first (for accuracy with barcodes)
- Falls back to Spoonacular (for ingredient parsing)
- Handles errors gracefully

#### `openFoodFactsClient.js`
OpenFoodFacts API integration:
- `fetchNutritionFromOpenFoodFacts(barcode)` - Get product by barcode
- `searchOpenFoodFacts(query)` - Search for products by name

### 2. API Endpoints (CRM)

All endpoints are available at `/api`:

#### Personalized Feed
- `GET /api/feed?userId=X&contentType=all|recipe|article|tutorial` - Get personalized wellness content based on user's fitness profile

#### Recipes
- `GET /api/recipes?search=X&category=Y&dietaryRestriction=Z` - Search recipes
- `GET /api/recipes/:recipeId` - Get recipe details

#### Wellness Resources
- `GET /api/resources?search=X&category=Y&resourceType=article|tutorial|guide` - Search wellness content
- `GET /api/resources/:resourceId` - Get resource details
- `GET /api/resources/category/:category` - Get all resources in a category

## Frontend Integration

### 1. Environment Setup
Add to your `.env.local`:
```
VITE_API_URL=http://localhost:4000/api
```

### 2. Using the CRM API Service

```typescript
import { 
  getPersonalizedFeed,
  getRecipes,
  getRecipeDetails,
  getResources,
  getResourceDetails,
  getResourcesByCategory
} from '@/services/healthApi';

// Get user ID from auth context
const userId = userContext.user.id;

// Get personalized wellness feed
const feed = await getPersonalizedFeed(userId, "all");
console.log(feed.resources); // Personalized content based on fitness goals

// Search for recipes
const recipes = await getRecipes("chicken", "dinner", "gluten-free");

// Get recipe details
const recipe = await getRecipeDetails("recipe-uuid");

// Search wellness articles
const articles = await getResources("nutrition", "nutrition", "article");

// Get exercise tutorials
const tutorials = await getResources(null, "fitness", "tutorial");

// Get resources by category
const fitnessContent = await getResourcesByCategory("fitness");
```

### 3. React Component Example - Recipe Browser

```typescript
import React, { useState, useEffect } from 'react';
import { getRecipes, getRecipeDetails } from '@/services/healthApi';

export function RecipeBrowser() {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await getRecipes(search);
      setRecipes(result.recipes);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
        />
        <button type="submit" disabled={loading}>
          Search
        </button>
      </form>
      
      <div className="recipes-grid">
        {recipes.map(recipe => (
          <div key={recipe.recipe_id}>
            <h3>{recipe.recipe_name}</h3>
            <p>{recipe.calories} cal | {recipe.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. React Component Example - Personalized Feed

```typescript
import React, { useState, useEffect } from 'react';
import { getPersonalizedFeed } from '@/services/healthApi';
import { useUser } from '@/contexts/UserContext';

export function WellnessFeed() {
  const { user } = useUser();
  const [feed, setFeed] = useState(null);
  const [contentType, setContentType] = useState('all');

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const result = await getPersonalizedFeed(user.id, contentType);
        setFeed(result);
      } catch (error) {
        console.error('Failed to load feed:', error);
      }
    };
    loadFeed();
  }, [user.id, contentType]);

  return (
    <div>
      <h2>Your Personalized Wellness Feed</h2>
      <p>Based on your goal: {feed?.userProfile?.fitness_goal}</p>
      
      <div className="content-filters">
        <button onClick={() => setContentType('all')}>All</button>
        <button onClick={() => setContentType('recipe')}>Recipes</button>
        <button onClick={() => setContentType('article')}>Articles</button>
        <button onClick={() => setContentType('tutorial')}>Tutorials</button>
      </div>
      
      <div className="feed-items">
        {feed?.resources?.map(resource => (
          <div key={resource.resource_id}>
            <h3>{resource.title}</h3>
            <p>{resource.description}</p>
            <span>{resource.resource_type} | {resource.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Database Schema

### recipes table
```sql
- recipe_id (UUID) - Primary key
- recipe_name (TEXT) - Name of the recipe
- category (TEXT) - Recipe category (breakfast, lunch, dinner, snack, etc.)
- ingredients (JSONB) - List of ingredients
- instructions (TEXT) - Cooking instructions
- calories (NUMERIC) - Calorie count per serving
- protein (NUMERIC) - Protein in grams
- carbs (NUMERIC) - Carbohydrates in grams
- fat (NUMERIC) - Fat in grams
- dietary_restrictions (TEXT) - Dietary tags (vegan, gluten-free, etc.)
- prep_time (INTEGER) - Preparation time in minutes
- cook_time (INTEGER) - Cooking time in minutes
- servings (INTEGER) - Number of servings
- created_at (TIMESTAMPTZ) - When recipe was created
```

### wellness_resources table
```sql
- resource_id (UUID) - Primary key
- title (TEXT) - Resource title
- description (TEXT) - Short description
- content (TEXT) - Full content/article text
- category (TEXT) - Category (nutrition, fitness, mental_health, etc.)
- resource_type (TEXT) - Type (article, tutorial, guide, video)
- url (TEXT) - External URL (if applicable)
- image_url (TEXT) - Image/thumbnail URL
- author (TEXT) - Content author
- tags (TEXT[]) - Searchable tags
- created_at (TIMESTAMPTZ) - When resource was created
- updated_at (CRM API Service)
    ↓
Backend API Routes (crm.js)
    ↓
Supabase Client
    ↓
Database Queries
    ├→ user_profiles (for personalization)
    ├→ recipes (food recipes)
    └→ wellness_resources (articles, tutorials)
    
Optional Enhancement:
    ↓
Nutrition Service (for recipe enhancement)
    ├→ OpenFoodFacts (product nutrition data)
    └→ Spoonacular (ingredient parsing)

```
Frontend (React)
    ↓
healthApi.ts (API Service)
    ↓
Backend API Routes (crm.js)
    ↓
Health Data Service (healthDataService.js)
    ↓
Nutrition Service + APIs
    ├→ OpenFoodFacts (barcode lookup)
    └→ Spoonacular (ingredient parsing)
    ↓
Supabase (Database)
    ├→ meal_logs
    └→ workout_logs
```
API functions handle errors and throw exceptions:
```typescript
try {
  const recipes = await getRecipes("chicken");
  console.log(recipes); // { success: true, recipes: [...] }
} catch (err) {
  console.error('Failed to fetch recipes:', err.message);
}
```

## Content Personalization Logic

The personalized feed (`/api/feed`) works by:
1. Fetching the user's fitness profile (fitness_goal, dietary_preferences)
2. Filtering wellness resources that match their goals
3. Prioritizing content relevant to their current plan
4. Returning a curated list of recipes, articles, and tutorials

Example personalization:
- **Goal: weight_loss** → Low-calorie recipes, cardio tutorials, nutrition articles
- **Goal: muscle_gain** → High-protein recipes, strength training tutorials
- **Goal: wellness** → Balanced recipes, mindfulness articles, general fitness content

## Next Steps

1. **Content Seeding**: Populate `recipes` and `wellness_resources` tables with real content
2. **User Preferences**: Enhance user profiles with detailed dietary preferences
3. **Recommendation Algorithm**: Implement ML-based content recommendations
4. **Bookmarks/Favorites**: Allow users to save favorite recipes and articles
5. **Content Analytics**: Track which content types users engage with most
6. **User-Generated Content**: Allow users to submit their own recipes

## Testing

Test the CRM endpoints using curl or Postman:

```bash
# Get personalized feed
curl "http://localhost:4000/api/feed?userId=user-uuid&contentType=all"

# Search recipes
curl "http://localhost:4000/api/recipes?search=chicken&category=dinner"

# Get recipe details
curl "http://localhost:4000/api/recipes/recipe-uuid"

# Search wellness articles
curl "http://localhost:4000/api/resources?category=nutrition&resourceType=article"

# Get resources by category
curl "http://localhost:4000/api/resources/category/fitness"
```

## Content Categories

### Recipe Categories
- Breakfast
- Lunch
- Dinner
- Snack
- Dessert
- Smoothie

### Wellness Resource Categories
- Nutrition
- Fitness
- Mental Health
- Sleep
- Recovery
- Lifestyle

### Resource Types
- Article (educational text content)
- Tutorial (step-by-step guides)
- Guide (comprehensive how-to documents)
- Video (external video links)
# Search products
curl http://localhost:4000/api/openfoodfacts/search?query=apple
```
