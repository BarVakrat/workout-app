// ─── Seed data ──────────────────────────────────────────────────────────────
// Best-effort reconstruction from the user's screenshots (progress-workout.com).
// Exercises were spread across multiple days in the week; grouped here into a
// standard Push / Pull / Legs split by muscle group. Starting weights are the
// last known values from the screenshots — treat as a starting point, not gospel.

let uid = 1;
const nextId = () => String(uid++);

function ex(name, muscle, { sets = 3, repMin = 8, repMax = 12, rest = 120, weight = 0, unit = "kg", bodyweight = false, timeBased = false } = {}) {
  return {
    id: nextId(),
    name,
    muscle,
    repMin,
    repMax,
    rest,
    bodyweight,
    timeBased,
    sets: Array.from({ length: sets }, () => ({
      id: nextId(),
      weight,
      prevWeight: "",
      reps: timeBased ? 45 : repMin,
      rir: "",
      done: false,
    })),
  };
}

export function seedWorkouts() {
  uid = 1;
  return [
    {
      id: nextId(),
      name: "אימון דחיפה",
      exercises: [
        ex("לחיצת חזה בשכיבה כנגד מוט", "חזה", { weight: 47.5 }),
        ex("לחיצת חזה בשיפוע חיובי כנגד מוט סמית", "חזה", { weight: 40 }),
        ex("פרפר בישיבה כנגד מכונה", "חזה", { weight: 45 }),
        ex("שכיבות סמיכה באחיזה רחבה", "חזה", { bodyweight: true, repMin: 10, repMax: 15 }),
        ex("לחיצת כתף בישיבה כנגד משקולות יד", "כתפיים", { weight: 12.5 }),
        ex("הרחקות כתף לצדדים בעמידה כנגד משקולות יד", "כתפיים", { weight: 7.5 }),
        ex("לחיצת פאלוף עם כבל פולי", "בטן", { sets: 2, weight: 32 }),
        ex("בטן סטטית בתוספת משקל", "בטן", { sets: 2, weight: 10, timeBased: true }),
      ],
    },
    {
      id: nextId(),
      name: "אימון משיכה",
      exercises: [
        ex("עליות מתח באחיזה עלית", "גב", { bodyweight: true, repMin: 8, repMax: 12 }),
        ex("חתירה בישיבה באחיזה צרה כנגד כבל תחתון משולש", "גב", { weight: 57.5 }),
        ex("חתירה כנגד מכונה באחיזה רחבה בישיבה", "גב", { weight: 65 }),
        ex("פול דאון באחיזה צרה כנגד מוט", "גב", { weight: 41 }),
        ex("הרחקות כתף אופקיות בישיבה כנגד מכונה אחורית", "כתפיים", { weight: 41 }),
      ],
    },
    {
      id: nextId(),
      name: "אימון רגליים",
      exercises: [
        ex("סקוואט אחורי כנגד מוט", "רגליים", { weight: 74.5 }),
        ex("דדליפט רומני כנגד משקולות יד", "רגליים", { weight: 25 }),
        ex("מכרע בולגרי כנגד משקולות", "רגליים", { weight: 20 }),
        ex("כפיפת ברך בישיבה במכונה", "רגליים", { weight: 30 }),
        ex("הרמת עקבים בישיבה במכונה", "תאומים", { weight: 40 }),
        ex("הרמת עקבים בעמידה במכונה", "תאומים", { weight: 60 }),
      ],
    },
  ];
}

export const MUSCLE_COLORS = {
  חזה: "#2563EB",
  גב: "#059669",
  כתפיים: "#D97706",
  רגליים: "#7C3AED",
  תאומים: "#0891B2",
  בטן: "#DC2626",
  ידיים: "#BE185D",
};
