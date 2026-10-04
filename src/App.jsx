import { useState } from "react";
import "./App.css";
import workouts from "./data/workouts";

function getSavedWorkouts() {
  return JSON.parse(localStorage.getItem("workouts")) || [];
}

function getPreviousWeightsFromList(workoutName, workoutList) {
  const previousWorkout = [...workoutList]
    .reverse()
    .find((workout) => workout.name === workoutName);

  if (!previousWorkout) {
    return {};
  }

  const weights = {};

  previousWorkout.exercises.forEach((exercise) => {
    weights[exercise.name] = exercise.weight;
  });

  return weights;
}

function getPreviousWeights(workoutName) {
  return getPreviousWeightsFromList(workoutName, getSavedWorkouts());
}

function buildExercises(workout) {
  const previousWeights = getPreviousWeights(workout.name);

  return workout.exercises.map((exercise) => ({
    ...exercise,
    weight: previousWeights[exercise.name] || "",
  }));
}

function App() {
  const [view, setView] = useState("tracker");

  const [selectedWorkout, setSelectedWorkout] = useState("upper");

  const [workoutName, setWorkoutName] = useState(workouts.upper.name);

  const [exercises, setExercises] = useState(() =>
    buildExercises(workouts.upper),
  );

  const [previousWeights, setPreviousWeights] = useState(() =>
    getPreviousWeights(workouts.upper.name),
  );

  const [savedWorkouts, setSavedWorkouts] = useState(() => getSavedWorkouts());

  function loadWorkout(workoutKey) {
    const workout = workouts[workoutKey];

    const lastWeights = getPreviousWeights(workout.name);

    setSelectedWorkout(workoutKey);
    setWorkoutName(workout.name);

    setPreviousWeights(lastWeights);

    setExercises(
      workout.exercises.map((exercise) => ({
        ...exercise,
        weight: lastWeights[exercise.name] || "",
      })),
    );
  }

  function updateExercise(id, field, value) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== id) {
          return exercise;
        }

        return {
          ...exercise,
          [field]: value,
        };
      }),
    );
  }

  function finishWorkout() {
    const workout = {
      id: Date.now(),
      name: workoutName,
      date: new Date().toISOString(),
      workingSets: 2,

      exercises: exercises.map((exercise) => ({
        ...exercise,
      })),
    };

    const existingWorkouts = getSavedWorkouts();

    const updatedWorkouts = [...existingWorkouts, workout];

    localStorage.setItem("workouts", JSON.stringify(updatedWorkouts));

    setSavedWorkouts(updatedWorkouts);

    const newPreviousWeights = {};

    exercises.forEach((exercise) => {
      newPreviousWeights[exercise.name] = exercise.weight;
    });

    setPreviousWeights(newPreviousWeights);

    alert("Workout saved!");

    // Keep the newly saved weights filled in.
    setExercises(
      workouts[selectedWorkout].exercises.map((exercise) => ({
        ...exercise,
        weight: newPreviousWeights[exercise.name] || "",
      })),
    );
  }

  function deleteWorkout(workoutId) {
    const confirmed = window.confirm("Delete this workout from history?");

    if (!confirmed) {
      return;
    }

    const updatedWorkouts = savedWorkouts.filter(
      (workout) => workout.id !== workoutId,
    );

    localStorage.setItem("workouts", JSON.stringify(updatedWorkouts));

    setSavedWorkouts(updatedWorkouts);

    const updatedPreviousWeights = getPreviousWeightsFromList(
      workoutName,
      updatedWorkouts,
    );

    setPreviousWeights(updatedPreviousWeights);

    // Update the current workout inputs too,
    // in case the deleted workout contained
    // the weights currently being shown.
    setExercises(
      workouts[selectedWorkout].exercises.map((exercise) => ({
        ...exercise,
        weight: updatedPreviousWeights[exercise.name] || "",
      })),
    );
  }

  return (
    <main className="app">
      <header className="workout-header">
        <h1>Workout Tracker</h1>

        <div className="main-nav">
          <button
            className={view === "tracker" ? "active" : ""}
            onClick={() => setView("tracker")}
          >
            Workout
          </button>

          <button
            className={view === "history" ? "active" : ""}
            onClick={() => setView("history")}
          >
            History
          </button>
        </div>
      </header>

      {view === "tracker" && (
        <>
          <div className="workout-selector">
            {Object.keys(workouts).map((workoutKey) => (
              <button
                key={workoutKey}
                className={
                  selectedWorkout === workoutKey
                    ? "workout-button active"
                    : "workout-button"
                }
                onClick={() => loadWorkout(workoutKey)}
              >
                {workouts[workoutKey].name}
              </button>
            ))}
          </div>

          <section className="workout-table">
            <div className="table-header">
              <span>Exercise</span>
              <span>Reps</span>
              <span>Weight</span>
            </div>

            {exercises.map((exercise) => (
              <div className="exercise-row" key={exercise.id}>
                <span className="exercise-name">{exercise.name}</span>

                <span className="rep-range">{exercise.reps}</span>

                <div className="weight-cell">
                  <input
                    className="weight-input"
                    type="number"
                    value={exercise.weight}
                    placeholder="lbs"
                    onChange={(event) =>
                      updateExercise(exercise.id, "weight", event.target.value)
                    }
                  />

                  <span className="previous-weight">
                    {previousWeights[exercise.name]
                      ? `Last: ${previousWeights[exercise.name]} lbs`
                      : "No previous"}
                  </span>
                </div>
              </div>
            ))}
          </section>

          <button className="finish-workout" onClick={finishWorkout}>
            Finish Workout
          </button>
        </>
      )}

      {view === "history" && (
        <section className="history">
          <h2>Workout History</h2>

          {savedWorkouts.length === 0 ? (
            <p>No workouts saved yet.</p>
          ) : (
            [...savedWorkouts].reverse().map((workout) => (
              <div className="history-card" key={workout.id}>
                <div className="history-card-header">
                  <div>
                    <h3>{workout.name}</h3>

                    <span>{new Date(workout.date).toLocaleDateString()}</span>
                  </div>

                  <button
                    className="delete-history-button"
                    onClick={() => deleteWorkout(workout.id)}
                  >
                    Delete
                  </button>
                </div>

                {workout.exercises.map((exercise) => (
                  <div className="history-exercise" key={exercise.id}>
                    <span>{exercise.name}</span>

                    <span>{exercise.reps}</span>

                    <strong>
                      {exercise.weight ? `${exercise.weight} lbs` : "—"}
                    </strong>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
}

export default App;
