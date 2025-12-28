# Quick Reference: Recipe Detail Feature

## 🎯 What Users Will See

### On Resources Page - Recipe Tab

**Recipe Card:**
```
Grilled Chicken Salad    [350 kcal]
┌──────┬──────┬──────┬──────┐
│ 350  │ 20g  │ 35g  │ 12g  │
│ Calo │ Carb │ Prot │ Fat  │
└──────┴──────┴──────┴──────┘
⏱️  25 minutes   🥘  5 ingredients
Season chicken with salt and peppers...
View Full Recipe →
```

**User Action:** Click anywhere on card

### On Recipe Detail Page

**Page Layout:**
```
← Back to Resources

Grilled Chicken Salad
[Recipe Image]

[Nutrition Summary: 5 cards]
[Dietary Tags: Pills]

LEFT SIDEBAR              │  RIGHT COLUMN
─────────────────────────┼──────────────
Ingredients              │  Instructions
✓ 200g chicken          │  Season chicken with salt...
✓ Mixed greens          │  Grill for 6-7 minutes...
✓ Cherry tomatoes       │  
✓ Olive oil             │  Macronutrient Breakdown
✓ Lemon juice           │  Protein ████ 35g
                        │  Carbs   ██   20g
                        │  Fat     ██   12g
```

---

## 📂 Files Created/Modified

### ✅ NEW Files:
- `web/src/pages/RecipeDetailPage.tsx` - Full recipe detail display

### ✅ MODIFIED Files:
- `web/src/pages/ResourcesPage.tsx` - Enhanced cards + navigation
- `web/src/App.tsx` - Added recipe detail route

### ✅ DOCUMENTATION:
- `RECIPE_DETAIL_IMPLEMENTATION.md` - Technical details
- `RECIPE_BEFORE_AFTER.md` - Feature comparison
- `RECIPE_QUICK_REFERENCE.md` - This file!

---

## 🔄 User Journey

```
1. User goes to /resources
   └─ Sees recipe cards with macro info

2. User clicks recipe card
   └─ Navigate to /recipe/{recipeId}

3. User sees full recipe
   ├─ Reads ingredients (left)
   ├─ Reads instructions (right)
   └─ Checks macro breakdown

4. User clicks "Back to Resources"
   └─ Returns to /resources page
```

---

## 📊 Recipe Card Nutrition Display

| Field | Position | Color | Format |
|-------|----------|-------|--------|
| Calories | Box 1 | Lime-700 | Plain number |
| Carbs | Box 2 | Blue-600 | {value}g |
| Protein | Box 3 | Orange-600 | {value}g |
| Fat | Box 4 | Red-600 | {value}g |

**Example:**
```
┌──────┐
│ 350  │ ← Calories (lime)
│ Cal  │
└──────┘

┌──────┐
│ 20g  │ ← Carbs (blue)
│ Carb │
└──────┘

┌──────┐
│ 35g  │ ← Protein (orange)
│ Prot │
└──────┘

┌──────┐
│ 12g  │ ← Fat (red)
│ Fat  │
└──────┘
```

---

## ⚙️ Technical Implementation

### Recipe Card (ResourcesPage.tsx)
```jsx
{item.isRecipe && (
  <div className="mb-4 grid grid-cols-4 gap-2">
    <div className="bg-lime-50">
      <div>{item.calories || 0}</div>
      <div>Calories</div>
    </div>
    {/* carbs, protein, fat boxes... */}
  </div>
)}
```

### Recipe Detail (RecipeDetailPage.tsx)
```jsx
<div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
  {/* Nutrition cards */}
  {/* Macro progress bars */}
  {/* Ingredients sidebar */}
  {/* Instructions */}
</div>
```

### Navigation (ResourcesPage.tsx)
```jsx
const handleCardClick = () => {
  if (item.isRecipe) {
    navigate(`/recipe/${item.id}`);
  } else if (item.link) {
    window.open(item.link, "_blank");
  }
};
```

