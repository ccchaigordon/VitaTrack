-- Seed sample recipes
-- Run this in Supabase SQL Editor to populate test data

INSERT INTO public.recipes (title, image_url, nutrition_info, ingredients, procedure, dietary_tags, cooking_time)
VALUES
(
  'Grilled Chicken Salad',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  '{"calories": 350, "protein": 35, "carbs": 20, "fat": 12}'::jsonb,
  '["200g chicken breast", "Mixed greens", "Cherry tomatoes", "Olive oil", "Lemon juice"]'::jsonb,
  'Season chicken with salt and pepper. Grill for 6-7 minutes per side until cooked through. Let rest 5 minutes, then slice. Toss greens with tomatoes, olive oil, and lemon juice. Top with sliced chicken and serve.',
  ARRAY['High Protein', 'Low Carb', 'Gluten Free'],
  25
),
(
  'Quinoa Buddha Bowl',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  '{"calories": 420, "protein": 18, "carbs": 52, "fat": 15}'::jsonb,
  '["1 cup quinoa", "Roasted chickpeas", "Avocado", "Kale", "Tahini dressing"]'::jsonb,
  'Cook quinoa according to package directions. Massage kale with lemon juice. Roast chickpeas with spices at 400°F for 20 minutes. Assemble bowl with quinoa base, kale, chickpeas, sliced avocado. Drizzle with tahini dressing.',
  ARRAY['Vegan', 'High Fiber', 'Plant Based'],
  35
),
(
  'Salmon with Sweet Potato',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
  '{"calories": 480, "protein": 32, "carbs": 38, "fat": 22}'::jsonb,
  '["200g salmon fillet", "1 large sweet potato", "Asparagus", "Garlic", "Olive oil"]'::jsonb,
  'Preheat oven to 400°F. Dice sweet potato and toss with olive oil. Roast for 25 minutes. Season salmon with garlic, salt, pepper. Add salmon and asparagus to pan, roast 12-15 minutes until salmon flakes easily.',
  ARRAY['High Protein', 'Omega-3', 'Paleo'],
  45
),
(
  'Greek Yogurt Parfait',
  'https://images.unsplash.com/photo-1488477181946-6428a0291777',
  '{"calories": 280, "protein": 20, "carbs": 35, "fat": 8}'::jsonb,
  '["1 cup Greek yogurt", "Mixed berries", "Granola", "Honey", "Chia seeds"]'::jsonb,
  'Layer Greek yogurt in a glass. Add a layer of mixed berries. Sprinkle with granola and chia seeds. Drizzle with honey. Repeat layers. Serve immediately or refrigerate for up to 2 hours.',
  ARRAY['Vegetarian', 'High Protein', 'Quick'],
  10
),
(
  'Veggie Stir Fry with Tofu',
  'https://images.unsplash.com/photo-1555126634-323283e090fa',
  '{"calories": 320, "protein": 16, "carbs": 42, "fat": 10}'::jsonb,
  '["200g firm tofu", "Bell peppers", "Broccoli", "Soy sauce", "Ginger", "Brown rice"]'::jsonb,
  'Press tofu and cube. Cook brown rice. Heat wok with oil, cook tofu until golden. Remove. Stir fry vegetables with ginger and garlic 3-4 minutes. Add tofu back, toss with soy sauce. Serve over rice.',
  ARRAY['Vegan', 'Plant Based', 'Asian'],
  30
);
