import React, { useState } from "react";
import { seedWorkouts, MUSCLE_COLORS } from "./data";
import { useLocalStorage } from "./useLocalStorage";

const localDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => localDateStr(new Date());
const fmtDate = (d) => new Date(d).toLocaleDateString("he-IL");
const WEEKDAYS_HE = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const WEEKLY_GOAL = 3;

const DARK_BG = "#0E0E12";
const DARK_CARD = "#1A1A20";
const DARK_BORDER = "#27272F";
const DARK_TEXT_SOFT = "#9A9AA5";
const NEON_ORANGE = "#FF4B3E";
const NEON_LIME = "#C8FF3D";
const GLOW_ORANGE = "0 0 20px rgba(255,75,62,0.4)";
const GLOW_ORANGE_SM = "0 0 10px rgba(255,75,62,0.5)";
const WORKOUT_ICONS = [
  { icon: "ti-flame", bg: "rgba(255,75,62,0.15)", color: NEON_ORANGE },
  { icon: "ti-activity", bg: "rgba(200,255,61,0.15)", color: NEON_LIME },
  { icon: "ti-trending-up", bg: "rgba(255,75,62,0.15)", color: NEON_ORANGE },
];
const WORKOUT_BACKGROUNDS = ["/bg-push.png", "/bg-pull.png", "/bg-legs.png"];

function currentWeekRange() {
  const d = new Date();
  const start = new Date(d); start.setDate(d.getDate() - d.getDay()); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return [localDateStr(start), localDateStr(end)];
}

const darkCardBase = { background: DARK_CARD, border: `1px solid ${DARK_BORDER}`, borderRadius: 18 };
const darkInput = (w) => ({ width: w || 60, padding: "6px 4px", border: `1px solid ${DARK_BORDER}`, borderRadius: 8, fontSize: 14, textAlign: "center", background: DARK_BG, color: "#fff" });
const darkBtn = (primary) => ({
  padding: "8px 16px", borderRadius: 10, border: primary ? "none" : `1px solid ${DARK_BORDER}`,
  background: primary ? NEON_ORANGE : "none", color: "#fff",
  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
  boxShadow: primary ? GLOW_ORANGE_SM : "none",
});

let nid = 100000;
const newId = () => String(nid++);

