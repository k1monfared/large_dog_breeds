import { useState, useEffect, useMemo, useRef } from "react";

const DATA_URL    = "large_dog_breeds.json";
const RATINGS_URL = "breed_ratings.json";

const INLINE_DATA = [{"name":"Great Dane","origin":"Germany","weight_lbs":{"min":110,"max":175},"height_in":{"min":28,"max":32},"lifespan_yrs":{"min":7,"max":10},"temperament":["Friendly","Patient","Gentle"],"purpose":["Guardian","Companion"],"grooming":"Low","exercise":"Moderate","good_with_kids":true,"good_with_dogs":true,"coat":"Short, smooth","shedding":"Moderate","trainability":"Easy","health_notes":"Prone to bloat (GDV), hip dysplasia, heart disease","color":"#c8a96e"},{"name":"Irish Wolfhound","origin":"Ireland","weight_lbs":{"min":105,"max":120},"height_in":{"min":30,"max":35},"lifespan_yrs":{"min":6,"max":8},"temperament":["Dignified","Calm","Loyal"],"purpose":["Hunter","Companion"],"grooming":"Moderate","exercise":"Moderate","good_with_kids":true,"good_with_dogs":true,"coat":"Rough, wiry","shedding":"Low","trainability":"Moderate","health_notes":"Prone to hip dysplasia, GDV, heart disease","color":"#8b9e7a"},{"name":"Saint Bernard","origin":"Switzerland","weight_lbs":{"min":120,"max":180},"height_in":{"min":26,"max":30},"lifespan_yrs":{"min":8,"max":10},"temperament":["Playful","Charming","Gentle"],"purpose":["Rescue","Companion"],"grooming":"High","exercise":"Moderate","good_with_kids":true,"good_with_dogs":true,"coat":"Dense, smooth or rough","shedding":"High","trainability":"Moderate","health_notes":"Hip/elbow dysplasia, heart disease, drools heavily","color":"#c77b3a"},{"name":"Mastiff","origin":"England","weight_lbs":{"min":120,"max":230},"height_in":{"min":27,"max":30},"lifespan_yrs":{"min":6,"max":10},"temperament":["Courageous","Dignified","Docile"],"purpose":["Guardian"],"grooming":"Low","exercise":"Low","good_with_kids":true,"good_with_dogs":false,"coat":"Short, straight","shedding":"Moderate","trainability":"Moderate","health_notes":"Hip dysplasia, bloat, progressive retinal atrophy","color":"#b07840"},{"name":"Newfoundland","origin":"Canada","weight_lbs":{"min":100,"max":150},"height_in":{"min":26,"max":28},"lifespan_yrs":{"min":9,"max":10},"temperament":["Sweet","Patient","Devoted"],"purpose":["Water Rescue","Companion"],"grooming":"High","exercise":"Moderate","good_with_kids":true,"good_with_dogs":true,"coat":"Thick, oily double coat","shedding":"High","trainability":"Easy","health_notes":"Hip/elbow dysplasia, heart disease (SAS)","color":"#3a3a3a"},{"name":"Bernese Mountain Dog","origin":"Switzerland","weight_lbs":{"min":70,"max":115},"height_in":{"min":23,"max":27.5},"lifespan_yrs":{"min":7,"max":10},"temperament":["Affectionate","Loyal","Intelligent"],"purpose":["Farm","Draft","Companion"],"grooming":"High","exercise":"Moderate","good_with_kids":true,"good_with_dogs":true,"coat":"Thick, tri-color double coat","shedding":"High","trainability":"Easy","health_notes":"Cancer-prone, hip/elbow dysplasia, bloat","color":"#2c2c2c"},{"name":"Leonberger","origin":"Germany","weight_lbs":{"min":90,"max":170},"height_in":{"min":25,"max":31.5},"lifespan_yrs":{"min":7,"max":7},"temperament":["Gentle","Playful","Obedient"],"purpose":["Companion","Draft"],"grooming":"High","exercise":"High","good_with_kids":true,"good_with_dogs":true,"coat":"Long, lion-like mane","shedding":"High","trainability":"Moderate","health_notes":"Joint problems, heart disease, polyneuropathy","color":"#c4a062"},{"name":"Rottweiler","origin":"Germany","weight_lbs":{"min":80,"max":135},"height_in":{"min":22,"max":27},"lifespan_yrs":{"min":9,"max":10},"temperament":["Loyal","Confident","Courageous"],"purpose":["Guard","Police","Companion"],"grooming":"Low","exercise":"High","good_with_kids":true,"good_with_dogs":false,"coat":"Short, dense double coat","shedding":"Moderate","trainability":"Easy","health_notes":"Hip/elbow dysplasia, aortic stenosis, osteosarcoma","color":"#2a2a1a"},{"name":"German Shepherd","origin":"Germany","weight_lbs":{"min":50,"max":90},"height_in":{"min":22,"max":26},"lifespan_yrs":{"min":9,"max":13},"temperament":["Intelligent","Loyal","Obedient"],"purpose":["Police","Military","Companion"],"grooming":"Moderate","exercise":"High","good_with_kids":true,"good_with_dogs":true,"coat":"Medium double coat","shedding":"High","trainability":"Very Easy","health_notes":"Hip dysplasia, degenerative myelopathy, bloat","color":"#8b6914"},{"name":"Labrador Retriever","origin":"Canada","weight_lbs":{"min":55,"max":80},"height_in":{"min":21.5,"max":24.5},"lifespan_yrs":{"min":10,"max":12},"temperament":["Friendly","Active","Outgoing"],"purpose":["Hunting","Guide","Companion"],"grooming":"Low","exercise":"High","good_with_kids":true,"good_with_dogs":true,"coat":"Short, dense double coat","shedding":"High","trainability":"Very Easy","health_notes":"Hip/elbow dysplasia, obesity-prone, eye conditions","color":"#c8a96e"},{"name":"Golden Retriever","origin":"Scotland","weight_lbs":{"min":55,"max":75},"height_in":{"min":21.5,"max":24},"lifespan_yrs":{"min":10,"max":12},"temperament":["Reliable","Trustworthy","Friendly"],"purpose":["Hunting","Guide","Companion"],"grooming":"Moderate","exercise":"High","good_with_kids":true,"good_with_dogs":true,"coat":"Dense golden double coat","shedding":"High","trainability":"Very Easy","health_notes":"Cancer-prone, hip dysplasia, heart disease","color":"#d4a843"},{"name":"Doberman Pinscher","origin":"Germany","weight_lbs":{"min":60,"max":100},"height_in":{"min":24,"max":28},"lifespan_yrs":{"min":10,"max":12},"temperament":["Alert","Loyal","Fearless"],"purpose":["Guard","Police"],"grooming":"Low","exercise":"High","good_with_kids":true,"good_with_dogs":false,"coat":"Short, sleek","shedding":"Low","trainability":"Very Easy","health_notes":"Cardiomyopathy, von Willebrand's disease, wobbler syndrome","color":"#1a1a2e"},{"name":"Anatolian Shepherd","origin":"Turkey","weight_lbs":{"min":80,"max":150},"height_in":{"min":27,"max":29},"lifespan_yrs":{"min":11,"max":13},"temperament":["Independent","Loyal","Reserved"],"purpose":["Livestock Guardian"],"grooming":"Moderate","exercise":"Moderate","good_with_kids":false,"good_with_dogs":false,"coat":"Short or rough double coat","shedding":"High","trainability":"Hard","health_notes":"Hip dysplasia, entropion (eye condition)","color":"#b09060"},{"name":"Cane Corso","origin":"Italy","weight_lbs":{"min":88,"max":110},"height_in":{"min":23.5,"max":27.5},"lifespan_yrs":{"min":9,"max":12},"temperament":["Majestic","Loyal","Protective"],"purpose":["Guardian","Companion"],"grooming":"Low","exercise":"High","good_with_kids":true,"good_with_dogs":false,"coat":"Short, stiff","shedding":"Moderate","trainability":"Moderate","health_notes":"Hip dysplasia, gastric torsion, eye conditions","color":"#2d3436"},{"name":"Bullmastiff","origin":"England","weight_lbs":{"min":100,"max":130},"height_in":{"min":24,"max":27},"lifespan_yrs":{"min":7,"max":9},"temperament":["Affectionate","Reliable","Brave"],"purpose":["Guardian"],"grooming":"Low","exercise":"Moderate","good_with_kids":true,"good_with_dogs":false,"coat":"Short, dense","shedding":"Moderate","trainability":"Moderate","health_notes":"Hip/elbow dysplasia, subaortic valvular stenosis, cancer","color":"#c07840"},{"name":"Alaskan Malamute","origin":"USA (Alaska)","weight_lbs":{"min":75,"max":85},"height_in":{"min":23,"max":25},"lifespan_yrs":{"min":10,"max":14},"temperament":["Playful","Affectionate","Dignified"],"purpose":["Sled","Pack"],"grooming":"High","exercise":"High","good_with_kids":true,"good_with_dogs":false,"coat":"Thick double coat","shedding":"High","trainability":"Hard","health_notes":"Hip dysplasia, inherited polyneuropathy, day blindness","color":"#6e7f80"},{"name":"Akita","origin":"Japan","weight_lbs":{"min":70,"max":130},"height_in":{"min":24,"max":28},"lifespan_yrs":{"min":10,"max":13},"temperament":["Loyal","Courageous","Dignified"],"purpose":["Guardian","Hunter"],"grooming":"High","exercise":"Moderate","good_with_kids":false,"good_with_dogs":false,"coat":"Thick double coat","shedding":"High","trainability":"Hard","health_notes":"Hip dysplasia, autoimmune disorders, hypothyroidism","color":"#c87941"},{"name":"Bloodhound","origin":"Belgium/France","weight_lbs":{"min":80,"max":110},"height_in":{"min":23,"max":27},"lifespan_yrs":{"min":10,"max":12},"temperament":["Tenacious","Gentle","Affectionate"],"purpose":["Tracking","Search & Rescue"],"grooming":"Low","exercise":"High","good_with_kids":true,"good_with_dogs":true,"coat":"Short, loose skin","shedding":"Moderate","trainability":"Hard","health_notes":"Hip/elbow dysplasia, bloat, ear infections","color":"#7b4e2d"},{"name":"Dogue de Bordeaux","origin":"France","weight_lbs":{"min":99,"max":140},"height_in":{"min":23,"max":26},"lifespan_yrs":{"min":5,"max":8},"temperament":["Affectionate","Loyal","Stubborn"],"purpose":["Guardian","Draft"],"grooming":"Low","exercise":"Moderate","good_with_kids":true,"good_with_dogs":false,"coat":"Short, fine","shedding":"Moderate","trainability":"Moderate","health_notes":"Brachycephalic issues, hip dysplasia, heart disease, heavy drooling","color":"#b5622a"},{"name":"Boxer","origin":"Germany","weight_lbs":{"min":50,"max":80},"height_in":{"min":21.5,"max":25},"lifespan_yrs":{"min":10,"max":12},"temperament":["Playful","Loyal","Energetic"],"purpose":["Guard","Companion"],"grooming":"Low","exercise":"High","good_with_kids":true,"good_with_dogs":true,"coat":"Short, shiny","shedding":"Low","trainability":"Moderate","health_notes":"Brachycephalic issues, heart conditions, cancer-prone","color":"#c8854d"},{"name":"Weimaraner","origin":"Germany","weight_lbs":{"min":55,"max":90},"height_in":{"min":23,"max":27},"lifespan_yrs":{"min":10,"max":13},"temperament":["Friendly","Fearless","Obedient"],"purpose":["Hunting","Companion"],"grooming":"Low","exercise":"High","good_with_kids":true,"good_with_dogs":true,"coat":"Short, sleek silver-grey","shedding":"Low","trainability":"Moderate","health_notes":"Bloat, hip dysplasia, von Willebrand's disease","color":"#9aabb0"},{"name":"Rhodesian Ridgeback","origin":"Zimbabwe","weight_lbs":{"min":70,"max":85},"height_in":{"min":24,"max":27},"lifespan_yrs":{"min":10,"max":12},"temperament":["Loyal","Strong-willed","Mischievous"],"purpose":["Hunting","Guardian"],"grooming":"Low","exercise":"High","good_with_kids":true,"good_with_dogs":false,"coat":"Short, dense with distinctive ridge","shedding":"Low","trainability":"Moderate","health_notes":"Hip dysplasia, dermoid sinus, hypothyroidism","color":"#b5713a"},{"name":"Greater Swiss Mountain Dog","origin":"Switzerland","weight_lbs":{"min":85,"max":140},"height_in":{"min":23.5,"max":28.5},"lifespan_yrs":{"min":8,"max":11},"temperament":["Bold","Faithful","Enthusiastic"],"purpose":["Draft","Herding","Guardian"],"grooming":"Low","exercise":"Moderate","good_with_kids":true,"good_with_dogs":true,"coat":"Short tri-color double coat","shedding":"Moderate","trainability":"Easy","health_notes":"Hip/elbow dysplasia, bloat, splenic torsion","color":"#2a2a2a"},{"name":"Black Russian Terrier","origin":"Russia","weight_lbs":{"min":80,"max":130},"height_in":{"min":26,"max":30},"lifespan_yrs":{"min":10,"max":12},"temperament":["Confident","Calm","Intelligent"],"purpose":["Guardian","Military"],"grooming":"High","exercise":"High","good_with_kids":true,"good_with_dogs":false,"coat":"Thick, wavy double coat","shedding":"Low","trainability":"Easy","health_notes":"Hip/elbow dysplasia, JLPP (neurological condition), progressive retinal atrophy","color":"#111827"},{"name":"Boerboel","origin":"South Africa","weight_lbs":{"min":150,"max":200},"height_in":{"min":22,"max":27},"lifespan_yrs":{"min":9,"max":11},"temperament":["Dominant","Intelligent","Loyal"],"purpose":["Farm Guardian","Companion"],"grooming":"Low","exercise":"Moderate","good_with_kids":true,"good_with_dogs":false,"coat":"Short, dense","shedding":"Moderate","trainability":"Moderate","health_notes":"Hip/elbow dysplasia, ectropion, vaginal hyperplasia","color":"#8b6340"},{"name":"Great Pyrenees","origin":"France/Spain","weight_lbs":{"min":85,"max":115},"height_in":{"min":25,"max":32},"lifespan_yrs":{"min":10,"max":12},"temperament":["Gentle","Patient","Strong-willed"],"purpose":["Livestock Guardian","Companion"],"grooming":"High","exercise":"Moderate","good_with_kids":true,"good_with_dogs":true,"coat":"Thick white double coat","shedding":"High","trainability":"Hard","health_notes":"Hip dysplasia, bloat, bone cancer","color":"#e8e0d0"}];