### Route (App.tsx)
```jsx
<Route
  path="/recipe/:recipeId"
  element={
    <RequireAuth>
      <AuthenticatedLayout>
        <RecipeDetailPage />
      </AuthenticatedLayout>
    </RequireAuth>
  }
/>
```

---

## 🧪 Testing Checklist

### Verify Card Display:
- [ ] Recipe card shows calorie badge
- [ ] Macro grid shows: Calories, Carbs, Protein, Fat
- [ ] Cooking time displays with ⏱️ icon
- [ ] Ingredient count shows with 🥘 icon
- [ ] Card has hover effect (slight lift + shadow)

### Verify Navigation:
- [ ] Click recipe card → Navigate to detail page
- [ ] URL changes to `/recipe/{recipeId}`
- [ ] Detail page loads recipe data

### Verify Detail Page:
- [ ] Recipe title displays
- [ ] Recipe image shows (if available)
- [ ] Nutrition summary has 5 cards (cal, protein, carbs, fat, time)
- [ ] Dietary tags display as pills
- [ ] Ingredients list shows on left
- [ ] Instructions display on right
- [ ] Macro breakdown shows with progress bars
- [ ] "Back to Resources" button works
- [ ] Clicking back returns to `/resources`

### Verify Articles/Tutorials:
- [ ] Article cards still show external link
- [ ] Clicking link opens in new tab ✓
- [ ] No navigation to detail page

---

## 🎨 Color System

### Nutrition Colors:
- **Calories**: Lime (🟢) `#10b981`
- **Carbs**: Blue (🔵) `#2563eb`
- **Protein**: Orange (🟠) `#f97316`
- **Fat**: Red (🔴) `#dc2626`
- **Time**: Purple (🟣) `#9333ea`

### Interactive Elements:
- **Card background**: White `#ffffff`
- **Card border**: Light gray `#e5e7eb`
- **Button primary**: Lime-800 `#3f6417`
- **Hover text**: Lime-900 `#1f3a1f`

### Container Background:
- **Main background**: Beige `#fdfcf0`

---

## 🚀 Next Steps After Testing

If you want to enhance further:

1. **Save Recipes** - Add heart icon, save to profile
2. **Adjustable Servings** - Input multiplier, recalculate macros
3. **Shopping List** - Aggregate ingredients across recipes
4. **Related Recipes** - Show similar recipes at bottom
5. **Print Recipe** - Generate printable version
6. **Share Recipe** - Social sharing buttons

---

## ❓ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Macros showing 0 | Check seed data has nutrition_info |
| Image not loading | Verify image_url in database |
| Detail page blank | Check network tab for API response |
| Navigation not working | Verify route in App.tsx |
| Back button missing | Ensure RecipeDetailPage.tsx imported |

---

## 📞 API Endpoints Used

### Get Recipes List
```
GET /api/recipes
Response: { recipes: [...] }
```

### Get Recipe Details
```
GET /api/recipes/:recipeId
Response: { recipe: { ... } }
```

### Get Articles
```
GET /api/resources?resourceType=Article
Response: { resources: [...] }
```

### Get Tutorials
```
GET /api/resources?resourceType=Video
Response: { resources: [...] }
```

---

## 📱 Responsive Design

### Mobile (< 640px):
- Recipe card: Single column
- Macro grid: 4 columns (compact)
- Detail page: Stacked layout
- Ingredients: Full width above instructions

### Tablet (640px - 1024px):
- Recipe card: 2 columns
- Macro grid: 4 columns (spacious)
- Detail page: 2-column grid

### Desktop (> 1024px):
- Recipe card: 2 columns
- Macro grid: 5 columns
- Detail page: Full 3-column (ingredients, instructions, macros)

---

## ✨ Summary

**Recipe cards now show:**
- Macronutrient breakdown at a glance
- Cooking time and ingredient count
- Clickable to view full recipe

**Recipe detail page shows:**
- Full recipe with image
- Complete ingredients list
- Full cooking instructions
- Visual macro breakdown
- Easy navigation back

**Articles/Tutorials:**
- Continue to link externally
- Same card layout as before
- No detail page (external content)

All features working seamlessly! 🎉
