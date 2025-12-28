import React from 'react';

// Define the properties to match your database schema
interface ResourceCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  type?: string;
  cookingTime?: number; // Only for recipes
}

const ResourceCard: React.FC<ResourceCardProps> = ({ 
  title, 
  description, 
  imageUrl, 
  type, 
  cookingTime 
}) => {
  return (
    <div className="flex bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 items-center transition-hover hover:shadow-md">
      
      {/* Left: Image Placeholder */}
      <div className="w-40 h-40 bg-[#eeeeee] rounded-2xl mr-8 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400">
            {/* Simple Placeholder Icon */}
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Right: Text Content */}
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          {/* Show cooking time if it exists */}
          {cookingTime && (
            <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-md">
              {cookingTime} mins
            </span>
          )}
        </div>

        <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-2 max-w-xl">
          {description}
        </p>

        {/* Read More Button */}
        <button className="bg-[#e5e7eb] hover:bg-gray-300 transition-colors px-6 py-2 rounded-xl text-sm font-bold w-fit text-gray-700">
          Read more
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;