const LEVEL       = { Low: 0, Moderate: 1, High: 2, "Very Easy": 0, Easy: 1, Hard: 3 };
const LEVEL_COLOR = { Low: "#4ade80", Moderate: "#facc15", High: "#f87171" };
const TRAIN_COLOR = { "Very Easy": "#4ade80", "Easy": "#86efac", "Moderate": "#facc15", "Hard": "#f87171" };
const LEVEL_ORDER = ["Low", "Moderate", "High"];
const TRAIN_ORDER = ["Very Easy", "Easy", "Moderate", "Hard"];

const EXERCISE_DESC = { Low: "short daily walks", Moderate: "1+ hr activity daily", High: "vigorous daily exercise" };
const GROOMING_DESC = { Low: "occasional brushing", Moderate: "brush several times/week", High: "frequent brushing & professional grooming" };
const SHEDDING_DESC = { Low: "minimal shedding", Moderate: "seasonal shedding", High: "year-round heavy shedding" };
const TRAIN_DESC    = { "Very Easy": "eager to please, learns fast", "Easy": "picks up commands readily", "Moderate": "patient training needed", "Hard": "strong-willed, needs experience" };

// ── DogTime star rating categories & traits ─────────────────────────────────
const RATING_CATEGORIES = [
  { key: "adaptability", label: "Adaptability", color: "#7dd3fc",
    overallTrait: "Adaptability - Overall",
    traits: [
      { key: "rat_adapt_ovr", label: "Overall",       trait: "Adaptability - Overall", isOverall: true },
      { key: "rat_apt",       label: "Apt Living",    trait: "Adapts Well To Apartment Living" },
      { key: "rat_novice",    label: "Novice Owners", trait: "Good For Novice Dog Owners" },
      { key: "rat_sens",      label: "Sensitivity",   trait: "Sensitivity Level" },
      { key: "rat_alone",     label: "Alone",         trait: "Tolerates Being Alone" },
      { key: "rat_cold",      label: "Cold Weather",  trait: "Tolerates Cold Weather" },
      { key: "rat_hot",       label: "Hot Weather",   trait: "Tolerates Hot Weather" },
    ]},
  { key: "friendliness", label: "Friendliness", color: "#86efac",
    overallTrait: "All-around friendliness - Overall",
    traits: [
      { key: "rat_friend_ovr", label: "Overall",  trait: "All-around friendliness - Overall", isOverall: true },
      { key: "rat_family",     label: "Family",   trait: "Best Family Dogs" },
      { key: "rat_kids",       label: "Kids",     trait: "Kid-Friendly" },
      { key: "rat_dogs",       label: "Dogs",     trait: "Dog Friendly" },
      { key: "rat_strangers",  label: "Strangers",trait: "Friendly Toward Strangers" },
    ]},
  { key: "health", label: "Health & Grooming", color: "#fdba74",
    overallTrait: "Health And Grooming Needs - Overall",
    traits: [
      { key: "rat_health_ovr", label: "Overall",    trait: "Health And Grooming Needs - Overall", isOverall: true },
      { key: "rat_shed",       label: "Shedding",   trait: "Shedding" },
      { key: "rat_drool",      label: "Drooling",   trait: "Drooling Potential" },
      { key: "rat_groom",      label: "Easy Groom", trait: "Easy To Groom" },
      { key: "rat_health",     label: "Gen Health", trait: "General Health" },
      { key: "rat_weight",     label: "Wt Gain",    trait: "Potential For Weight Gain" },
    ]},
  { key: "trainability", label: "Trainability", color: "#c4b5fd",
    overallTrait: "Trainability - Overall",
    traits: [
      { key: "rat_train_ovr", label: "Overall",   trait: "Trainability - Overall", isOverall: true },
      { key: "rat_train",     label: "Training",  trait: "Easy To Train" },
      { key: "rat_intel",     label: "Intel",     trait: "Intelligence" },
      { key: "rat_mouth",     label: "Mouthing",  trait: "Potential For Mouthiness" },
      { key: "rat_prey",      label: "Prey Drive",trait: "Prey Drive" },
      { key: "rat_bark",      label: "Barking",   trait: "Tendency To Bark Or Howl" },
      { key: "rat_wander",    label: "Wanderlust",trait: "Wanderlust Potential" },
    ]},
  { key: "exercise", label: "Exercise", color: "#f87171",
    overallTrait: "Exercise needs - Overall",
    traits: [
      { key: "rat_exer_ovr",  label: "Overall",     trait: "Exercise needs - Overall", isOverall: true },
      { key: "rat_energy",    label: "Energy",      trait: "High Energy Level" },
      { key: "rat_intensity", label: "Intensity",   trait: "Intensity" },
      { key: "rat_exercise",  label: "Exercise",    trait: "Exercise Needs" },
      { key: "rat_play",      label: "Playfulness", trait: "Potential For Playfulness" },
    ]},
];

