import { useState, useEffect, useMemo, useRef } from "react";

const DATA_URL = "large_dog_breeds.json";

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
];
const COL_COUNT = COLUMNS.length;

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

// ── Sidebar components ──────────────────────────────────────────────────────
function SidebarSection({ title, sectionKey, collapsed, onToggle, activeCount, onClear, children }) {
  return (
    <div style={{ borderBottom: "1px solid #1a1a1a" }}>
      <div
        onClick={() => onToggle(sectionKey)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0.9rem", cursor: "pointer", userSelect: "none" }}
      >
        <span style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: activeCount > 0 ? "#e8d49a" : "#888", fontWeight: activeCount > 0 ? 600 : 400 }}>
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

function RangeFilter({ globalMin, globalMax, value, onChange, step, unit }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#c8a96e", fontSize: "0.68rem", marginBottom: "0.4rem" }}>
        <span>{value[0]}{unit}</span>
        <span>{value[1]}{unit}</span>
      </div>
      {[["min", 0], ["max", 1]].map(([label, idx]) => (
        <div key={label} style={{ marginBottom: "0.3rem" }}>
          <div style={{ fontSize: "0.58rem", color: "#444", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
          <input type="range"
            min={globalMin} max={globalMax} step={step}
            value={value[idx]}
            onChange={e => {
              const v = +e.target.value;
              onChange(idx === 0 ? [Math.min(v, value[1]), value[1]] : [value[0], Math.max(v, value[0])]);
            }}
            style={{ width: "100%", accentColor: "#c8a96e", cursor: "pointer", height: 14 }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Main app ────────────────────────────────────────────────────────────────
export default function App() {
  const [breeds, setBreeds]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState("name-asc");
  const [photoModal, setPhotoModal] = useState(null);
  const [view, setView]             = useState("table");

  // Sidebar filter state
  const [activeFilters, setActiveFilters] = useState({});   // field → Set<string>
  const [weightRange,   setWeightRange]   = useState([0, 999]);
  const [heightRange,   setHeightRange]   = useState([0, 99]);
  const [lifespanRange, setLifespanRange] = useState([0, 99]);
  const [collapsedSections, setCollapsedSections] = useState(() => new Set(["coat", "temperament"]));
  const rangesInited = useRef(false);

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => r.json())
      .then(data => { setBreeds(data); setLoading(false); })
      .catch(() => { setBreeds(INLINE_DATA); setLoading(false); });
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") setPhotoModal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Compute global min/max from full dataset
  const dataRanges = useMemo(() => {
    if (!breeds.length) return { weight: [0, 300], height: [0, 45], lifespan: [0, 25] };
    return {
      weight:   [Math.min(...breeds.map(b => b.weight_lbs.min)),  Math.max(...breeds.map(b => b.weight_lbs.max))],
      height:   [Math.min(...breeds.map(b => b.height_in.min)),   Math.max(...breeds.map(b => b.height_in.max))],
      lifespan: [Math.min(...breeds.map(b => b.lifespan_yrs.min)), Math.max(...breeds.map(b => b.lifespan_yrs.max))],
    };
  }, [breeds]);

  // Initialise range sliders once data is loaded
  useEffect(() => {
    if (breeds.length && !rangesInited.current) {
      rangesInited.current = true;
      setWeightRange([...dataRanges.weight]);
      setHeightRange([...dataRanges.height]);
      setLifespanRange([...dataRanges.lifespan]);
    }
  }, [breeds, dataRanges]);

  // Distinct values per categorical field, read from full dataset
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

  // Categorical filter toggle
  const toggleFilter = (field, value) => {
    setActiveFilters(prev => {
      const cur = new Set(prev[field] || []);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      return { ...prev, [field]: cur };
    });
  };

  const clearSection = (field) => {
    if (field === "weight")   { setWeightRange([...dataRanges.weight]);   return; }
    if (field === "height")   { setHeightRange([...dataRanges.height]);   return; }
    if (field === "lifespan") { setLifespanRange([...dataRanges.lifespan]); return; }
    setActiveFilters(prev => ({ ...prev, [field]: new Set() }));
  };

  const hasAnyFilter = useMemo(() => {
    if (Object.values(activeFilters).some(s => s.size > 0)) return true;
    if (weightRange[0]   > dataRanges.weight[0]   || weightRange[1]   < dataRanges.weight[1])   return true;
    if (heightRange[0]   > dataRanges.height[0]   || heightRange[1]   < dataRanges.height[1])   return true;
    if (lifespanRange[0] > dataRanges.lifespan[0] || lifespanRange[1] < dataRanges.lifespan[1]) return true;
    return false;
  }, [activeFilters, weightRange, heightRange, lifespanRange, dataRanges]);

  const clearAll = () => {
    setActiveFilters({});
    setWeightRange([...dataRanges.weight]);
    setHeightRange([...dataRanges.height]);
    setLifespanRange([...dataRanges.lifespan]);
  };

  const toggleSection = (key) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const activeCount = (field) => (activeFilters[field] || new Set()).size;
  const rangeActive = (range, dataRange) => range[0] > dataRange[0] || range[1] < dataRange[1];

  // Column sort
  const handleColumnSort = (field, sortable) => {
    if (!sortable) return;
    const [cur, dir] = sortBy.split("-");
    setSortBy(cur === field ? `${field}-${dir === "asc" ? "desc" : "asc"}` : `${field}-asc`);
  };

  // Main filtered + sorted list
  const filtered = useMemo(() => {
    const getSet = (f) => activeFilters[f] || new Set();
    let list = breeds.filter(b => {
      // text search
      const q = search.toLowerCase();
      if (q && ![b.name, b.origin, ...b.temperament, ...b.purpose].join(" ").toLowerCase().includes(q)) return false;
      // range filters
      if (b.weight_lbs.max   < weightRange[0]   || b.weight_lbs.min   > weightRange[1])   return false;
      if (b.height_in.max    < heightRange[0]   || b.height_in.min    > heightRange[1])   return false;
      if (b.lifespan_yrs.max < lifespanRange[0] || b.lifespan_yrs.min > lifespanRange[1]) return false;
      // categorical filters — empty set means "all"
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
      return dir === "desc" ? -cmp : cmp;
    });
  }, [breeds, search, sortBy, activeFilters, weightRange, heightRange, lifespanRange]);

  const fmt  = b => `${b.weight_lbs.min}–${b.weight_lbs.max} lbs`;
  const fmtH = b => `${b.height_in.min}–${b.height_in.max} in`;
  const fmtL = b => b.lifespan_yrs.min === b.lifespan_yrs.max
    ? `${b.lifespan_yrs.min} yrs`
    : `${b.lifespan_yrs.min}–${b.lifespan_yrs.max} yrs`;

  const [sortField, sortDir] = sortBy.split("-");

  // Sidebar checkbox section helper
  const CheckboxSection = ({ field, values, getVal = v => v, descMap = {} }) => (
    <>
      {values.map(v => {
        const checked = (activeFilters[field] || new Set()).has(v);
        const desc = descMap[v];
        return (
          <label key={v} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "0.72rem", color: checked ? "#e8e0d0" : "#666", cursor: "pointer", marginBottom: "0.45rem", userSelect: "none" }}>
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
    <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", color: "#c8a96e", fontFamily: "Georgia, serif", letterSpacing: "0.2em" }}>
      Loading dataset…
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#e8e0d0", fontFamily: "'Georgia','Times New Roman',serif", display: "flex" }}>

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

      {/* ── Sidebar ── */}
      <aside style={{
        width: 210, flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
        borderRight: "1px solid #1a1a1a", background: "#0a0a0a",
        scrollbarWidth: "thin", scrollbarColor: "#222 transparent",
      }}>
        <div style={{ padding: "1rem 0.9rem 0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555" }}>Filters</span>
          {hasAnyFilter && (
            <span onClick={clearAll} style={{ fontSize: "0.62rem", color: "#c8a96e", cursor: "pointer", letterSpacing: "0.05em" }}>
              clear all
            </span>
          )}
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
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ borderBottom: "1px solid #222", padding: "1.8rem 2rem 1.2rem", position: "sticky", top: 0, background: "#0d0d0d", zIndex: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(1.2rem, 2vw, 1.8rem)", fontWeight: 400, letterSpacing: "0.15em", color: "#c8a96e", textTransform: "uppercase" }}>
                Large Dog Breeds
              </h1>
              <p style={{ margin: "0.1rem 0 0", color: "#555", fontSize: "0.72rem", letterSpacing: "0.08em" }}>
                {filtered.length} of {breeds.length} breeds{hasAnyFilter ? " · filters active" : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["table", "cards"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  background: view === v ? "#c8a96e" : "#1a1a1a", color: view === v ? "#0d0d0d" : "#777",
                  border: "1px solid #333", padding: "0.35rem 0.9rem", fontFamily: "inherit",
                  fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                }}>{v}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "0.9rem" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, origin, purpose, temperament…"
              style={{ background: "#151515", border: "1px solid #2a2a2a", color: "#e8e0d0", padding: "0.45rem 0.9rem", fontFamily: "inherit", fontSize: "0.82rem", width: 260, outline: "none" }} />
          </div>
        </div>

        <div style={{ padding: "1.5rem 2rem 3rem" }}>

          {/* ── TABLE VIEW ── */}
          {view === "table" && (
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 185px)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                    {COLUMNS.map(([label, field, sortable]) => {
                      const active = sortable && sortField === field;
                      const isPhoto = field === "photo";
                      const isBreed = field === "name";
                      return (
                        <th key={field} onClick={() => handleColumnSort(field, sortable)} style={{
                          padding: "0.55rem 0.7rem", textAlign: "left",
                          color: active ? "#e8d49a" : "#c8a96e", fontWeight: active ? 600 : 400,
                          fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
                          whiteSpace: "nowrap", cursor: sortable ? "pointer" : "default", userSelect: "none",
                          position: "sticky", top: 0, background: "#0d0d0d",
                          ...(isPhoto ? { left: 0, zIndex: 12, minWidth: 64 } :
                               isBreed ? { left: 64, zIndex: 12 } :
                                         { zIndex: 8 }),
                        }}>
                          {label}{active ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => {
                    const rowBg = i % 2 === 0 ? "#111" : "#0d0d0d";
                    return (
                      <tr key={b.name} style={{ borderBottom: "1px solid #181818", background: rowBg }}>
                        <td style={{ padding: "0.3rem 0.5rem", position: "sticky", left: 0, zIndex: 4, background: rowBg }}>
                          <img src={`images/${b.dogtime_slug}.jpg`} alt={b.name}
                            onClick={() => setPhotoModal(b)}
                            style={{ width: 48, height: 36, objectFit: "cover", display: "block", cursor: "zoom-in" }}
                            onError={e => { e.target.style.display = "none"; }} />
                        </td>
                        <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap", fontWeight: 600, position: "sticky", left: 64, zIndex: 4, background: rowBg }}>
                          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: b.color, marginRight: 7, verticalAlign: "middle" }} />
                          <a href={b.source_url} target="_blank" rel="noopener noreferrer"
                            style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "#333" }}>
                            {b.name}
                          </a>
                        </td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#777", whiteSpace: "nowrap" }}>{b.origin}</td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#bbb", whiteSpace: "nowrap" }}>{b.weight_lbs.min} lbs</td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#bbb", whiteSpace: "nowrap" }}>{b.weight_lbs.max} lbs</td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#bbb", whiteSpace: "nowrap" }}>{fmtH(b)}</td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#bbb", whiteSpace: "nowrap" }}>{fmtL(b)}</td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#888", whiteSpace: "nowrap" }}>{b.coat}</td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#888" }}>{b.purpose.join(", ")}</td>
                        <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap" }}><Dot level={b.exercise} /><span style={{ color: "#888" }}>{b.exercise}</span></td>
                        <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap" }}><Dot level={b.grooming} /><span style={{ color: "#888" }}>{b.grooming}</span></td>
                        <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap" }}><Dot level={b.shedding} /><span style={{ color: "#888" }}>{b.shedding}</span></td>
                        <td style={{ padding: "0.6rem 0.7rem", whiteSpace: "nowrap" }}>
                          <span style={{ color: TRAIN_COLOR[b.trainability] || "#aaa", fontSize: "0.75rem" }}>{b.trainability}</span>
                        </td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#777", whiteSpace: "nowrap" }}>{b.temperament.join(" · ")}</td>
                        <td style={{ padding: "0.6rem 0.7rem", color: "#666", maxWidth: 220, whiteSpace: "normal", lineHeight: 1.45 }}>{b.health_notes}</td>
                        <td style={{ padding: "0.6rem 0.7rem", textAlign: "center", color: b.good_with_kids ? "#4ade80" : "#444" }}>{b.good_with_kids ? "✓" : "✕"}</td>
                        <td style={{ padding: "0.6rem 0.7rem", textAlign: "center", color: b.good_with_dogs ? "#4ade80" : "#444" }}>{b.good_with_dogs ? "✓" : "✕"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                      <div style={{ color: "#555", fontSize: "0.7rem", marginTop: 2 }}>{b.origin}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#c8a96e", fontSize: "0.7rem" }}>{fmtL(b)}</div>
                      <div style={{ color: "#555", fontSize: "0.68rem" }}>lifespan</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#666", marginBottom: "0.6rem" }}>{b.temperament.join(" · ")}</div>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
                    {b.purpose.map(p => <Badge key={p} text={p} />)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    {[["Weight", fmt(b)], ["Height", fmtH(b)]].map(([k, v]) => (
                      <div key={k} style={{ background: "#161616", padding: "0.4rem 0.6rem" }}>
                        <div style={{ color: "#444", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                        <div style={{ color: "#bbb", fontSize: "0.78rem" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    {[["Exercise", b.exercise], ["Grooming", b.grooming]].map(([k, v]) => (
                      <div key={k} style={{ background: "#161616", padding: "0.4rem 0.6rem" }}>
                        <div style={{ color: "#444", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                        <div style={{ fontSize: "0.75rem", marginBottom: 4 }}><Dot level={v} /><span style={{ color: "#ccc" }}>{v}</span></div>
                        <StatBar value={LEVEL[v] + 1} max={3} color={LEVEL_COLOR[v]} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    <div style={{ background: "#161616", padding: "0.4rem 0.6rem" }}>
                      <div style={{ color: "#444", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Shedding</div>
                      <div style={{ fontSize: "0.75rem" }}><Dot level={b.shedding} /><span style={{ color: "#ccc" }}>{b.shedding}</span></div>
                    </div>
                    <div style={{ background: "#161616", padding: "0.4rem 0.6rem" }}>
                      <div style={{ color: "#444", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Trainability</div>
                      <div style={{ fontSize: "0.75rem", color: TRAIN_COLOR[b.trainability] || "#aaa" }}>{b.trainability}</div>
                    </div>
                  </div>
                  <div style={{ background: "#161616", padding: "0.4rem 0.6rem", marginBottom: "0.7rem" }}>
                    <div style={{ color: "#444", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Coat</div>
                    <div style={{ color: "#999", fontSize: "0.78rem" }}>{b.coat}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.7rem" }}>
                    <Badge text="Kids" bg={b.good_with_kids ? "#0f2a0f" : "#1a1212"} color={b.good_with_kids ? "#4ade80" : "#553333"} />
                    <Badge text="Dogs" bg={b.good_with_dogs ? "#0f1f2a" : "#1a1212"} color={b.good_with_dogs ? "#60a5fa" : "#553333"} />
                  </div>
                  <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "0.6rem" }}>
                    <div style={{ color: "#444", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Health</div>
                    <div style={{ color: "#666", fontSize: "0.72rem", lineHeight: 1.5 }}>{b.health_notes}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "1.5rem", fontSize: "0.68rem", color: "#333", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span><span style={{ color: "#4ade80" }}>●</span> Low &nbsp;<span style={{ color: "#facc15" }}>●</span> Moderate &nbsp;<span style={{ color: "#f87171" }}>●</span> High</span>
            <span>Trainability: <span style={{ color: "#4ade80" }}>Very Easy</span> → <span style={{ color: "#f87171" }}>Hard</span></span>
            <span>Click column header to sort · click photo to enlarge · click breed name to open DogTime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