export default function App() {
  const [workouts, setWorkouts] = useLocalStorage("workouts", seedWorkouts);
  const [completions, setCompletions] = useLocalStorage("completions", []);
  const [activeId, setActiveId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [screen, setScreen] = useState("calendar"); // "calendar" | "programs" | "workout" | "log"
  const [logTarget, setLogTarget] = useState(null); // { date, workoutId }

  const active = workouts.find((w) => w.id === activeId);
  const logCompletion = logTarget && completions.find((c) => c.date === logTarget.date && c.workoutId === logTarget.workoutId);

  const updateWorkout = (id, fn) => setWorkouts((ws) => ws.map((w) => (w.id === id ? fn(w) : w)));

  const updateExercise = (wId, exId, fn) =>
    updateWorkout(wId, (w) => ({ ...w, exercises: w.exercises.map((e) => (e.id === exId ? fn(e) : e)) }));

  const updateSet = (wId, exId, setId, field, value) =>
    updateExercise(wId, exId, (e) => ({
      ...e,
      sets: e.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
    }));

  const addSet = (wId, exId) =>
    updateExercise(wId, exId, (e) => ({
      ...e,
      sets: [...e.sets, { id: newId(), weight: e.sets.at(-1)?.weight ?? 0, prevWeight: e.sets.at(-1)?.prevWeight ?? "", reps: e.repMin, rir: "", done: false }],
    }));

  const removeSet = (wId, exId, setId) =>
    updateExercise(wId, exId, (e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) }));

  const removeExercise = (wId, exId) =>
    updateWorkout(wId, (w) => ({ ...w, exercises: w.exercises.filter((e) => e.id !== exId) }));

  const addExercise = (wId, name, muscle) => {
    if (!name.trim()) return;
    updateWorkout(wId, (w) => ({
      ...w,
      exercises: [
        ...w.exercises,
        {
          id: newId(), name: name.trim(), muscle: muscle || "אחר", repMin: 8, repMax: 12, rest: 90,
          bodyweight: false, timeBased: false,
          sets: [1, 2, 3].map(() => ({ id: newId(), weight: 0, prevWeight: "", reps: 8, rir: "", done: false })),
        },
      ],
    }));
  };

  const finishWorkout = (w) => {
    const date = todayStr();
    const exercisesSnapshot = JSON.parse(JSON.stringify(w.exercises));
    updateWorkout(w.id, (ww) => ({
      ...ww,
      lastCompleted: date,
      exercises: ww.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: false })) })),
    }));
    setCompletions((cs) => [...cs.filter((c) => !(c.date === date && c.workoutId === w.id)), { date, workoutId: w.id, workoutName: w.name, exercises: exercisesSnapshot }]);
    alert("האימון נשמר!");
    setScreen("calendar");
  };

  const removeCompletion = (date, workoutId) =>
    setCompletions((cs) => cs.filter((c) => !(c.date === date && c.workoutId === workoutId)));

  const addCompletion = (date, workoutId) => {
    const w = workouts.find((ww) => ww.id === workoutId);
    if (!w) return;
    const exercisesSnapshot = JSON.parse(JSON.stringify(w.exercises)).map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: false })) }));
    setCompletions((cs) => [...cs.filter((c) => !(c.date === date && c.workoutId === workoutId)), { date, workoutId, workoutName: w.name, exercises: exercisesSnapshot }]);
    if (!w.lastCompleted || date >= w.lastCompleted) updateWorkout(workoutId, (ww) => ({ ...ww, lastCompleted: date }));
  };

  const updateCompletionExercise = (date, workoutId, exId, fn) =>
    setCompletions((cs) => cs.map((c) => (
      c.date === date && c.workoutId === workoutId
        ? { ...c, exercises: c.exercises.map((e) => (e.id === exId ? fn(e) : e)) }
        : c
    )));

  const updateCompletionSet = (date, workoutId, exId, setId, field, value) =>
    updateCompletionExercise(date, workoutId, exId, (e) => ({ ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)) }));

  const addCompletionSet = (date, workoutId, exId) =>
    updateCompletionExercise(date, workoutId, exId, (e) => ({
      ...e,
      sets: [...e.sets, { id: newId(), weight: e.sets.at(-1)?.weight ?? 0, prevWeight: e.sets.at(-1)?.prevWeight ?? "", reps: e.repMin, rir: "", done: false }],
    }));

  const removeCompletionSet = (date, workoutId, exId, setId) =>
    updateCompletionExercise(date, workoutId, exId, (e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) }));

  const openCompletionLog = (date, workoutId) => {
    const c = completions.find((cc) => cc.date === date && cc.workoutId === workoutId);
    const w = workouts.find((ww) => ww.id === workoutId);
    if (c && !c.exercises && w) {
      const snapshot = JSON.parse(JSON.stringify(w.exercises)).map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: false })) }));
      setCompletions((cs) => cs.map((cc) => (cc.date === date && cc.workoutId === workoutId ? { ...cc, exercises: snapshot } : cc)));
    }
    setLogTarget({ date, workoutId });
    setScreen("log");
  };

  if (screen === "log" && logCompletion) {
    return (
      <WorkoutScreen
        workout={{ id: logCompletion.workoutId, name: `${logCompletion.workoutName} · ${fmtDate(logCompletion.date)}`, exercises: logCompletion.exercises }}
        editMode={editMode}
        setEditMode={setEditMode}
        allowStructureEdit={false}
        finishLabel="שמור וחזור"
        onBack={() => { setScreen("calendar"); setLogTarget(null); }}
        onUpdateSet={(exId, setId, field, value) => updateCompletionSet(logTarget.date, logTarget.workoutId, exId, setId, field, value)}
        onAddSet={(exId) => addCompletionSet(logTarget.date, logTarget.workoutId, exId)}
        onRemoveSet={(exId, setId) => removeCompletionSet(logTarget.date, logTarget.workoutId, exId, setId)}
        onRemoveExercise={() => {}}
        onAddExercise={() => {}}
        onEditExercise={() => {}}
        onFinish={() => { setScreen("calendar"); setLogTarget(null); }}
      />
    );
  }

  if (screen === "calendar") {
    return (
      <CalendarScreen
        completions={completions}
        workouts={workouts}
        onOpenPrograms={() => setScreen("programs")}
        onOpenWorkout={(id) => { setActiveId(id); setScreen("workout"); }}
        onRemoveCompletion={removeCompletion}
        onAddCompletion={addCompletion}
        onOpenCompletion={openCompletionLog}
      />
    );
  }

  if (screen === "programs" || !active) {
    return (
      <ProgramsScreen
        workouts={workouts}
        onOpen={(id) => { setActiveId(id); setScreen("workout"); }}
        onRename={(id, name) => updateWorkout(id, (w) => ({ ...w, name }))}
        onBack={() => setScreen("calendar")}
      />
    );
  }

  const activeIndex = workouts.findIndex((w) => w.id === activeId);

  return (
    <WorkoutScreen
      workout={active}
      bgImage={WORKOUT_BACKGROUNDS[activeIndex % WORKOUT_BACKGROUNDS.length]}
      editMode={editMode}
      setEditMode={setEditMode}
      onBack={() => setScreen("programs")}
      onUpdateSet={(exId, setId, field, value) => updateSet(active.id, exId, setId, field, value)}
      onAddSet={(exId) => addSet(active.id, exId)}
      onRemoveSet={(exId, setId) => removeSet(active.id, exId, setId)}
      onRemoveExercise={(exId) => removeExercise(active.id, exId)}
      onAddExercise={(name, muscle) => addExercise(active.id, name, muscle)}
      onEditExercise={(exId, fn) => updateExercise(active.id, exId, fn)}
      onFinish={() => finishWorkout(active)}
    />
  );
}

