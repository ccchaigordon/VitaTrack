import { useMemo, useState } from "react";

type Category = "Articles" | "Recipes" | "Tutorials";

type ResourceItem = {
  id: string;
  title: string;
  summary: string;
  badge: string;
  link: string;
};

const SAMPLE_RESOURCES: Record<Category, ResourceItem[]> = {
  Articles: [
    {
      id: "art-1",
      title: "Building a sustainable routine",
      summary: "Three small habits that keep your energy steady across the day.",
      badge: "5 min read",
      link: "https://example.com/articles/routine",
    },
    {
      id: "art-2",
      title: "Why recovery days matter",
      summary: "How to avoid burnout with simple recovery checkpoints.",
      badge: "4 min read",
      link: "https://example.com/articles/recovery",
    },
  ],
  Recipes: [
    {
      id: "rec-1",
      title: "High-protein breakfast wrap",
      summary: "Eggs, spinach, and yogurt sauce in a 10-minute wrap.",
      badge: "400 kcal",
      link: "https://example.com/recipes/breakfast-wrap",
    },
    {
      id: "rec-2",
      title: "Sheet-pan veggie dinner",
      summary: "One-pan roast with chickpeas and seasonal veggies.",
      badge: "30 min",
      link: "https://example.com/recipes/sheet-pan",
    },
  ],
  Tutorials: [
    {
      id: "vid-1",
      title: "10-minute mobility reset",
      summary: "Follow-along routine to loosen up after sitting.",
      badge: "Video",
      link: "https://example.com/tutorials/mobility",
    },
    {
      id: "vid-2",
      title: "Meal prep basics",
      summary: "Batch-cooking walkthrough for beginners.",
      badge: "Video",
      link: "https://example.com/tutorials/meal-prep",
    },
  ],
};

function ResourceCard({ item }: { item: ResourceItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          {item.badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{item.summary}</p>
    </a>
  );
}

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("Articles");

  const items = useMemo(() => SAMPLE_RESOURCES[activeCategory], [activeCategory]);

  return (
    <div className="flex min-h-screen bg-[#fdfcf0] p-6 sm:p-8">
      <div className="w-64 shrink-0 border-r border-gray-200 pr-6 sm:pr-8">
        <h2 className="mb-6 text-xl font-bold text-gray-800">Category</h2>
        <nav className="space-y-3">
          {["Articles", "Recipes", "Tutorials"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as Category)}
              className={`w-full rounded-xl p-4 text-left transition-all duration-150 ${
                activeCategory === cat
                  ? "bg-[#E5E7EB] border-l-4 border-gray-600"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="font-semibold text-gray-900">{cat}</div>
              <div className="text-xs text-gray-500">
                {cat === "Recipes" ? "Food ideas" : `${cat.toLowerCase()} for you`}
              </div>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 pl-6 sm:pl-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Resources</p>
            <h2 className="text-2xl font-bold text-gray-900">Curated picks for you</h2>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
            {items.length} items
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:gap-6">
          {items.map((item) => (
            <ResourceCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}