// flat lookup: traitKey → { cat, trait }
const RATING_TRAIT_MAP = Object.fromEntries(
  RATING_CATEGORIES.flatMap(cat => cat.traits.map(t => [t.key, { cat, t }]))
);

const COLUMNS = [
  ["Photo",        "photo",        false],
  ["Breed",        "name",         true],
  ["Origin",       "origin",       true],
  ["Min Wt",       "weight_min",   true],
  ["Max Wt",       "weight_max",   true],
  ["Height",       "height",       true],
  ["Lifespan",     "lifespan",     true],
  ["Coat",         "coat",         true],
  ["Purpose",      "purpose",      true],
  ["Exercise",     "exercise",     true],
  ["Grooming",     "grooming",     true],
  ["Shedding",     "shedding",     true],
  ["Trainability", "trainability", true],
  ["Temperament",  "temperament",  true],
  ["Health Notes", "health",       false],
  ["Kids",         "kids",         true],
  ["Dogs",         "dogs",         true],
  ["Svc",          "service_dog_score", true],
];

// ── Shared sub-components ───────────────────────────────────────────────────
function Badge({ text, bg = "#1e1e1e", color = "#aaa" }) {
  return (
    <span style={{ background: bg, color, fontSize: "0.68rem", padding: "2px 8px", borderRadius: 2, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function Dot({ level }) {
  return <span style={{ color: LEVEL_COLOR[level] || "#aaa", marginRight: 4 }}>●</span>;
}

function StatBar({ value, max, color = "#c8a96e" }) {
  return (
    <div style={{ background: "#1a1a1a", height: 4, borderRadius: 2, width: "100%", overflow: "hidden" }}>
      <div style={{ background: color, height: "100%", width: `${(value / max) * 100}%`, borderRadius: 2, transition: "width 0.4s" }} />
    </div>
  );
}

function RatingPips({ value, color = "#c8a96e" }) {
  if (value == null) return <span style={{ color: "#2a2a2a", fontSize: "0.7rem" }}>—</span>;
  return (
    <span style={{ letterSpacing: "0.03em", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= value ? color : "#252525" }}>●</span>
      ))}
    </span>
  );
}

// ── Sidebar components ──────────────────────────────────────────────────────
function SidebarSection({ title, sectionKey, collapsed, onToggle, activeCount, onClear, children }) {
  return (
    <div style={{ borderBottom: "1px solid #1a1a1a" }}>
      <div
        onClick={() => onToggle(sectionKey)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0.9rem", cursor: "pointer", userSelect: "none" }}
      >
        <span style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: activeCount > 0 ? "#e8d49a" : "#999", fontWeight: activeCount > 0 ? 600 : 400 }}>
          {title}{activeCount > 0 ? ` (${activeCount})` : ""}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {activeCount > 0 && (
            <span onClick={e => { e.stopPropagation(); onClear(sectionKey); }}
              style={{ fontSize: "0.6rem", color: "#c8a96e", cursor: "pointer", letterSpacing: "0.05em" }}>
              clear
            </span>
          )}
          <span style={{ color: "#444", fontSize: "0.65rem" }}>{collapsed ? "▸" : "▾"}</span>
        </div>
      </div>
      {!collapsed && (
        <div style={{ padding: "0 0.9rem 0.7rem" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Dual-handle range slider — both handles on one track
function DualRangeSlider({ globalMin, globalMax, value, onChange, step = 1, color = "#c8a96e" }) {
  const [low, high] = value;
  const span    = globalMax - globalMin || 1;
  const pctLow  = (low  - globalMin) / span * 100;
  const pctHigh = (high - globalMin) / span * 100;
  const mid     = (globalMin + globalMax) / 2;
  return (
    <div style={{ position: "relative", height: 18 }}>
      {/* track */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3,
                    background: "#1a1a1a", transform: "translateY(-50%)", borderRadius: 2, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: `${pctLow}%`, width: `${pctHigh - pctLow}%`,
                      height: "100%", background: color, borderRadius: 2 }} />
      </div>
      {/* thumb dots */}
      {[pctLow, pctHigh].map((pct, i) => (
        <div key={i} style={{ position: "absolute", top: "50%", left: `${pct}%`,
                              width: 10, height: 10, background: color, borderRadius: "50%",
                              border: "2px solid #0a0a0a", transform: "translate(-50%,-50%)",
                              pointerEvents: "none", zIndex: 3 }} />
      ))}
      {/* invisible low handle */}
      <input type="range" min={globalMin} max={globalMax} step={step} value={low}
        onChange={e => onChange([Math.min(+e.target.value, high), high])}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                 opacity: 0, cursor: "pointer", margin: 0, zIndex: low > mid ? 1 : 2 }} />
      {/* invisible high handle */}
      <input type="range" min={globalMin} max={globalMax} step={step} value={high}
        onChange={e => onChange([low, Math.max(+e.target.value, low)])}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                 opacity: 0, cursor: "pointer", margin: 0, zIndex: low > mid ? 2 : 1 }} />
    </div>
  );
}

// Labeled range filter (weight / height / lifespan)
function RangeFilter({ globalMin, globalMax, value, onChange, step, unit }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#c8a96e", fontSize: "0.68rem", marginBottom: "0.5rem" }}>
        <span>{value[0]}{unit}</span>
        <span>{value[1]}{unit}</span>
      </div>
      <DualRangeSlider globalMin={globalMin} globalMax={globalMax} value={value} onChange={onChange} step={step} />
    </div>
  );
}

