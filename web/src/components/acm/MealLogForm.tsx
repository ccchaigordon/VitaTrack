import { useState } from "react";
import { Base } from "./Base";

export function MealLogForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [mealDescription, setMealDescription] = useState("");
  const [mealTime, setMealTime] = useState("");

  return (
    <Base title="Log Meal" onClose={onClose}>
      <div className="space-y-3">
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="Meal description (Please enter carbs, protein, fats, calories if available)"
          value={mealDescription}
          onChange={(e) => setMealDescription(e.target.value)}
          rows={2}
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

        <button
          className="w-full bg-[#2A4A2D] text-white py-2 rounded-lg"
          onClick={() =>
            onSubmit({
              meal_description: mealDescription,              
              meal_time: mealTime,
            })
          }
        >
          Confirm
        </button>
      </div>
    </Base>
  );
}
