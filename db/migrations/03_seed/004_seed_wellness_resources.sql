-- Seed sample wellness resources (Articles and Videos)
-- Run this in Supabase SQL Editor to populate test data

INSERT INTO public.wellness_resources (title, type, source_url, description, category_tags)
VALUES
-- Articles
(
  '10 Tips for Better Sleep Quality',
  'Article',
  'https://www.sleepfoundation.org/sleep-hygiene',
  'Discover evidence-based strategies to improve your sleep quality and wake up feeling refreshed. Learn about sleep hygiene, optimal bedroom conditions, and bedtime routines.',
  ARRAY['Wellness', 'Sleep', 'Mental Health']
),
(
  'Understanding Macronutrients: A Complete Guide',
  'Article',
  'https://www.healthline.com/nutrition/macronutrients',
  'Learn about proteins, carbohydrates, and fats - how they work in your body and how to balance them for optimal health and fitness goals.',
  ARRAY['Nutrition', 'Weight Loss', 'Education']
),
(
  'Benefits of Morning Meditation',
  'Article',
  'https://www.mindful.org/meditation-morning-routine',
  'Explore how starting your day with meditation can reduce stress, improve focus, and boost overall well-being. Includes beginner-friendly techniques.',
  ARRAY['Mental Health', 'Wellness', 'Mindfulness']
),
(
  'Strength Training for Beginners',
  'Article',
  'https://www.verywellfit.com/strength-training-basics',
  'A comprehensive guide to getting started with strength training, including proper form, exercise selection, and progressive overload principles.',
  ARRAY['Fitness', 'Strength', 'Beginner']
),
(
  'Hydration and Athletic Performance',
  'Article',
  'https://www.gssiweb.org/sports-science-exchange/article/hydration-and-performance',
  'Understanding the critical role of hydration in exercise performance, recovery, and overall health. Learn when and how much to drink.',
  ARRAY['Nutrition', 'Fitness', 'Performance']
),

-- Videos/Tutorials
(
  '20-Minute Full Body HIIT Workout',
  'Video',
  'https://www.youtube.com/watch?v=ml6cT4AZdqI',
  'Follow along with this high-intensity interval training session designed to burn calories and build strength. No equipment needed!',
  ARRAY['Fitness', 'HIIT', 'Home Workout']
),
(
  'Yoga for Flexibility: 30-Minute Flow',
  'Video',
  'https://www.youtube.com/watch?v=v7AYKMP6rOE',
  'Improve your flexibility and reduce muscle tension with this gentle yoga flow suitable for all levels. Perfect for recovery days.',
  ARRAY['Yoga', 'Flexibility', 'Recovery']
),
(
  'Meal Prep for Weight Loss',
  'Video',
  'https://www.youtube.com/watch?v=smiKBR6bZ6E',
  'Learn how to prepare a week of healthy, balanced meals in under 2 hours. Includes shopping tips and storage methods.',
  ARRAY['Nutrition', 'Weight Loss', 'Meal Prep']
),
(
  'Proper Squat Form Tutorial',
  'Video',
  'https://www.youtube.com/watch?v=ultWZbUMPL8',
  'Master the fundamental movement pattern of squats with detailed form cues, common mistakes to avoid, and progression options.',
  ARRAY['Strength', 'Form', 'Lower Body']
),
(
  'Guided Meditation for Stress Relief',
  'Video',
  'https://www.youtube.com/watch?v=inpok4MKVLM',
  'A 10-minute guided meditation to help you release tension, calm your mind, and find inner peace. Perfect for stressful days.',
  ARRAY['Mental Health', 'Meditation', 'Stress Relief']
),
(
  'Cardio Kickboxing Workout',
  'Video',
  'https://www.youtube.com/watch?v=BvtD0ZKdD3I',
  'High-energy kickboxing routine combining cardio and strength. Great for stress relief and calorie burning.',
  ARRAY['Cardio', 'Fitness', 'Fun']
),
(
  'Core Strengthening for Beginners',
  'Video',
  'https://www.youtube.com/watch?v=7HpKxNpWCTo',
  'Build a strong foundation with these safe and effective core exercises. Includes modifications for different fitness levels.',
  ARRAY['Core', 'Strength', 'Beginner']
);
