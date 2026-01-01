import { Link } from 'react-router-dom';

interface RecipeJoin {
  title: string;
}

interface WellnessJoin {
  title: string;
  source_url: string;
}

interface RecommendationItem {
  rec_id: number;
  type: 'MEAL' | 'WORKOUT' | string;
  created_at: string;
  recipe_id: string | null;
  resource_id: string | null;
  recipes: RecipeJoin | null; 
  wellness_resources: WellnessJoin | null;
}

interface Props {
  data: RecommendationItem[];
}

export function SavedRecommendation({ data }: Props) {
  const recipeItems = data.filter(item => item.recipe_id && item.recipes);
  
  const wellnessItems = data.filter(item => item.resource_id && item.wellness_resources);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-auto">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span>🍳</span> Recipes
          </h3>
          <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded-md border border-gray-200">
            {recipeItems.length} items
          </span>
        </div>

        <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase w-16 text-center">No.</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recipeItems.map((item, index) => (
                  <tr key={item.rec_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-500 text-center">
                      {index + 1}
                    </td>
                    
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {item.recipes?.title || "Unknown Recipe"}
                    </td>

                    <td className="py-3 px-4 text-sm text-right">
                      <Link 
                        to={`/resources/recipes/${item.recipe_id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        View Recipe →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-auto">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span>🧘</span> Wellness
          </h3>
          <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded-md border border-gray-200">
            {wellnessItems.length} items
          </span>
        </div>

        <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase w-16 text-center">No.</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wellnessItems.map((item, index) => (
                  <tr key={item.rec_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-500 text-center">
                      {index + 1}
                    </td>

                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {item.wellness_resources?.title || "Unknown Resource"}
                    </td>

                    <td className="py-3 px-4 text-sm text-right">
                      {item.wellness_resources?.source_url ? (
                        <a 
                          href={item.wellness_resources.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        >
                          Visit Link ↗
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

export default SavedRecommendation;