// ── CSV export ───────────────────────────────────────────────────────────────
function downloadCSV(rows, filename = "breeds.csv") {
  const cols = [
    ["Name",           b => b.name],
    ["Origin",         b => b.origin],
    ["Min Wt (lbs)",   b => b.weight_lbs.min],
    ["Max Wt (lbs)",   b => b.weight_lbs.max],
    ["Min Ht (in)",    b => b.height_in.min],
    ["Max Ht (in)",    b => b.height_in.max],
    ["Min Life (yrs)", b => b.lifespan_yrs.min],
    ["Max Life (yrs)", b => b.lifespan_yrs.max],
    ["Coat",           b => b.coat],
    ["Purpose",        b => b.purpose.join("; ")],
    ["Exercise",       b => b.exercise],
    ["Grooming",       b => b.grooming],
    ["Shedding",       b => b.shedding],
    ["Trainability",   b => b.trainability],
    ["Temperament",    b => b.temperament.join("; ")],
    ["Kids",           b => b.good_with_kids ? "Yes" : "No"],
    ["Dogs",           b => b.good_with_dogs ? "Yes" : "No"],
    ["Service Score",  b => b.service_dog_score ?? ""],
    ["Health Notes",   b => b.health_notes],
  ];
  const esc   = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const lines = [
    cols.map(([h]) => h).join(","),
    ...rows.map(b => cols.map(([, fn]) => esc(fn(b))).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Main app ────────────────────────────────────────────────────────────────
export default function App() {
  const [breeds, setBreeds]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState("name-asc");
  const [photoModal, setPhotoModal] = useState(null);
  const [view, setView]             = useState("table");

  // Add breed modal state
  const [addModal, setAddModal]       = useState(false);
  const [addInput, setAddInput]       = useState("");
  const [addStatus, setAddStatus]     = useState(null);  // null | "loading" | {ok, breed, placeholders, error}
  const addInputRef                   = useRef(null);

  // Remove breed modal state
  const [removeTarget, setRemoveTarget] = useState(null);  // null | breed object
  const [removeStatus, setRemoveStatus] = useState(null);  // null | "loading" | {ok, ...}

  // Row selection & export
  const [selectedRows,   setSelectedRows]   = useState(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Ratings data: slug → flat trait map
  const [ratingsData, setRatingsData] = useState({});

  // Rating range filters: traitKey → [min, max]  (absent or [1,5] = no filter)
  const [ratingFilters, setRatingFilters] = useState({});

  // Which rating categories are visible as table columns
  const [visibleRatingCats, setVisibleRatingCats] = useState(
    () => new Set(RATING_CATEGORIES.map(c => c.key))
  );

  // Sidebar open/close (default closed on mobile)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 700
  );

  // Sidebar filter state
  const [activeFilters, setActiveFilters] = useState({});
  const [weightRange,   setWeightRange]   = useState([0, 999]);
  const [heightRange,   setHeightRange]   = useState([0, 99]);
  const [lifespanRange, setLifespanRange] = useState([0, 99]);
  const [svcScoreRange, setSvcScoreRange] = useState([1, 5]);
  const [collapsedSections, setCollapsedSections] = useState(() =>
    new Set(["coat", "temperament", "rat_adaptability", "rat_friendliness", "rat_health", "rat_trainability", "rat_exercise"])
  );
  const rangesInited = useRef(false);

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => r.json())
      .then(data => { setBreeds(data); setLoading(false); })
      .catch(() => { setBreeds(INLINE_DATA); setLoading(false); });
  }, []);

  useEffect(() => {
    fetch(RATINGS_URL)
      .then(r => r.json())
      .then(data => setRatingsData(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") setPhotoModal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Merge ratings into breed objects
  const breedsWithRatings = useMemo(() => {
    if (!breeds.length) return breeds;
    const hasRatings = Object.keys(ratingsData).length > 0;
    return breeds.map(b => ({
      ...b,
      ratings: hasRatings ? (ratingsData[b.dogtime_slug] || null) : null,
    }));
  }, [breeds, ratingsData]);

  // Compute global min/max from full dataset
  const dataRanges = useMemo(() => {
    if (!breeds.length) return { weight: [0, 300], height: [0, 45], lifespan: [0, 25] };
    return {
      weight:   [Math.min(...breeds.map(b => b.weight_lbs.min)),   Math.max(...breeds.map(b => b.weight_lbs.max))],
      height:   [Math.min(...breeds.map(b => b.height_in.min)),    Math.max(...breeds.map(b => b.height_in.max))],
      lifespan: [Math.min(...breeds.map(b => b.lifespan_yrs.min)), Math.max(...breeds.map(b => b.lifespan_yrs.max))],
    };
  }, [breeds]);

  useEffect(() => {
    if (breeds.length && !rangesInited.current) {
      rangesInited.current = true;
      setWeightRange([...dataRanges.weight]);
      setHeightRange([...dataRanges.height]);
      setLifespanRange([...dataRanges.lifespan]);
    }
  }, [breeds, dataRanges]);

  const distinctValues = useMemo(() => {
    if (!breeds.length) return {};
    const order = (vals, ord) => ord ? ord.filter(v => vals.has(v)) : [...vals].sort();
    return {
      origin:       order(new Set(breeds.map(b => b.origin)), null),
      purpose:      order(new Set(breeds.flatMap(b => b.purpose)), null),
      exercise:     order(new Set(breeds.map(b => b.exercise)), LEVEL_ORDER),
      grooming:     order(new Set(breeds.map(b => b.grooming)), LEVEL_ORDER),
      shedding:     order(new Set(breeds.map(b => b.shedding)), LEVEL_ORDER),
      trainability: order(new Set(breeds.map(b => b.trainability)), TRAIN_ORDER),
      coat:         order(new Set(breeds.map(b => b.coat)), null),
      temperament:  order(new Set(breeds.flatMap(b => b.temperament)), null),
    };
  }, [breeds]);

  const toggleFilter = (field, value) => {
    setActiveFilters(prev => {
      const cur = new Set(prev[field] || []);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      return { ...prev, [field]: cur };
    });
  };

  const clearSection = (field) => {
    if (field === "weight")    { setWeightRange([...dataRanges.weight]);     return; }
    if (field === "height")    { setHeightRange([...dataRanges.height]);     return; }
    if (field === "lifespan")  { setLifespanRange([...dataRanges.lifespan]); return; }
    if (field === "svc_score") { setSvcScoreRange([1, 5]);                   return; }
    // rating category clear
    const ratCat = RATING_CATEGORIES.find(c => `rat_${c.key}` === field);
    if (ratCat) {
      setRatingFilters(prev => {
        const next = { ...prev };
        ratCat.traits.forEach(t => { delete next[t.key]; });
        return next;
      });
      return;
    }
    setActiveFilters(prev => ({ ...prev, [field]: new Set() }));
  };

  const ratingFilterActive = (traitKey) => { const v = ratingFilters[traitKey] || [1, 5]; return v[0] > 1 || v[1] < 5; };
  const ratingCatActiveCount = (catKey) => {
    const cat = RATING_CATEGORIES.find(c => c.key === catKey);
    return cat ? cat.traits.filter(t => ratingFilterActive(t.key)).length : 0;
  };

  const hasAnyFilter = useMemo(() => {
    if (Object.values(activeFilters).some(s => s.size > 0)) return true;
    if (weightRange[0]   > dataRanges.weight[0]   || weightRange[1]   < dataRanges.weight[1])   return true;
    if (heightRange[0]   > dataRanges.height[0]   || heightRange[1]   < dataRanges.height[1])   return true;
    if (lifespanRange[0] > dataRanges.lifespan[0] || lifespanRange[1] < dataRanges.lifespan[1]) return true;
    if (svcScoreRange[0] > 1 || svcScoreRange[1] < 5) return true;
    if (Object.values(ratingFilters).some(v => v[0] > 1 || v[1] < 5)) return true;
    return false;
  }, [activeFilters, weightRange, heightRange, lifespanRange, svcScoreRange, dataRanges, ratingFilters]);

  const clearAll = () => {
    setActiveFilters({});
    setWeightRange([...dataRanges.weight]);
    setHeightRange([...dataRanges.height]);
    setLifespanRange([...dataRanges.lifespan]);
    setSvcScoreRange([1, 5]);
    setRatingFilters({});
  };

  const toggleRow = (slug) => setSelectedRows(prev => {
    const next = new Set(prev);
    next.has(slug) ? next.delete(slug) : next.add(slug);
    return next;
  });

  const toggleSection = (key) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const activeCount = (field) => (activeFilters[field] || new Set()).size;
  const rangeActive = (range, dataRange) => range[0] > dataRange[0] || range[1] < dataRange[1];

  // Add breed: POST to local API server
  const handleAddBreed = async () => {
    const name = addInput.trim();
    if (!name) return;
    setAddStatus("loading");
    try {
      const resp = await fetch("/api/add-breed", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name }),
      });
      const data = await resp.json();
      setAddStatus(data);
      if (data.ok) {
        // Reload breeds list
        fetch(DATA_URL).then(r => r.json()).then(setBreeds).catch(() => {});
        fetch(RATINGS_URL).then(r => r.json()).then(setRatingsData).catch(() => {});
        setAddInput("");
      }
    } catch {
      setAddStatus({
        ok:    false,
        error: "Could not reach the API. Make sure you are running server.py (not python -m http.server).",
        cli:   `python add_breed.py "${name}"`,
      });
    }
  };

  const handleRemoveBreed = async () => {
    if (!removeTarget) return;
    setRemoveStatus("loading");
    try {
      const resp = await fetch("/api/remove-breed", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: removeTarget.name }),
      });
      const data = await resp.json();
      setRemoveStatus(data);
      if (data.ok) {
        fetch(DATA_URL).then(r => r.json()).then(setBreeds).catch(() => {});
        fetch(RATINGS_URL).then(r => r.json()).then(setRatingsData).catch(() => {});
      }
    } catch {
      setRemoveStatus({
        ok:    false,
        error: "Could not reach the API. Make sure you are running server.py.",
        cli:   `python add_breed.py "${removeTarget.name}" --remove`,
      });
    }
  };

  const handleColumnSort = (field, sortable) => {
    if (!sortable) return;
    const [cur, dir] = sortBy.split("-");
    setSortBy(cur === field ? `${field}-${dir === "asc" ? "desc" : "asc"}` : `${field}-asc`);
  };

  const filtered = useMemo(() => {
    const getSet = (f) => activeFilters[f] || new Set();
    let list = breedsWithRatings.filter(b => {
      const q = search.toLowerCase();
      if (q && ![b.name, b.origin, ...b.temperament, ...b.purpose].join(" ").toLowerCase().includes(q)) return false;
      if (b.weight_lbs.max   < weightRange[0]   || b.weight_lbs.min   > weightRange[1])   return false;
      if (b.height_in.max    < heightRange[0]   || b.height_in.min    > heightRange[1])   return false;
      if (b.lifespan_yrs.max < lifespanRange[0] || b.lifespan_yrs.min > lifespanRange[1]) return false;
      if ((svcScoreRange[0] > 1 || svcScoreRange[1] < 5) &&
          (b.service_dog_score == null || b.service_dog_score < svcScoreRange[0] || b.service_dog_score > svcScoreRange[1])) return false;
      if (getSet("origin").size       && !getSet("origin").has(b.origin))                         return false;
      if (getSet("exercise").size     && !getSet("exercise").has(b.exercise))                     return false;
      if (getSet("grooming").size     && !getSet("grooming").has(b.grooming))                     return false;
      if (getSet("shedding").size     && !getSet("shedding").has(b.shedding))                     return false;
      if (getSet("trainability").size && !getSet("trainability").has(b.trainability))             return false;
      if (getSet("coat").size         && !getSet("coat").has(b.coat))                             return false;
      if (getSet("purpose").size      && !b.purpose.some(p     => getSet("purpose").has(p)))     return false;
      if (getSet("temperament").size  && !b.temperament.some(t => getSet("temperament").has(t))) return false;
      if (getSet("kids").size         && !getSet("kids").has(b.good_with_kids ? "Yes" : "No"))   return false;
      if (getSet("dogs").size         && !getSet("dogs").has(b.good_with_dogs ? "Yes" : "No"))   return false;
      // rating range filters
      for (const [traitKey, range] of Object.entries(ratingFilters)) {
        const [lo, hi] = range || [1, 5];
        if (lo <= 1 && hi >= 5) continue;
        const info = RATING_TRAIT_MAP[traitKey];
        if (!info) continue;
        const score = b.ratings?.[info.t.trait];
        if (score == null || score < lo || score > hi) return false;
      }
      return true;
    });

    const [field, dir] = sortBy.split("-");
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (field === "name")         cmp = a.name.localeCompare(b.name);
      if (field === "origin")       cmp = a.origin.localeCompare(b.origin);
      if (field === "weight_min")   cmp = a.weight_lbs.min - b.weight_lbs.min;
      if (field === "weight_max")   cmp = a.weight_lbs.max - b.weight_lbs.max;
      if (field === "height")       cmp = a.height_in.min - b.height_in.min;
      if (field === "lifespan")     cmp = a.lifespan_yrs.max - b.lifespan_yrs.max;
      if (field === "coat")         cmp = a.coat.localeCompare(b.coat);
      if (field === "purpose")      cmp = a.purpose[0].localeCompare(b.purpose[0]);
      if (field === "exercise")     cmp = LEVEL_ORDER.indexOf(a.exercise) - LEVEL_ORDER.indexOf(b.exercise);
      if (field === "grooming")     cmp = LEVEL_ORDER.indexOf(a.grooming) - LEVEL_ORDER.indexOf(b.grooming);
      if (field === "shedding")     cmp = LEVEL_ORDER.indexOf(a.shedding) - LEVEL_ORDER.indexOf(b.shedding);
      if (field === "trainability") cmp = TRAIN_ORDER.indexOf(a.trainability) - TRAIN_ORDER.indexOf(b.trainability);
      if (field === "temperament")  cmp = a.temperament[0].localeCompare(b.temperament[0]);
      if (field === "kids")         cmp = (a.good_with_kids ? 1 : 0) - (b.good_with_kids ? 1 : 0);
      if (field === "dogs")         cmp = (a.good_with_dogs ? 1 : 0) - (b.good_with_dogs ? 1 : 0);
      if (field === "service_dog_score") cmp = (a.service_dog_score ?? -1) - (b.service_dog_score ?? -1);
      // rating sort
      const ratInfo = RATING_TRAIT_MAP[field];
      if (ratInfo) {
        const va = a.ratings?.[ratInfo.t.trait] ?? 0;
        const vb = b.ratings?.[ratInfo.t.trait] ?? 0;
        cmp = va - vb;
      }
      return dir === "desc" ? -cmp : cmp;
    });
  }, [breedsWithRatings, search, sortBy, activeFilters, weightRange, heightRange, lifespanRange, svcScoreRange, ratingFilters]);

  const allVisibleSelected = filtered.length > 0 && filtered.every(b => selectedRows.has(b.dogtime_slug));
  const someVisibleSelected = filtered.some(b => selectedRows.has(b.dogtime_slug));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedRows(prev => { const next = new Set(prev); filtered.forEach(b => next.delete(b.dogtime_slug)); return next; });
    } else {
      setSelectedRows(prev => { const next = new Set(prev); filtered.forEach(b => next.add(b.dogtime_slug)); return next; });
    }
  };

  const fmt  = b => `${b.weight_lbs.min}–${b.weight_lbs.max} lbs`;
  const fmtH = b => `${b.height_in.min}–${b.height_in.max} in`;
  const fmtL = b => b.lifespan_yrs.min === b.lifespan_yrs.max
    ? `${b.lifespan_yrs.min} yrs`
    : `${b.lifespan_yrs.min}–${b.lifespan_yrs.max} yrs`;

  const [sortField, sortDir] = sortBy.split("-");

  const CheckboxSection = ({ field, values, getVal = v => v, descMap = {} }) => (
    <>
      {values.map(v => {
        const checked = (activeFilters[field] || new Set()).has(v);
        const desc = descMap[v];
        return (
          <label key={v} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "0.76rem", color: checked ? "#e8e0d0" : "#888", cursor: "pointer", marginBottom: "0.45rem", userSelect: "none" }}>
            <input type="checkbox" checked={checked}
              onChange={() => toggleFilter(field, v)}
              style={{ accentColor: "#c8a96e", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div>{getVal(v)}</div>
              {desc && <div style={{ fontSize: "0.58rem", color: "#3a3a3a", marginTop: 1, lineHeight: 1.35 }}>{desc}</div>}
            </div>
          </label>
        );
      })}
    </>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", color: "#c8a96e", fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "0.05em" }}>
      Loading dataset…
    </div>
  );

  const isMobile = typeof window !== "undefined" && window.innerWidth < 700;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#e8e0d0", fontFamily: "'Inter', system-ui, sans-serif", display: "flex" }}>

      {/* ── Add Breed modal ── */}
      {addModal && (
        <div onClick={() => { setAddModal(false); setAddStatus(null); setAddInput(""); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#111", border: "1px solid #2a2a2a", padding: "1.8rem 2rem", width: 420, maxWidth: "92vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <span style={{ color: "#c8a96e", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Add Breed</span>
              <button onClick={() => { setAddModal(false); setAddStatus(null); setAddInput(""); }}
                style={{ background: "none", border: "none", color: "#555", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#555", marginBottom: "1rem", lineHeight: 1.6 }}>
              Enter the breed name as it appears on DogTime. The app will find the page,
              extract available data, and scrape star ratings automatically.
              Requires <code style={{ color: "#c8a96e" }}>python server.py</code> (not <code style={{ color: "#666" }}>http.server</code>).
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                ref={addInputRef}
                value={addInput}
                onChange={e => { setAddInput(e.target.value); setAddStatus(null); }}
                onKeyDown={e => { if (e.key === "Enter") handleAddBreed(); }}
                placeholder="e.g. Samoyed, Border Collie…"
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e0d0", padding: "0.5rem 0.8rem", fontFamily: "inherit", fontSize: "0.82rem", outline: "none" }}
              />
              <button onClick={handleAddBreed}
                disabled={addStatus === "loading" || !addInput.trim()}
                style={{ background: "#c8a96e", color: "#0d0d0d", border: "none", padding: "0.5rem 1rem", fontFamily: "inherit", fontSize: "0.75rem", letterSpacing: "0.1em", cursor: "pointer", opacity: addStatus === "loading" ? 0.6 : 1 }}>
                {addStatus === "loading" ? "Adding…" : "Add"}
              </button>
            </div>

            {/* Result area */}
            {addStatus && addStatus !== "loading" && (
              <div style={{ fontSize: "0.72rem", borderTop: "1px solid #1e1e1e", paddingTop: "0.9rem" }}>
                {addStatus.ok ? (
                  <div>
                    <div style={{ color: "#4ade80", marginBottom: "0.5rem" }}>
                      ✓ Added: <strong>{addStatus.breed?.name}</strong>
                    </div>
                    {addStatus.placeholders?.length > 0 && (
                      <div style={{ color: "#888", lineHeight: 1.7 }}>
                        <div style={{ color: "#facc15", marginBottom: "0.3rem" }}>Fields needing manual update:</div>
                        {addStatus.placeholders.map(p => (
                          <div key={p} style={{ paddingLeft: "0.8rem" }}>• {p}</div>
                        ))}
                        <div style={{ marginTop: "0.5rem", color: "#555" }}>Edit large_dog_breeds.json to fill these in.</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ color: "#f87171", marginBottom: "0.5rem" }}>{addStatus.error}</div>
                    {addStatus.cli && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <div style={{ color: "#888", marginBottom: "0.3rem" }}>Run this command instead:</div>
                        <code style={{ display: "block", background: "#0a0a0a", padding: "0.4rem 0.6rem", color: "#c8a96e", fontSize: "0.72rem", userSelect: "all" }}>
                          {addStatus.cli}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Remove Breed modal ── */}
      {removeTarget && (
        <div onClick={() => { if (removeStatus !== "loading") { setRemoveTarget(null); setRemoveStatus(null); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#111", border: "1px solid #2a2a2a", padding: "1.8rem 2rem", width: 400, maxWidth: "92vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <span style={{ color: "#f87171", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Remove Breed</span>
              <button onClick={() => { setRemoveTarget(null); setRemoveStatus(null); }}
                style={{ background: "none", border: "none", color: "#555", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            {removeStatus?.ok ? (
              <div style={{ fontSize: "0.8rem", color: "#4ade80" }}>
                ✓ Removed: <strong>{removeStatus.name}</strong>
                <div style={{ marginTop: "0.8rem" }}>
                  <button onClick={() => { setRemoveTarget(null); setRemoveStatus(null); }}
                    style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", padding: "0.4rem 1rem", fontFamily: "inherit", fontSize: "0.75rem", cursor: "pointer" }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.82rem", color: "#aaa", marginBottom: "1.4rem", lineHeight: 1.6 }}>
                  Remove <strong style={{ color: "#e8e0d0" }}>{removeTarget.name}</strong> from the database?
                  This will delete its image and ratings files and cannot be undone.
                </p>
                {removeStatus && removeStatus !== "loading" && !removeStatus.ok && (
                  <div style={{ fontSize: "0.72rem", marginBottom: "1rem" }}>
                    <div style={{ color: "#f87171", marginBottom: "0.4rem" }}>{removeStatus.error}</div>
                    {removeStatus.cli && (
                      <code style={{ display: "block", background: "#0a0a0a", padding: "0.4rem 0.6rem", color: "#c8a96e", fontSize: "0.72rem", userSelect: "all" }}>
                        {removeStatus.cli}
                      </code>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button onClick={handleRemoveBreed}
                    disabled={removeStatus === "loading"}
                    style={{ background: "#3a0a0a", color: "#f87171", border: "1px solid #5a1a1a", padding: "0.45rem 1.1rem", fontFamily: "inherit", fontSize: "0.75rem", letterSpacing: "0.1em", cursor: "pointer", opacity: removeStatus === "loading" ? 0.6 : 1 }}>
                    {removeStatus === "loading" ? "Removing…" : "Yes, Remove"}
                  </button>
                  <button onClick={() => { setRemoveTarget(null); setRemoveStatus(null); }}
                    disabled={removeStatus === "loading"}
                    style={{ background: "#1a1a1a", color: "#888", border: "1px solid #333", padding: "0.45rem 1rem", fontFamily: "inherit", fontSize: "0.75rem", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Photo modal ── */}
      {photoModal && (
        <div onClick={() => setPhotoModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={`images/${photoModal.dogtime_slug}.jpg`} alt={photoModal.name}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "80vw", maxHeight: "78vh", objectFit: "contain", boxShadow: "0 0 60px rgba(0,0,0,0.8)", cursor: "default" }}
            onError={e => { e.target.style.display = "none"; }} />
          <div style={{ marginTop: "1rem", color: "#c8a96e", fontSize: "1rem", letterSpacing: "0.15em" }}>{photoModal.name}</div>
          <button onClick={() => setPhotoModal(null)}
            style={{ position: "fixed", top: 20, right: 28, background: "none", border: "none", color: "#888", fontSize: "2rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Sidebar mobile backdrop ── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 49 }} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: isMobile ? 230 : (sidebarOpen ? 210 : 0),
        flexShrink: 0,
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        left: isMobile ? (sidebarOpen ? 0 : -230) : "auto",
        height: "100vh",
        overflowY: sidebarOpen ? "auto" : "hidden",
        overflowX: "hidden",
        borderRight: "1px solid #1a1a1a", background: "#0a0a0a",
        scrollbarWidth: "thin", scrollbarColor: "#222 transparent",
        transition: "width 0.22s ease, left 0.22s ease",
        zIndex: isMobile ? 50 : "auto",
      }}>
        <div style={{ padding: "1rem 0.9rem 0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555" }}>Filters</span>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <button onClick={() => setSidebarOpen(false)} title="Close filters"
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1.6rem", padding: "0 0.1rem", lineHeight: 1, fontFamily: "inherit" }}>
              ‹
            </button>
          </div>
        </div>
        <div style={{ padding: "0 0.9rem 0.6rem" }}>
          <button onClick={clearAll}
            disabled={!hasAnyFilter}
            style={{ width: "100%", background: hasAnyFilter ? "#1a1a1a" : "#111", color: hasAnyFilter ? "#c8a96e" : "#333",
                     border: `1px solid ${hasAnyFilter ? "#333" : "#1a1a1a"}`, padding: "0.38rem 0.5rem",
                     fontFamily: "inherit", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
                     cursor: hasAnyFilter ? "pointer" : "default", transition: "all 0.15s" }}>
            Clear Filters
          </button>
        </div>

        {/* Weight range */}
        <SidebarSection title="Weight (lbs)" sectionKey="weight"
          collapsed={collapsedSections.has("weight")} onToggle={toggleSection}
          activeCount={rangeActive(weightRange, dataRanges.weight) ? 1 : 0}
          onClear={clearSection}>
          <RangeFilter globalMin={dataRanges.weight[0]} globalMax={dataRanges.weight[1]}
            value={weightRange} onChange={setWeightRange} step={5} unit=" lbs" />
        </SidebarSection>

        {/* Height range */}
        <SidebarSection title="Height (in)" sectionKey="height"
          collapsed={collapsedSections.has("height")} onToggle={toggleSection}
          activeCount={rangeActive(heightRange, dataRanges.height) ? 1 : 0}
          onClear={clearSection}>
          <RangeFilter globalMin={dataRanges.height[0]} globalMax={dataRanges.height[1]}
            value={heightRange} onChange={setHeightRange} step={0.5} unit='"' />
        </SidebarSection>

        {/* Lifespan range */}
        <SidebarSection title="Lifespan (yrs)" sectionKey="lifespan"
          collapsed={collapsedSections.has("lifespan")} onToggle={toggleSection}
          activeCount={rangeActive(lifespanRange, dataRanges.lifespan) ? 1 : 0}
          onClear={clearSection}>
          <RangeFilter globalMin={dataRanges.lifespan[0]} globalMax={dataRanges.lifespan[1]}
            value={lifespanRange} onChange={setLifespanRange} step={1} unit=" yrs" />
        </SidebarSection>

        {/* Service Score range filter */}
        <SidebarSection title="Service Score" sectionKey="svc_score"
          collapsed={collapsedSections.has("svc_score")} onToggle={toggleSection}
          activeCount={rangeActive(svcScoreRange, [1, 5]) ? 1 : 0}
          onClear={clearSection}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#c8a96e", fontSize: "0.68rem", marginBottom: "0.5rem" }}>
            <span>{svcScoreRange[0]}</span><span>{svcScoreRange[1]}</span>
          </div>
          <DualRangeSlider globalMin={1} globalMax={5} step={1}
            value={svcScoreRange} onChange={setSvcScoreRange} color="#c8a96e" />
        </SidebarSection>

        {/* Origin */}
        <SidebarSection title="Origin" sectionKey="origin"
          collapsed={collapsedSections.has("origin")} onToggle={toggleSection}
          activeCount={activeCount("origin")} onClear={clearSection}>
          <CheckboxSection field="origin" values={distinctValues.origin || []} />
        </SidebarSection>

        {/* Purpose */}
        <SidebarSection title="Purpose" sectionKey="purpose"
          collapsed={collapsedSections.has("purpose")} onToggle={toggleSection}
          activeCount={activeCount("purpose")} onClear={clearSection}>
          <CheckboxSection field="purpose" values={distinctValues.purpose || []} />
        </SidebarSection>

        {/* Exercise */}
        <SidebarSection title="Exercise" sectionKey="exercise"
          collapsed={collapsedSections.has("exercise")} onToggle={toggleSection}
          activeCount={activeCount("exercise")} onClear={clearSection}>
          <CheckboxSection field="exercise" values={distinctValues.exercise || []} descMap={EXERCISE_DESC} />
        </SidebarSection>

        {/* Grooming */}
        <SidebarSection title="Grooming" sectionKey="grooming"
          collapsed={collapsedSections.has("grooming")} onToggle={toggleSection}
          activeCount={activeCount("grooming")} onClear={clearSection}>
          <CheckboxSection field="grooming" values={distinctValues.grooming || []} descMap={GROOMING_DESC} />
        </SidebarSection>

        {/* Shedding */}
        <SidebarSection title="Shedding" sectionKey="shedding"
          collapsed={collapsedSections.has("shedding")} onToggle={toggleSection}
          activeCount={activeCount("shedding")} onClear={clearSection}>
          <CheckboxSection field="shedding" values={distinctValues.shedding || []} descMap={SHEDDING_DESC} />
        </SidebarSection>

        {/* Trainability */}
        <SidebarSection title="Trainability" sectionKey="trainability"
          collapsed={collapsedSections.has("trainability")} onToggle={toggleSection}
          activeCount={activeCount("trainability")} onClear={clearSection}>
          <CheckboxSection field="trainability" values={distinctValues.trainability || []} descMap={TRAIN_DESC} />
        </SidebarSection>

        {/* Good with */}
        <SidebarSection title="Good With" sectionKey="compat"
          collapsed={collapsedSections.has("compat")} onToggle={toggleSection}
          activeCount={activeCount("kids") + activeCount("dogs")}
          onClear={() => { clearSection("kids"); clearSection("dogs"); }}>
          <CheckboxSection field="kids" values={["Yes", "No"]} getVal={v => `Kids — ${v}`} />
          <CheckboxSection field="dogs" values={["Yes", "No"]} getVal={v => `Dogs — ${v}`} />
        </SidebarSection>

        {/* Coat (collapsed by default) */}
        <SidebarSection title="Coat" sectionKey="coat"
          collapsed={collapsedSections.has("coat")} onToggle={toggleSection}
          activeCount={activeCount("coat")} onClear={clearSection}>
          <CheckboxSection field="coat" values={distinctValues.coat || []} />
        </SidebarSection>

        {/* Temperament (collapsed by default) */}
        <SidebarSection title="Temperament" sectionKey="temperament"
          collapsed={collapsedSections.has("temperament")} onToggle={toggleSection}
          activeCount={activeCount("temperament")} onClear={clearSection}>
          <CheckboxSection field="temperament" values={distinctValues.temperament || []} />
        </SidebarSection>

        {/* ── DogTime Rating Filters ── */}
        <div style={{ padding: "0.6rem 0.9rem 0.3rem", borderTop: "1px solid #1e1e1e" }}>
          <span style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#444" }}>
            DogTime Ratings
          </span>
        </div>

        {RATING_CATEGORIES.map(cat => (
          <SidebarSection key={cat.key}
            title={cat.label}
            sectionKey={`rat_${cat.key}`}
            collapsed={collapsedSections.has(`rat_${cat.key}`)}
            onToggle={toggleSection}
            activeCount={ratingCatActiveCount(cat.key)}
            onClear={clearSection}>
            {cat.traits.map(t => {
              const range = ratingFilters[t.key] || [1, 5];
              const isActive = range[0] > 1 || range[1] < 5;
              return (
                <div key={t.key} style={{ marginBottom: "0.6rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem",
                                color: isActive ? cat.color : "#555", marginBottom: "0.3rem" }}>
                    <span>{t.label}</span>
                    <span>{isActive ? `${range[0]}–${range[1]}` : "any"}</span>
                  </div>
                  <DualRangeSlider globalMin={1} globalMax={5} step={1}
                    value={range}
                    onChange={v => setRatingFilters(prev => ({ ...prev, [t.key]: v }))}
                    color={cat.color} />
                </div>
              );
            })}
          </SidebarSection>
        ))}
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ borderBottom: "1px solid #222", padding: isMobile ? "0.8rem 0.9rem 0.7rem" : "1.8rem 2rem 1.2rem", position: "sticky", top: 0, background: "#0d0d0d", zIndex: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
              {/* Hamburger — only visible when sidebar is closed */}
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} title="Show filters"
                  style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: "0.1rem 0.15rem", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  <span style={{ display: "block", width: 18, height: 2, background: "currentColor", borderRadius: 1 }} />
                  <span style={{ display: "block", width: 18, height: 2, background: "currentColor", borderRadius: 1 }} />
                  <span style={{ display: "block", width: 18, height: 2, background: "currentColor", borderRadius: 1 }} />
                </button>
              )}
              <div>
                <h1 style={{ margin: 0, fontSize: "clamp(1rem, 2vw, 1.8rem)", fontWeight: 400, letterSpacing: "0.15em", color: "#c8a96e", textTransform: "uppercase" }}>
                  Large Dog Breeds
                </h1>
                <p style={{ margin: "0.1rem 0 0", color: "#555", fontSize: "0.72rem", letterSpacing: "0.08em" }}>
                  {filtered.length} of {breeds.length} breeds{hasAnyFilter ? " · filters active" : ""}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
              {["table", "cards"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  background: view === v ? "#c8a96e" : "#1a1a1a", color: view === v ? "#0d0d0d" : "#777",
                  border: "1px solid #333", padding: "0.35rem 0.9rem", fontFamily: "inherit",
                  fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                }}>{v}</button>
              ))}
              <a href="analysis.html"
                style={{ background: "#1a1a1a", color: "#888", border: "1px solid #333", padding: "0.35rem 0.9rem",
                         fontFamily: "inherit", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase",
                         textDecoration: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                Svc Analysis
              </a>
              {/* Export button */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowExportMenu(v => !v)}
                  style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", padding: "0.35rem 0.9rem",
                           fontFamily: "inherit", fontSize: "0.72rem", letterSpacing: "0.1em", cursor: "pointer" }}>
                  Export ▾
                </button>
                {showExportMenu && (
                  <div style={{ position: "absolute", right: 0, top: "110%", background: "#111", border: "1px solid #2a2a2a",
                                zIndex: 30, minWidth: 160, boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
                    {[
                      ["Visible rows",  () => downloadCSV(filtered, "breeds-visible.csv")],
                      ["Selected rows", () => downloadCSV(breedsWithRatings.filter(b => selectedRows.has(b.dogtime_slug)), "breeds-selected.csv")],
                    ].map(([label, action]) => (
                      <button key={label} onClick={() => { action(); setShowExportMenu(false); }}
                        style={{ display: "block", width: "100%", background: "none", border: "none", color: "#aaa",
                                 padding: "0.55rem 0.9rem", fontFamily: "inherit", fontSize: "0.75rem",
                                 textAlign: "left", cursor: "pointer", letterSpacing: "0.06em" }}
                        onMouseEnter={e => e.target.style.background = "#1a1a1a"}
                        onMouseLeave={e => e.target.style.background = "none"}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!isMobile && (
                <button onClick={() => { setAddModal(true); setAddStatus(null); setTimeout(() => addInputRef.current?.focus(), 50); }}
                  style={{ background: "#1a1a1a", color: "#c8a96e", border: "1px solid #333", padding: "0.35rem 0.9rem", fontFamily: "inherit", fontSize: "0.72rem", letterSpacing: "0.1em", cursor: "pointer" }}>
                  + Add Breed
                </button>
              )}
            </div>
          </div>
          <div style={{ marginTop: "0.7rem" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, origin, purpose, temperament…"
              style={{ background: "#151515", border: "1px solid #2a2a2a", color: "#e8e0d0", padding: "0.45rem 0.9rem", fontFamily: "inherit", fontSize: "0.82rem", width: isMobile ? "100%" : 260, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ padding: isMobile ? "0.8rem 0.75rem 3rem" : "1.5rem 2rem 3rem" }}>

          {/* ── TABLE VIEW ── */}
          {view === "table" && (
            <>
              {/* Category visibility toggles */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
                <span style={{ fontSize: "0.6rem", color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 2 }}>
                  Rating columns:
                </span>
                {RATING_CATEGORIES.map(cat => {
                  const active = visibleRatingCats.has(cat.key);
                  return (
                    <button key={cat.key}
                      onClick={() => setVisibleRatingCats(prev => {
                        const next = new Set(prev);
                        next.has(cat.key) ? next.delete(cat.key) : next.add(cat.key);
                        return next;
                      })}
                      style={{
                        background: active ? cat.color + "18" : "#131313",
                        color: active ? cat.color : "#333",
                        border: `1px solid ${active ? cat.color + "55" : "#1e1e1e"}`,
                        padding: "0.2rem 0.55rem",
                        fontFamily: "inherit",
                        fontSize: "0.6rem",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}>
                      {cat.label}
                    </button>
                  );
                })}
                {visibleRatingCats.size < RATING_CATEGORIES.length && (
                  <button
                    onClick={() => setVisibleRatingCats(new Set(RATING_CATEGORIES.map(c => c.key)))}
                    style={{ background: "none", border: "none", color: "#444", fontSize: "0.6rem", cursor: "pointer", padding: "0.2rem 0.3rem", fontFamily: "inherit" }}>
                    show all
                  </button>
                )}
              </div>

              <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 230px)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                  <thead>
                    {/* Row 1: checkbox + existing columns (rowSpan=2) + category group headers */}
                    <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                      {/* Select-all checkbox */}
                      <th rowSpan={2} style={{ padding: "0.4rem 0.5rem", position: "sticky", top: 0,
                                              background: "#0d0d0d", zIndex: 8, verticalAlign: "bottom" }}>
                        <input type="checkbox"
                          checked={allVisibleSelected}
                          ref={el => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected; }}
                          onChange={toggleSelectAllVisible}
                          style={{ accentColor: "#c8a96e", cursor: "pointer", width: 13, height: 13 }} />
                      </th>
                      {COLUMNS.map(([label, field, sortable]) => {
                        const active = sortable && sortField === field;
                        const isPhoto = field === "photo";
                        const isBreed = field === "name";
                        return (
                          <th key={field} rowSpan={2}
                            onClick={() => handleColumnSort(field, sortable)}
                            style={{
                              padding: "0.55rem 0.7rem", textAlign: "left",
                              color: active ? "#e8d49a" : "#c8a96e", fontWeight: active ? 600 : 400,
                              fontSize: "0.73rem", letterSpacing: "0.1em", textTransform: "uppercase",
                              whiteSpace: "nowrap", cursor: sortable ? "pointer" : "default", userSelect: "none",
                              position: "sticky", top: 0, background: "#0d0d0d",
                              verticalAlign: "bottom",
                              ...(isPhoto ? { left: 0, zIndex: 12, minWidth: 64 } :
                                   isBreed && !isMobile ? { left: 64, zIndex: 12 } :
                                             { zIndex: 8 }),
                            }}>
                            {label}{active ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                          </th>
                        );
                      })}
                      {/* Rating category group headers */}
                      {RATING_CATEGORIES.filter(c => visibleRatingCats.has(c.key)).map(cat => (
                        <th key={cat.key}
                          colSpan={cat.traits.length}
                          style={{
                            padding: "0.4rem 0.5rem",
                            textAlign: "center",
                            color: cat.color,
                            fontSize: "0.66rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            position: "sticky", top: 0, background: "#0d0d0d", zIndex: 8,
                            borderLeft: `2px solid ${cat.color}33`,
                            borderBottom: `1px solid ${cat.color}33`,
                          }}>
                          {cat.label}
                        </th>
                      ))}
                      {/* Delete column header */}
                      <th rowSpan={2} style={{ padding: 0, position: "sticky", top: 0, background: "#0d0d0d", zIndex: 8, minWidth: 28 }} />
                    </tr>
                    {/* Row 2: individual trait column headers */}
                    <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                      {RATING_CATEGORIES.filter(c => visibleRatingCats.has(c.key)).flatMap(cat =>
                        cat.traits.map((t, i) => {
                          const active = sortField === t.key;
                          const isOvr  = t.isOverall;
                          return (
                            <th key={t.key}
                              title={t.trait}
                              onClick={() => handleColumnSort(t.key, true)}
                              style={{
                                padding: "0.35rem 0.4rem",
                                textAlign: "left",
                                color: active ? "#e8d49a" : isOvr ? cat.color : cat.color + "cc",
                                fontWeight: active || isOvr ? 600 : 400,
                                fontSize: "0.64rem",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                cursor: "pointer",
                                userSelect: "none",
                                position: "sticky", top: 32, background: isOvr ? cat.color + "0e" : "#0d0d0d", zIndex: 8,
                                borderLeft: i === 0 ? `2px solid ${cat.color}33` : undefined,
                                borderRight: isOvr ? `1px solid ${cat.color}22` : undefined,
                                minWidth: isOvr ? 56 : 52,
                              }}>
                              {t.label}{active ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                            </th>
                          );
                        })
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b, i) => {
                      const isSelected = selectedRows.has(b.dogtime_slug);
                      const rowBg = isSelected ? "#1a150a" : (i % 2 === 0 ? "#111" : "#0d0d0d");
                      return (
                        <tr key={b.name} style={{ borderBottom: "1px solid #181818", background: rowBg }}>
                          <td style={{ padding: "0.3rem 0.5rem", textAlign: "center" }}>
                            <input type="checkbox" checked={isSelected}
                              onChange={() => toggleRow(b.dogtime_slug)}
                              style={{ accentColor: "#c8a96e", cursor: "pointer", width: 13, height: 13 }} />
                          </td>
                          <td style={{ padding: "0.3rem 0.5rem", position: "sticky", left: 0, zIndex: 4, background: rowBg }}>
                            <img src={`images/${b.dogtime_slug}.jpg`} alt={b.name}
                              onClick={() => setPhotoModal(b)}
                              style={{ width: 48, height: 36, objectFit: "cover", display: "block", cursor: "zoom-in" }}
                              onError={e => { e.target.style.display = "none"; }} />
                          </td>
                          <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap", fontWeight: 600, ...(isMobile ? {} : { position: "sticky", left: 64, zIndex: 4 }), background: rowBg }}>
                            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: b.color, marginRight: 7, verticalAlign: "middle" }} />
                            <a href={b.source_url} target="_blank" rel="noopener noreferrer"
                              style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "#333" }}>
                              {b.name}
                            </a>
                          </td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#9a9a9a", whiteSpace: "nowrap" }}>{b.origin}</td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#ccc", whiteSpace: "nowrap" }}>{b.weight_lbs.min} lbs</td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#ccc", whiteSpace: "nowrap" }}>{b.weight_lbs.max} lbs</td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#ccc", whiteSpace: "nowrap" }}>{fmtH(b)}</td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#ccc", whiteSpace: "nowrap" }}>{fmtL(b)}</td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#aaa", whiteSpace: "nowrap" }}>{b.coat}</td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#aaa" }}>{b.purpose.join(", ")}</td>
                          <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap" }}><Dot level={b.exercise} /><span style={{ color: "#aaa" }}>{b.exercise}</span></td>
                          <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap" }}><Dot level={b.grooming} /><span style={{ color: "#aaa" }}>{b.grooming}</span></td>
                          <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap" }}><Dot level={b.shedding} /><span style={{ color: "#aaa" }}>{b.shedding}</span></td>
                          <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap" }}>
                            <span style={{ color: TRAIN_COLOR[b.trainability] || "#bbb" }}>{b.trainability}</span>
                          </td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#9a9a9a", whiteSpace: "nowrap" }}>{b.temperament.join(" · ")}</td>
                          <td style={{ padding: "0.6rem 0.7rem", color: "#888", maxWidth: 220, whiteSpace: "normal", lineHeight: 1.45 }}>{b.health_notes}</td>
                          <td style={{ padding: "0.6rem 0.7rem", textAlign: "center", color: b.good_with_kids ? "#4ade80" : "#555" }}>{b.good_with_kids ? "✓" : "✕"}</td>
                          <td style={{ padding: "0.6rem 0.7rem", textAlign: "center", color: b.good_with_dogs ? "#4ade80" : "#555" }}>{b.good_with_dogs ? "✓" : "✕"}</td>
                          <td style={{ padding: "0.6rem 0.7rem", textAlign: "right",
                                       color: b.service_dog_score != null ? "#c8a96e" : "#444" }}>
                            {b.service_dog_score != null ? b.service_dog_score : "–"}
                          </td>
                          {/* Rating cells */}
                          {RATING_CATEGORIES.filter(c => visibleRatingCats.has(c.key)).flatMap(cat =>
                            cat.traits.map((t, i) => (
                              <td key={t.key} style={{
                                padding: "0.4rem 0.5rem",
                                borderLeft: i === 0 ? `1px solid #1a1a1a` : undefined,
                                borderRight: t.isOverall ? `1px solid #1a1a1a` : undefined,
                                background: t.isOverall ? cat.color + "0a" : undefined,
                              }}>
                                <RatingPips value={b.ratings?.[t.trait]} color={cat.color} />
                              </td>
                            ))
                          )}
                          <td style={{ padding: "0.2rem 0.4rem", textAlign: "center" }}>
                            <button onClick={() => { setRemoveTarget(b); setRemoveStatus(null); }}
                              title={`Remove ${b.name}`}
                              style={{ background: "none", border: "none", color: "#333", fontSize: "1rem",
                                       cursor: "pointer", lineHeight: 1, padding: "0.1rem 0.3rem",
                                       fontFamily: "inherit" }}
                              onMouseEnter={e => e.target.style.color = "#f87171"}
                              onMouseLeave={e => e.target.style.color = "#333"}>
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── CARD VIEW ── */}
          {view === "cards" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {filtered.map(b => (
                <div key={b.name} style={{ background: "#111", border: "1px solid #1e1e1e", padding: "1.1rem 1.2rem" }}>
                  <img src={`images/${b.dogtime_slug}.jpg`} alt={b.name}
                    onClick={() => setPhotoModal(b)}
                    style={{ width: "100%", height: 140, objectFit: "cover", marginBottom: "0.8rem", cursor: "zoom-in" }}
                    onError={e => { e.target.style.display = "none"; }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#e8e0d0", display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.color, display: "inline-block", flexShrink: 0 }} />
                        <a href={b.source_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "#333" }}>
                          {b.name}
                        </a>
                      </div>
                      <div style={{ color: "#777", fontSize: "0.74rem", marginTop: 2 }}>{b.origin}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#c8a96e", fontSize: "0.74rem" }}>{fmtL(b)}</div>
                      <div style={{ color: "#777", fontSize: "0.7rem" }}>lifespan</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#888", marginBottom: "0.6rem" }}>{b.temperament.join(" · ")}</div>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
                    {b.purpose.map(p => <Badge key={p} text={p} />)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    {[["Weight", fmt(b)], ["Height", fmtH(b)]].map(([k, v]) => (
                      <div key={k} style={{ background: "#161616", padding: "0.4rem 0.6rem" }}>
                        <div style={{ color: "#777", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                        <div style={{ color: "#ccc", fontSize: "0.78rem" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    {[["Exercise", b.exercise], ["Grooming", b.grooming]].map(([k, v]) => (
                      <div key={k} style={{ background: "#161616", padding: "0.4rem 0.6rem" }}>
                        <div style={{ color: "#777", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                        <div style={{ fontSize: "0.75rem", marginBottom: 4 }}><Dot level={v} /><span style={{ color: "#ccc" }}>{v}</span></div>
                        <StatBar value={LEVEL[v] + 1} max={3} color={LEVEL_COLOR[v]} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    <div style={{ background: "#161616", padding: "0.4rem 0.6rem" }}>
                      <div style={{ color: "#777", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Shedding</div>
                      <div style={{ fontSize: "0.75rem" }}><Dot level={b.shedding} /><span style={{ color: "#ccc" }}>{b.shedding}</span></div>
                    </div>
                    <div style={{ background: "#161616", padding: "0.4rem 0.6rem" }}>
                      <div style={{ color: "#777", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Trainability</div>
                      <div style={{ fontSize: "0.75rem", color: TRAIN_COLOR[b.trainability] || "#aaa" }}>{b.trainability}</div>
                    </div>
                  </div>
                  <div style={{ background: "#161616", padding: "0.4rem 0.6rem", marginBottom: "0.7rem" }}>
                    <div style={{ color: "#777", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Coat</div>
                    <div style={{ color: "#999", fontSize: "0.78rem" }}>{b.coat}</div>
                  </div>
                  {/* DogTime ratings summary on card */}
                  {b.ratings && (
                    <div style={{ background: "#0e0e0e", border: "1px solid #1a1a1a", padding: "0.5rem 0.6rem", marginBottom: "0.7rem" }}>
                      <div style={{ color: "#777", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.45rem" }}>DogTime Ratings</div>
                      {RATING_CATEGORIES.map(cat => (
                        <div key={cat.key} style={{ marginBottom: "0.35rem" }}>
                          <div style={{ fontSize: "0.62rem", color: cat.color + "aa", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{cat.label}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem 0.5rem" }}>
                            {cat.traits.map(t => (
                              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.62rem", color: "#777" }}>
                                <span>{t.label}:</span>
                                <RatingPips value={b.ratings[t.trait]} color={cat.color} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.7rem" }}>
                    <Badge text="Kids" bg={b.good_with_kids ? "#0f2a0f" : "#1a1212"} color={b.good_with_kids ? "#4ade80" : "#553333"} />
                    <Badge text="Dogs" bg={b.good_with_dogs ? "#0f1f2a" : "#1a1212"} color={b.good_with_dogs ? "#60a5fa" : "#553333"} />
                  </div>
                  <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "0.6rem" }}>
                    <div style={{ color: "#777", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Health</div>
                    <div style={{ color: "#888", fontSize: "0.72rem", lineHeight: 1.5 }}>{b.health_notes}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "1.5rem", fontSize: "0.68rem", color: "#333", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span><span style={{ color: "#4ade80" }}>●</span> Low &nbsp;<span style={{ color: "#facc15" }}>●</span> Moderate &nbsp;<span style={{ color: "#f87171" }}>●</span> High</span>
            <span>Trainability: <span style={{ color: "#4ade80" }}>Very Easy</span> → <span style={{ color: "#f87171" }}>Hard</span></span>
            <span>Ratings: ●●●●● = 5/5 · — = not available · hover column header for full trait name</span>
            <span>Click column header to sort · click photo to enlarge · click breed name to open DogTime</span>
            <span style={{ marginTop: "0.5rem", width: "100%", color: "#2a2a2a" }}>
              Breed data and star ratings sourced from{" "}
              <a href="https://dogtime.com/dog-breeds" target="_blank" rel="noopener noreferrer"
                style={{ color: "#333", textDecoration: "underline", textDecorationColor: "#2a2a2a" }}>
                DogTime.com
              </a>. Service dog suitability scores computed from those ratings — see{" "}
              <a href="analysis.html" style={{ color: "#333", textDecoration: "underline", textDecorationColor: "#2a2a2a" }}>
                methodology
              </a>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
