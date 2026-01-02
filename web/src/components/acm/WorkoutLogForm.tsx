import { useState } from "react";
import { Base } from "./Base";

export function WorkoutLogForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [workoutName, setWorkoutName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [duration, setDuration] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");
  

  return (
    <Base title="Log Workout" onClose={onClose}>
      <div className="space-y-3">
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="Workout name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          rows={2}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Calories (kcal)"
          value={caloriesBurned}
          onChange={(e) => setCaloriesBurned(e.target.value)}
        />
        <p className="text-xs text-gray-500 mb-4">
          Not sure about calories burned? You can calculate it{" "}
          <a
            href="https://www.calculator.net/calories-burned-calculator.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-700"
          >
            here
          </a>.
        </p>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Sets"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />    
        <button
          className="w-full bg-[#2A4A2D] text-white py-2 rounded-lg cursor-pointer"
          onClick={() =>
            onSubmit({
              exercise_name: workoutName,              
              sets: Number(sets),
              reps: Number(reps),
              duration: Number(duration),
              calories_burned: Number(caloriesBurned),
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
