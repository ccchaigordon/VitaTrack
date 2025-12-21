function extractWorkoutGoal(message) {
    let workoutGoal = "";

    if (/bulk|muscle|strength/i.test(message)) {
      workoutGoal = "muscle_gain";
    } else if (/cardio|fat|cut|lose/i.test(message)) {
      workoutGoal = "Weight Loss";
    } else if (/endurance/i.test(message)) {
      workoutGoal = "endurance";
    }

    return workoutGoal;
}

module.exports = extractWorkoutGoal;