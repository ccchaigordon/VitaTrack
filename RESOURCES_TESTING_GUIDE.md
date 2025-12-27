# Resources Page - Testing Guide

## ✅ What Was Fixed

### 1. **Field Mapping Issues**
- ✅ Recipes now use correct fields: `title`, `procedure`, `dietary_tags`
- ✅ Resources use correct fields: `source_url`, `description`, `type`
- ✅ Calorie data properly extracted from `nutrition_info.calories`

### 2. **Type Filtering**
- ✅ Articles filter by `type = "Article"` (case-insensitive)
- ✅ Tutorials filter by `type = "Video"` (changed from "tutorial")
- ✅ Backend service uses ILIKE for flexible matching

### 3. **Database Service**
- ✅ Removed references to non-existent `created_at` column
- ✅ Routes now use `healthDataService` for consistent data handling
- ✅ Proper error handling with 404/500 status codes

---

## 🗄️ Seed Database (Required)

**You need to add sample data to Supabase to see resources!**

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Recipe Seed Script
Copy and paste the contents of:
```
db/migrations/03_seed/003_seed_recipes.sql
```
Click **RUN** to insert 5 sample recipes.

### Step 3: Run Wellness Resources Seed Script
Copy and paste the contents of:
```
db/migrations/03_seed/004_seed_wellness_resources.sql
```
Click **RUN** to insert 12 sample articles and videos.

---

## 🧪 Test the Application

### 1. Start Backend (if not running)
```bash
cd backend
node index.js
```
Should see: `Vitatrack API running at http://localhost:4000`

### 2. Start Frontend
```bash
cd web
npm run dev
```

### 3. Test Resources Page
1. Navigate to `/resources` page
2. You should see:
   - **Articles tab**: 5 articles with descriptions and links
   - **Recipes tab**: 5 recipes with calorie badges
   - **Tutorials tab**: 7 video tutorials with descriptions

### 4. Test Features
- ✅ Search box filters by title/description
- ✅ Clicking article/tutorial cards opens external link in new tab
- ✅ Recipe cards show: title, procedure snippet, calorie count
- ✅ Article cards show: title, description, "View More" link
- ✅ Tutorial cards show: title, description, "View More" link

---

## 📊 Data Structure Explanation

### Recipes Table (`recipes`)
```json
{
  "recipe_id": "UUID",
  "title": "Grilled Chicken Salad",
  "nutrition_info": {
    "calories": 350,
    "protein": 35,
    "carbs": 20,
    "fat": 12
  },
  "procedure": "Season chicken...",
  "dietary_tags": ["High Protein", "Low Carb"],
  "cooking_time": 25
}
```

### Wellness Resources Table (`wellness_resources`)
```json
{
  "resource_id": "UUID",
  "title": "10 Tips for Better Sleep",
  "type": "Article",  // or "Video"
  "source_url": "https://example.com/article",
  "description": "Discover evidence-based strategies...",
  "category_tags": ["Wellness", "Sleep"]
}
```

---

## 🔄 Complete Flow Diagram

```
User Opens Resources Page
         ↓
ResourcesPage.tsx calls getRecipes() / getResources()
         ↓
healthApi.ts makes HTTP request
  GET /api/recipes
  GET /api/resources?resourceType=Article
  GET /api/resources?resourceType=Video
         ↓
Backend crm.js routes to healthDataService
         ↓
healthDataService queries Supabase tables
  - recipes table (for recipes)
  - wellness_resources table (for articles/videos)
         ↓
Data returned with proper field mapping
  - Recipes: title, procedure, calories, dietary_tags
  - Resources: title, description, source_url, type
         ↓
Frontend maps data to ResourceItem format
         ↓
Cards displayed with:
  - Title (from recipe.title / resource.title)
  - Summary (from recipe.procedure / resource.description)
  - Badge (calorie count / Article / Tutorial)
  - Link (resource.source_url for external content)
```

---

## 🎯 What Each Card Shows

### Recipe Card
```
┌────────────────────────────────────┐
│ Grilled Chicken Salad    [350 kcal]│
│ Season chicken with salt and...   │
└────────────────────────────────────┘
```

### Article Card
```
┌────────────────────────────────────┐
│ 10 Tips for Better Sleep  [Article]│
│ Discover evidence-based...        │
│ View More →                        │
└────────────────────────────────────┘
```

### Tutorial Card
```
┌────────────────────────────────────┐
│ 20-Minute HIIT Workout   [Tutorial]│
│ Follow along with this high...    │
│ View More →                        │
└────────────────────────────────────┘
```

---

## 🚀 Next Steps (Optional)

### 1. Add Recipe Detail Page
Create a modal or page to show:
- Full ingredients list
- Complete procedure
- Nutritional breakdown (protein, carbs, fat)
- Cooking time

### 2. Add Internal Article Viewer
Instead of external links, create:
- `/resources/:id` route
- Display full article content
- Related resources section

### 3. Add More Filters
- Dietary restrictions (Vegan, Gluten-Free)
- Calorie ranges
- Cooking time filters
- Category tags

### 4. Add User Features
- Save favorite recipes
- Track viewed articles
- Personalized recommendations based on fitness goals

---

## ❓ Troubleshooting

### "Failed to load resources"
- ✅ Check backend is running on port 4000
- ✅ Check `.env` has correct `SUPABASE_URL` and keys
- ✅ Verify seed data was inserted (run SELECT queries in Supabase)

### Recipes show "undefined"
- ✅ Confirm seed data has `nutrition_info` as JSONB
- ✅ Check backend console for errors
- ✅ Test API directly: `curl http://localhost:4000/api/recipes`

### No tutorials showing
- ✅ Confirm seed data has `type = 'Video'`
- ✅ Check frontend is requesting "Video" not "tutorial"
- ✅ Test API: `curl http://localhost:4000/api/resources?resourceType=Video`

---

## 📖 Related Documentation

- [RESOURCES_FLOW_EXPLANATION.md](./RESOURCES_FLOW_EXPLANATION.md) - Detailed flow explanation
- [DATABASE_API_INTEGRATION.md](./DATABASE_API_INTEGRATION.md) - API documentation
- [db/migrations/](./db/migrations/) - Database schema
