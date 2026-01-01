import { useState } from "react";
import { Base } from "./Base";

export function MealLogForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [mealTime, setMealTime] = useState("");

  return (
    <Base title="Log Meal" onClose={onClose}>
      <div className="space-y-3">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Meal name"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Calories (kcal)"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Protein (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Carbohydrates (g)"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Fats (g)"
          value={fats}
          onChange={(e) => setFats(e.target.value)}
        />
        <select
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
            >
            <option value="" disabled>
                Select meal time
            </option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Snack">Snack</option>
            <option value="Dinner">Dinner</option>
        </select>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100"
          value="user_message"
          readOnly
        />       

        <button
          className="w-full bg-[#2A4A2D] text-white py-2 rounded-lg"
          onClick={() =>
            onSubmit({
              meal_name: mealName,              
              protein: Number(protein),
              carbs: Number(carbs),
              fats: Number(fats),
              calories: Number(calories),
              meal_time: mealTime,
              source: "user_message",
            })
          }
        >
          Confirm
        </button>
      </div>
    </Base>
  );
}
