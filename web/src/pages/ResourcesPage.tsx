import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
// import { Recipe, WellnessResource } from '../types/health';
// import ResourceCard from './ResourceCard';

const ResourcesPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'Articles' | 'Recipes' | 'Tutorials'>('Articles');
  const [items, setItems] = useState<(Recipe | WellnessResource)[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Determine which table to query based on category
      const isRecipe = activeCategory === 'Recipes';
      const table = isRecipe ? 'recipes' : 'wellness_resources';
      
      let query = supabase.from(table).select('*');

      // If it's not a recipe, filter by the specific resource type
      if (!isRecipe) {
        const typeFilter = activeCategory === 'Articles' ? 'Article' : 'Video';
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [activeCategory]);

  return (
    <div className="flex bg-[#fdfcf0] rounded-3xl p-8 min-h-screen font-sans">
      {/* Sidebar */}
      <div className="w-1/4 pr-8 border-r border-gray-200">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Category</h2>
        <nav className="space-y-2">
          {['Articles', 'Recipes', 'Tutorials'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeCategory === cat 
                ? 'bg-[#E5E7EB] border-l-4 border-gray-600' 
                : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-bold text-gray-800">{cat}</div>
              <div className="text-xs text-gray-500">
                {cat === 'Recipes' ? 'Food recipes' : `${cat.toLowerCase()} for you`}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="w-3/4 pl-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Recommendations</h2>
        {loading ? (
          <div className="flex justify-center p-10">Loading...</div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <ResourceCard 
                key={'recipe_id' in item ? item.recipe_id : item.resource_id} 
                item={item} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;