function ProgramsScreen({ workouts, onOpen, onRename, onBack }) {
  const [editingId, setEditingId] = useState(null);
  const [nameVal, setNameVal] = useState("");

  const ctaBtn = { ...darkBtn(true), width: "100%", padding: "12px", fontSize: 14 };
  const darkCard = { ...darkCardBase, padding: "20px" };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: DARK_BG, fontFamily: "'Montserrat', sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -100, right: -60, width: 240, height: 240, borderRadius: "50%", background: NEON_ORANGE, opacity: 0.14, filter: "blur(30px)" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 240, height: 240, borderRadius: "50%", background: NEON_LIME, opacity: 0.1, filter: "blur(30px)" }} />

      <div style={{ padding: "32px 24px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{ fontSize: 12, color: NEON_LIME, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>תוכנית אימונים</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff" }}>האימונים שלי</h1>
          <p style={{ margin: "4px 0 0", color: DARK_TEXT_SOFT, fontSize: 14 }}>3 אימונים שבועיים</p>
        </div>
        <button onClick={onBack} style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}`, color: DARK_TEXT_SOFT, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>› לוח שנה</button>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
        {workouts.map((w, i) => {
          const ic = WORKOUT_ICONS[i % WORKOUT_ICONS.length];
          return (
            <div key={w.id} style={darkCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`ti ${ic.icon}`} aria-hidden="true" style={{ fontSize: 17, color: ic.color }} />
                  </div>
                  {editingId === w.id ? (
                    <input
                      autoFocus value={nameVal} onChange={(e) => setNameVal(e.target.value)}
                      onBlur={() => { onRename(w.id, nameVal.trim() || w.name); setEditingId(null); }}
                      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                      style={{ ...darkInput(180), textAlign: "right", fontSize: 15, fontWeight: 700 }}
                    />
                  ) : (
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
                      {w.name}{" "}
                      <button onClick={() => { setEditingId(w.id); setNameVal(w.name); }} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, opacity: 0.5, color: DARK_TEXT_SOFT }}>✎</button>
                    </h3>
                  )}
                </div>
                <span style={{ fontSize: 11, color: DARK_TEXT_SOFT, flexShrink: 0 }}>{w.exercises.length} תרגילים</span>
              </div>
              <div style={{ fontSize: 12, color: DARK_TEXT_SOFT, margin: "0 0 14px" }}>
                {w.lastCompleted ? `בוצע לאחרונה: ${fmtDate(w.lastCompleted)}` : "עדיין לא בוצע"}
              </div>
              <button onClick={() => onOpen(w.id)} style={ctaBtn}>פתח אימון</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutScreen({ workout, bgImage, editMode, setEditMode, onBack, onUpdateSet, onAddSet, onRemoveSet, onRemoveExercise, onAddExercise, onEditExercise, onFinish, allowStructureEdit = true, finishLabel = "סיים אימון ושמור" }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("חזה");

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: DARK_BG, fontFamily: "'Montserrat', sans-serif", color: "#fff" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${DARK_BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={darkBtn(false)}>› חזרה</button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#fff" }}>{workout.name}</h2>
        <button onClick={() => setEditMode((v) => !v)} style={{ ...darkBtn(false), border: `1px solid ${editMode ? NEON_LIME : DARK_BORDER}`, color: editMode ? NEON_LIME : "#fff" }}>
          {editMode ? "סיים עריכה" : "ערוך"}
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 14px", display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
        {workout.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id} exercise={ex} editMode={editMode} allowStructureEdit={allowStructureEdit}
            onUpdateSet={(setId, field, value) => onUpdateSet(ex.id, setId, field, value)}
            onAddSet={() => onAddSet(ex.id)}
            onRemoveSet={(setId) => onRemoveSet(ex.id, setId)}
            onRemove={() => onRemoveExercise(ex.id)}
            onEdit={(fn) => onEditExercise(ex.id, fn)}
          />
        ))}

        {editMode && allowStructureEdit && (
          <div style={{ ...darkCardBase, padding: 16 }}>
            {!showAdd ? (
              <button onClick={() => setShowAdd(true)} style={{ ...darkBtn(false), width: "100%", borderStyle: "dashed" }}>+ הוסף תרגיל</button>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input autoFocus placeholder="שם התרגיל" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ ...darkInput(220), textAlign: "right" }} />
                <select value={newMuscle} onChange={(e) => setNewMuscle(e.target.value)} style={darkInput(100)}>
                  {Object.keys(MUSCLE_COLORS).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={() => { onAddExercise(newName, newMuscle); setNewName(""); setShowAdd(false); }} style={darkBtn(true)}>הוסף</button>
                <button onClick={() => setShowAdd(false)} style={darkBtn(false)}>ביטול</button>
              </div>
            )}
          </div>
        )}

        <button onClick={onFinish} style={{ ...darkBtn(true), width: "100%", padding: "14px", fontSize: 15, marginTop: 8 }}>{finishLabel}</button>
      </div>
    </div>
  );
}

function CalendarScreen({ completions, workouts, onOpenPrograms, onOpenWorkout, onRemoveCompletion, onAddCompletion, onOpenCompletion }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const byDate = {};
  completions.forEach((c) => { (byDate[c.date] ||= []).push(c); });

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const dateStr = (d) => `${monthKey}-${String(d).padStart(2, "0")}`;
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const changeMonth = (delta) => {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y);
  };

  const [weekStart, weekEnd] = currentWeekRange();
  const weekCount = completions.filter((c) => c.date >= weekStart && c.date <= weekEnd).length;
  const weekFilled = Math.min(weekCount, WEEKLY_GOAL);

  const navBtn = { background: "none", border: "none", color: DARK_TEXT_SOFT, borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16 };
  const ctaBtn = { ...darkBtn(true), width: "100%", padding: "14px", fontSize: 15, boxShadow: GLOW_ORANGE };
  const darkCard = {
    background: "rgba(10,10,14,0.12)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.14)", borderRadius: 18, padding: 18,
  };

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", fontFamily: "'Montserrat', sans-serif", color: "#fff", position: "relative", overflow: "hidden",
      backgroundColor: DARK_BG,
      backgroundImage: "linear-gradient(rgba(14,14,18,0.35), rgba(14,14,18,0.75)), url(/gym-bg.webp)",
      backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px 32px", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: DARK_CARD, border: `1px solid ${DARK_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <i className="ti ti-bolt" aria-hidden="true" style={{ fontSize: 24, color: NEON_LIME }} />
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: NEON_LIME, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>האימונים שלך</div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${workouts.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
          {workouts.map((w, i) => {
            const ic = WORKOUT_ICONS[i % WORKOUT_ICONS.length];
            return (
              <div key={w.id} onClick={() => onOpenWorkout(w.id)} style={{ ...darkCard, cursor: "pointer" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <i className={`ti ${ic.icon}`} aria-hidden="true" style={{ fontSize: 16, color: ic.color }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{w.name}</div>
                <div style={{ fontSize: 11, color: DARK_TEXT_SOFT }}>{w.exercises.length} תרגילים</div>
              </div>
            );
          })}
        </div>

        <div style={{ ...darkCard, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button onClick={() => changeMonth(-1)} style={navBtn}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{MONTHS_HE[viewMonth]} {viewYear}</span>
            <button onClick={() => changeMonth(1)} style={navBtn}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {WEEKDAYS_HE.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11, color: DARK_TEXT_SOFT, fontWeight: 600 }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const ds = dateStr(d);
              const done = !!byDate[ds];
              const isToday = ds === todayStr();
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3px 0" }}>
                  <div
                    onClick={() => setSelectedDate((prev) => (prev === ds ? null : ds))}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: done ? 700 : 400, cursor: "pointer",
                      background: done ? NEON_ORANGE : "transparent",
                      color: done ? "#fff" : "#fff",
                      boxShadow: [
                        done ? GLOW_ORANGE_SM : null,
                        isToday ? `inset 0 0 0 2px ${NEON_LIME}` : null,
                      ].filter(Boolean).join(", ") || "none",
                    }}>{d}</div>
                </div>
              );
            })}
          </div>

          {selectedDate && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${DARK_BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtDate(selectedDate)}</span>
                <button onClick={() => setSelectedDate(null)} style={{ background: "none", border: "none", color: DARK_TEXT_SOFT, cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
              {(byDate[selectedDate] || []).length === 0 && (
                <div style={{ fontSize: 12, color: DARK_TEXT_SOFT, marginBottom: 10 }}>אין אימונים מתועדים ביום זה</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {(byDate[selectedDate] || []).map((c) => (
                  <div key={c.workoutId} onClick={() => onOpenCompletion(c.date, c.workoutId)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: DARK_BG, border: `1px solid ${DARK_BORDER}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.workoutName}</span>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveCompletion(c.date, c.workoutId); }} style={{ background: "none", border: "none", color: NEON_ORANGE, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✕ הסר</button>
                  </div>
                ))}
              </div>
              {(() => {
                const loggedIds = new Set((byDate[selectedDate] || []).map((c) => c.workoutId));
                const available = workouts.filter((w) => !loggedIds.has(w.id));
                if (available.length === 0) return null;
                return (
                  <div>
                    <div style={{ fontSize: 11, color: DARK_TEXT_SOFT, marginBottom: 6 }}>הוסף אימון ליום זה בדיעבד:</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {available.map((w) => (
                        <button key={w.id} onClick={() => onAddCompletion(selectedDate, w.id)}
                          style={{ background: "none", border: `1px solid ${NEON_LIME}`, color: NEON_LIME, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Montserrat',sans-serif" }}>
                          + {w.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div style={darkCard}>
          <div style={{ fontSize: 13, color: DARK_TEXT_SOFT, marginBottom: 10 }}>מטרת האימונים השבועית</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{weekCount} מתוך {WEEKLY_GOAL} אימונים השבוע</span>
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: WEEKLY_GOAL }, (_, i) => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: i < weekFilled ? NEON_ORANGE : "transparent",
                  border: i < weekFilled ? "none" : `2px solid ${DARK_BORDER}`,
                  boxShadow: i < weekFilled ? GLOW_ORANGE_SM : "none",
                }} />
              ))}
            </div>
          </div>
        </div>

        <button onClick={onOpenPrograms} style={{ ...ctaBtn, marginTop: 28 }}>תוכנית האימונים שלי ›</button>
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, editMode, onUpdateSet, onAddSet, onRemoveSet, onRemove, allowStructureEdit = true }) {
  const [open, setOpen] = useState(true);
  const cols = editMode ? "28px 1fr 1fr 1fr 1fr 30px 32px" : "28px 1fr 1fr 1fr 1fr 30px";

  return (
    <div style={{ ...darkCardBase, overflow: "hidden" }}>
      <div onClick={() => setOpen((v) => !v)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{exercise.name}</div>
          <div style={{ fontSize: 12, color: DARK_TEXT_SOFT, marginTop: 3, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ background: "rgba(255,255,255,0.08)", color: DARK_TEXT_SOFT, borderRadius: 6, padding: "1px 8px", fontWeight: 600 }}>{exercise.muscle}</span>
            <span>טווח חזרות {exercise.repMin}-{exercise.repMax}</span>
            <span>מנוחה {exercise.rest}s</span>
          </div>
        </div>
        <span style={{ fontSize: 18, color: DARK_TEXT_SOFT }}>{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${DARK_BORDER}`, paddingTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 6, fontSize: 11, color: DARK_TEXT_SOFT, marginBottom: 6, fontWeight: 600 }}>
            <span>#</span><span>קודם</span><span>משקל</span><span>חזרות</span><span>RIR</span><span>✓</span>{editMode && <span></span>}
          </div>
          {exercise.sets.map((s, i) => (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: cols, gap: 6, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: DARK_TEXT_SOFT, fontWeight: 600 }}>{i + 1}</span>
              <input type="number" placeholder="-" value={s.prevWeight}
                onChange={(e) => onUpdateSet(s.id, "prevWeight", e.target.value)}
                style={{ ...darkInput(), color: DARK_TEXT_SOFT }} />
              <input type="number" value={s.weight} disabled={exercise.bodyweight}
                onChange={(e) => onUpdateSet(s.id, "weight", parseFloat(e.target.value) || 0)}
                style={{ ...darkInput(), opacity: exercise.bodyweight ? 0.4 : 1 }} />
              <input type="number" value={s.reps} onChange={(e) => onUpdateSet(s.id, "reps", parseFloat(e.target.value) || 0)} style={darkInput()} />
              <input type="number" placeholder="-" value={s.rir} onChange={(e) => onUpdateSet(s.id, "rir", e.target.value)} style={darkInput()} />
              <input type="checkbox" checked={s.done} onChange={(e) => onUpdateSet(s.id, "done", e.target.checked)}
                style={{ width: 18, height: 18, accentColor: NEON_ORANGE, cursor: "pointer", justifySelf: "center" }} />
              {editMode && <button onClick={() => onRemoveSet(s.id)} style={{ border: "none", background: "none", color: DARK_TEXT_SOFT, cursor: "pointer", fontSize: 16 }}>✕</button>}
            </div>
          ))}

          {editMode && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={onAddSet} style={{ ...darkBtn(false), fontSize: 12, padding: "4px 10px" }}>+ הוסף סט</button>
              {allowStructureEdit && (
                <button onClick={onRemove} style={{ padding: "4px 10px", borderRadius: 10, border: "1px solid rgba(255,75,62,0.4)", background: "none", color: NEON_ORANGE, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>הסר תרגיל</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
