# How Resources Are Fetched and Displayed

## 📊 Complete Data Flow

```
Frontend (React)  →  API Service  →  Backend Route  →  DB Service  →  Supabase DB
ResourcesPage.tsx  →  healthApi.ts  →  crm.js       →  healthDataService.js  →  Tables
```

---

## 🔄 Detailed Step-by-Step Flow

### **STEP 1: User Opens Resources Page**
📍 Location: `web/src/pages/ResourcesPage.tsx`

When the page loads, it fetches 3 types of content:

```typescript
// Fetches recipes from recipes table
const recipesRes = await getRecipes();

// Fetches articles (type = "Article")
const articlesRes = await getResources(null, null, "Article");

// Fetches tutorials (type = "Video")
const tutorialsRes = await getResources(null, null, "Video");
```

---

### **STEP 2: API Service Makes HTTP Request**
📍 Location: `web/src/services/healthApi.ts`

```typescript
// For articles
export async function getResources(search, category, resourceType) {
  const params = new URLSearchParams();
  if (resourceType) params.append("resourceType", resourceType);
  
  // Makes request: GET http://localhost:4000/api/resources?resourceType=Article
  const response = await fetch(`${API_BASE_URL}/resources?${params}`);
  return response.json();
}
```

---

### **STEP 3: Backend Route Handles Request**
📍 Location: `backend/src/routes/crm.js`

```javascript
router.get("/resources", async (req, res) => {
  const { search, category, resourceType } = req.query;
  
  // Calls database service
  const result = await healthDataService.getWellnessResources({
    search,
    category,
    resourceType  // "Article" or "Video"
  });
  
  res.json({ success: true, resources: result.data });
});
```

---

### **STEP 4: Database Service Queries Supabase**
📍 Location: `backend/src/services/healthDataService.js`

```javascript
async function getWellnessResources(filters = {}) {
  let query = client.from("wellness_resources").select("*");
  
  if (filters.resourceType) {
    // Case-insensitive search for type (Article, Video, etc.)
    query = query.ilike("type", `%${filters.resourceType}%`);
  }
  
  const { data, error } = await query;
  return { success: true, data };
}
```

---

### **STEP 5: Database Returns Data**
📍 Location: Supabase `wellness_resources` table

**Table Schema:**
```sql
wellness_resources (
  resource_id     UUID PRIMARY KEY
  title           TEXT NOT NULL
  type            TEXT              -- "Article", "Video", etc.
  source_url      TEXT NOT NULL     -- External link
  description     TEXT              -- Intro/summary text
  category_tags   TEXT[]            -- ["Weight Loss", "Yoga"]
)
```

**Example Row:**
```json
{
  "resource_id": "123-abc-456",
  "title": "10 Tips for Better Sleep",
  "type": "Article",
  "source_url": "https://example.com/sleep-tips",
  "description": "Learn how to improve your sleep quality...",
  "category_tags": ["Wellness", "Sleep"]
}
```

---

### **STEP 6: Frontend Maps and Displays Data**
📍 Location: `web/src/pages/ResourcesPage.tsx`

```typescript
const articlesData = articlesRes.resources?.map((resource: any) => ({
  id: resource.resource_id,
  title: resource.title,
  summary: resource.description,     // Shows in card
  badge: "Article",
  link: resource.source_url,         // External link when clicked
  content: resource.description
}));
```

**Card Display:**
```tsx
<ResourceCard item={item} />

// Shows:
// ┌──────────────────────────────────────┐
// │ 10 Tips for Better Sleep    [Article]│
// │ Learn how to improve your sleep...   │
// │ View More →                          │
// └──────────────────────────────────────┘
```

**When User Clicks:**
- If `item.link` exists → Opens external URL (`source_url`) in new tab
- Currently no internal article detail page (can be added later)

---

## 🐛 Issues Fixed

### **Problem 1: Recipes Showing Undefined**
**Before:**
```typescript
title: recipe.recipe_name,        // ❌ Wrong field
summary: recipe.instructions,     // ❌ Wrong field
```

**After:**
```typescript
title: recipe.title,              // ✅ Correct (from schema)
summary: recipe.procedure,        // ✅ Correct (from schema)
badge: recipe.calories + " kcal", // ✅ Mapped by service
```

### **Problem 2: Articles/Tutorials Missing Data**
**Before:**
```typescript
link: resource.url,               // ❌ Wrong field
resourceType: "article"           // ❌ Case mismatch
```

**After:**
```typescript
link: resource.source_url,        // ✅ Correct field
resourceType: "Article"           // ✅ Matches DB capitalization
```

### **Problem 3: Empty Tutorial Results**
**Before:**
```typescript
resourceType: "tutorial"          // ❌ DB has "Video"
```

**After:**
```typescript
resourceType: "Video"             // ✅ Matches DB values
```

---

## 📝 Summary

### **Articles Flow:**
1. User clicks "Articles" tab
2. Frontend calls `getResources(null, null, "Article")`
3. Backend queries `wellness_resources` WHERE `type` ILIKE '%Article%'
4. Returns rows with `description` (intro) and `source_url` (link)
5. Card shows title + description snippet
6. Clicking "View More" opens `source_url` in new tab

### **Recipes Flow:**
1. User clicks "Recipes" tab
2. Frontend calls `getRecipes()`
3. Backend queries `recipes` table
4. Service maps `nutrition_info.calories` to `calories` field
5. Card shows title + procedure snippet + calorie badge
6. Returns: `title`, `procedure`, `calories`, `dietary_tags`

### **Tutorials Flow:**
1. User clicks "Tutorials" tab
2. Frontend calls `getResources(null, null, "Video")`
3. Backend queries `wellness_resources` WHERE `type` ILIKE '%Video%'
4. Returns video resources with `source_url` links
5. Card shows title + description + link to external video

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add Internal Article Detail Page:**
   - Create route: `/resources/:resourceId`
   - Fetch full content from backend
   - Display in formatted view

2. **Add Recipe Detail Modal:**
   - Show full ingredients + procedure
   - Display nutrition breakdown
   - Add "Save Recipe" feature

3. **Add Seed Data:**
   - Populate `wellness_resources` with real articles/videos
   - Add sample recipes with nutrition info
   - Test filtering and search

4. **Improve Card Click Behavior:**
   - Recipe cards → Open detail modal
   - Article/Tutorial cards → Continue to external link
   - Add "Open in new tab" icon indicator
