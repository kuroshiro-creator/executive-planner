import { useState, useMemo, useCallback } from "react";
import { Calendar, CheckSquare, BookOpen, Target, Home, Plus, X, Edit3, Trash2, Search, Download, Upload, ChevronLeft, ChevronRight, Clock, Tag, Filter, ArrowUpDown, BarChart3 } from "lucide-react";

// ===== SAMPLE DATA =====
const today = new Date();
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const todayStr = fmt(today);

const SAMPLE_EVENTS = [
  { id: 1, title: "チームミーティング", date: todayStr, time: "10:00", category: "work", memo: "Q2計画の共有" },
  { id: 2, title: "クライアント面談", date: todayStr, time: "14:00", category: "work", memo: "新規プロジェクト提案" },
  { id: 3, title: "ジム", date: todayStr, time: "19:00", category: "personal", memo: "" },
];
const SAMPLE_TASKS = [
  { id: 1, title: "企画書を提出", priority: "high", deadline: todayStr, category: "work", done: false },
  { id: 2, title: "経費精算", priority: "medium", deadline: fmt(new Date(today.getTime()+86400000*2)), category: "work", done: false },
  { id: 3, title: "本を返す", priority: "low", deadline: fmt(new Date(today.getTime()+86400000*5)), category: "personal", done: false },
  { id: 4, title: "メール返信", priority: "high", deadline: todayStr, category: "work", done: true },
];
const SAMPLE_NOTES = [
  { id: 1, date: todayStr, content: "今日のミーティングで新しいアイデアが出た。来週までに具体化する。", tags: ["仕事", "アイデア"] },
  { id: 2, date: fmt(new Date(today.getTime()-86400000)), content: "最近読んだ本のまとめ：リーダーシップとは信頼を築くこと。", tags: ["読書", "学び"] },
];
const SAMPLE_HABITS = [
  { id: 1, name: "早起き（6時）", frequency: "daily" },
  { id: 2, name: "読書30分", frequency: "daily" },
  { id: 3, name: "筋トレ", frequency: "weekdays" },
  { id: 4, name: "英語学習", frequency: "daily" },
];
const generateSampleHabitLog = () => {
  const log = {};
  SAMPLE_HABITS.forEach(h => {
    log[h.id] = {};
    for (let i = 0; i < 7; i++) {
      const d = fmt(new Date(today.getTime() - i * 86400000));
      log[h.id][d] = Math.random() > 0.3;
    }
  });
  return log;
};

// ===== THEME =====
const C = {
  bg: "#0f172a", bgCard: "#1e293b", bgHover: "#334155", bgInput: "#0f172a",
  gold: "#d4a853", goldDim: "#b8943f", goldBright: "#e8c36a",
  text: "#f1f5f9", textDim: "#94a3b8", textMuted: "#64748b",
  border: "#334155", borderLight: "#475569",
  red: "#ef4444", green: "#22c55e", blue: "#3b82f6", purple: "#a855f7",
  catWork: "#3b82f6", catPersonal: "#22c55e", catImportant: "#ef4444",
  priHigh: "#ef4444", priMed: "#f59e0b", priLow: "#22c55e",
};

// ===== UTILITIES =====
const DAYS_JP = ["日","月","火","水","木","金","土"];
const MONTHS_JP = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
const catLabel = { work: "仕事", personal: "プライベート", important: "重要" };
const catColor = { work: C.catWork, personal: C.catPersonal, important: C.catImportant };
const priLabel = { high: "高", medium: "中", low: "低" };
const priColor = { high: C.priHigh, medium: C.priMed, low: C.priLow };

let nextId = 100;
const genId = () => ++nextId;

// ===== STYLES =====
const s = {
  app: { display: "flex", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: C.bg, color: C.text, overflow: "hidden" },
  sidebar: { width: 240, background: C.bgCard, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarHeader: { padding: "24px 20px 16px", borderBottom: `1px solid ${C.border}` },
  sidebarTitle: { fontSize: 20, fontWeight: 700, color: C.gold, letterSpacing: 1 },
  sidebarSubtitle: { fontSize: 11, color: C.textMuted, marginTop: 4, letterSpacing: 2, textTransform: "uppercase" },
  navList: { padding: "12px 0", flex: 1 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", background: active ? C.bgHover : "transparent", color: active ? C.gold : C.textDim, borderLeft: active ? `3px solid ${C.gold}` : "3px solid transparent", transition: "all 0.2s", fontSize: 14, fontWeight: active ? 600 : 400 }),
  main: { flex: 1, overflow: "auto", padding: 32 },
  pageTitle: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: C.text },
  card: { background: C.bgCard, borderRadius: 12, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` },
  cardSmall: { background: C.bgCard, borderRadius: 8, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` },
  btn: (color = C.gold) => ({ background: color, color: color === C.gold ? C.bg : "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 0.2s" }),
  btnOutline: { background: "transparent", color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 },
  btnIcon: { background: "transparent", color: C.textDim, border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center" },
  input: { background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" },
  select: { background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, outline: "none" },
  textarea: { background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, width: "100%", outline: "none", resize: "vertical", minHeight: 100, boxSizing: "border-box", fontFamily: "inherit" },
  badge: (color) => ({ background: `${color}22`, color, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 600, display: "inline-block" }),
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: C.bgCard, borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw", border: `1px solid ${C.border}`, maxHeight: "80vh", overflow: "auto" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  flexBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  flexGap: (g = 8) => ({ display: "flex", gap: g, alignItems: "center" }),
  tag: { background: C.bgHover, color: C.goldBright, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 500 },
  divider: { borderTop: `1px solid ${C.border}`, margin: "16px 0" },
  noData: { color: C.textMuted, textAlign: "center", padding: 32, fontSize: 14 },
};

// ===== MODAL COMPONENT =====
const Modal = ({ title, onClose, children }) => (
  <div style={s.modal} onClick={onClose}>
    <div style={s.modalContent} onClick={e => e.stopPropagation()}>
      <div style={{ ...s.flexBetween, marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>{title}</h3>
        <button style={s.btnIcon} onClick={onClose}><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ===== DASHBOARD =====
const Dashboard = ({ events, tasks, habits, habitLog, notes }) => {
  const todayEvents = events.filter(e => e.date === todayStr).sort((a,b) => a.time.localeCompare(b.time)).slice(0, 3);
  const pendingTasks = tasks.filter(t => !t.done).length;
  const todayHabitsDone = habits.filter(h => habitLog[h.id]?.[todayStr]).length;
  const habitRate = habits.length > 0 ? Math.round((todayHabitsDone / habits.length) * 100) : 0;
  const latestNote = notes.sort((a,b) => b.date.localeCompare(a.date))[0];
  const dayName = DAYS_JP[today.getDay()];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 14, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>TODAY</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.text }}>{today.getFullYear()}年{today.getMonth()+1}月{today.getDate()}日</div>
        <div style={{ fontSize: 18, color: C.gold, fontWeight: 600 }}>{dayName}曜日</div>
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={{ ...s.flexGap(8), marginBottom: 16 }}>
            <Calendar size={18} color={C.gold} />
            <span style={{ fontWeight: 600, color: C.gold }}>今日の予定</span>
          </div>
          {todayEvents.length === 0 ? <div style={s.noData}>予定なし</div> : todayEvents.map(ev => (
            <div key={ev.id} style={{ ...s.flexGap(12), marginBottom: 10 }}>
              <span style={{ color: C.textMuted, fontSize: 13, minWidth: 40 }}>{ev.time}</span>
              <span style={{ width: 3, height: 20, borderRadius: 2, background: catColor[ev.category] || C.gold }} />
              <span style={{ fontSize: 14 }}>{ev.title}</span>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <div style={{ ...s.flexGap(8), marginBottom: 16 }}>
            <CheckSquare size={18} color={C.gold} />
            <span style={{ fontWeight: 600, color: C.gold }}>タスク状況</span>
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, color: pendingTasks > 0 ? C.gold : C.green }}>{pendingTasks}</div>
          <div style={{ fontSize: 13, color: C.textDim }}>未完了のタスク</div>
        </div>

        <div style={s.card}>
          <div style={{ ...s.flexGap(8), marginBottom: 16 }}>
            <Target size={18} color={C.gold} />
            <span style={{ fontWeight: 600, color: C.gold }}>今日の習慣</span>
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, color: habitRate >= 80 ? C.green : habitRate >= 50 ? C.gold : C.textDim }}>{habitRate}%</div>
          <div style={{ background: C.bgHover, borderRadius: 8, height: 8, marginTop: 8, overflow: "hidden" }}>
            <div style={{ background: C.gold, height: "100%", width: `${habitRate}%`, borderRadius: 8, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{todayHabitsDone}/{habits.length} 達成</div>
        </div>

        <div style={s.card}>
          <div style={{ ...s.flexGap(8), marginBottom: 16 }}>
            <BookOpen size={18} color={C.gold} />
            <span style={{ fontWeight: 600, color: C.gold }}>最新のメモ</span>
          </div>
          {latestNote ? (
            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{latestNote.date}</div>
              <div style={{ fontSize: 14, color: C.textDim, lineHeight: 1.6 }}>{latestNote.content.slice(0, 80)}{latestNote.content.length > 80 ? "..." : ""}</div>
            </div>
          ) : <div style={s.noData}>メモなし</div>}
        </div>
      </div>
    </div>
  );
};

// ===== SCHEDULE =====
const Schedule = ({ events, setEvents }) => {
  const [viewDate, setViewDate] = useState(new Date(today));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ title: "", time: "", category: "work", memo: "" });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const openAdd = () => { setEditEvent(null); setForm({ title: "", time: "", category: "work", memo: "" }); setShowModal(true); };
  const openEdit = (ev) => { setEditEvent(ev); setForm({ title: ev.title, time: ev.time, category: ev.category, memo: ev.memo }); setShowModal(true); };

  const save = () => {
    if (!form.title) return;
    if (editEvent) {
      setEvents(prev => prev.map(e => e.id === editEvent.id ? { ...e, ...form } : e));
    } else {
      setEvents(prev => [...prev, { id: genId(), date: selectedDate, ...form }]);
    }
    setShowModal(false);
  };

  const remove = (id) => setEvents(prev => prev.filter(e => e.id !== id));

  const dayEvents = events.filter(e => e.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time));

  const calCells = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  return (
    <div>
      <div style={s.flexBetween}>
        <h2 style={s.pageTitle}>スケジュール</h2>
        <button style={s.btn()} onClick={openAdd}><Plus size={14} /> 予定を追加</button>
      </div>

      <div style={s.card}>
        <div style={{ ...s.flexBetween, marginBottom: 20 }}>
          <button style={s.btnIcon} onClick={prevMonth}><ChevronLeft size={20} color={C.gold} /></button>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>{year}年 {MONTHS_JP[month]}</span>
          <button style={s.btnIcon} onClick={nextMonth}><ChevronRight size={20} color={C.gold} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {DAYS_JP.map(d => <div key={d} style={{ textAlign: "center", fontSize: 12, color: C.textMuted, padding: "8px 0", fontWeight: 600 }}>{d}</div>)}
          {calCells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasEvents = events.some(e => e.date === dateStr);
            return (
              <div key={i} onClick={() => setSelectedDate(dateStr)} style={{
                textAlign: "center", padding: "10px 0", cursor: "pointer", borderRadius: 8, position: "relative",
                background: isSelected ? C.gold : isToday ? C.bgHover : "transparent",
                color: isSelected ? C.bg : isToday ? C.gold : C.text,
                fontWeight: isToday || isSelected ? 700 : 400, fontSize: 14, transition: "all 0.15s"
              }}>
                {day}
                {hasEvents && <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: isSelected ? C.bg : C.gold }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.textDim, marginBottom: 12 }}>{selectedDate} の予定</h3>
        {dayEvents.length === 0 ? <div style={{ ...s.cardSmall, ...s.noData }}>この日の予定はありません</div> : dayEvents.map(ev => (
          <div key={ev.id} style={{ ...s.cardSmall, ...s.flexBetween }}>
            <div style={s.flexGap(12)}>
              <div style={{ width: 4, height: 40, borderRadius: 2, background: catColor[ev.category] || C.gold }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.title}</div>
                <div style={{ ...s.flexGap(8), marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}><Clock size={12} style={{ verticalAlign: -2 }} /> {ev.time}</span>
                  <span style={s.badge(catColor[ev.category])}>{catLabel[ev.category]}</span>
                </div>
                {ev.memo && <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{ev.memo}</div>}
              </div>
            </div>
            <div style={s.flexGap(4)}>
              <button style={s.btnIcon} onClick={() => openEdit(ev)}><Edit3 size={16} color={C.textMuted} /></button>
              <button style={s.btnIcon} onClick={() => remove(ev.id)}><Trash2 size={16} color={C.red} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editEvent ? "予定を編集" : "予定を追加"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>タイトル</label>
              <input style={s.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="予定のタイトル" />
            </div>
            <div style={s.grid2}>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>時間</label>
                <input style={s.input} type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>カテゴリ</label>
                <select style={{ ...s.select, width: "100%" }} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="work">仕事</option>
                  <option value="personal">プライベート</option>
                  <option value="important">重要</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>メモ</label>
              <input style={s.input} value={form.memo} onChange={e => setForm({...form, memo: e.target.value})} placeholder="メモ（任意）" />
            </div>
            <button style={{ ...s.btn(), width: "100%", justifyContent: "center", marginTop: 8 }} onClick={save}>
              {editEvent ? "更新" : "追加"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ===== TASKS =====
const Tasks = ({ tasks, setTasks }) => {
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: "", priority: "medium", deadline: todayStr, category: "work" });
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [showDone, setShowDone] = useState(false);

  const openAdd = () => { setEditTask(null); setForm({ title: "", priority: "medium", deadline: todayStr, category: "work" }); setShowModal(true); };
  const openEdit = (t) => { setEditTask(t); setForm({ title: t.title, priority: t.priority, deadline: t.deadline, category: t.category }); setShowModal(true); };

  const save = () => {
    if (!form.title) return;
    if (editTask) {
      setTasks(prev => prev.map(t => t.id === editTask.id ? { ...t, ...form } : t));
    } else {
      setTasks(prev => [...prev, { id: genId(), ...form, done: false }]);
    }
    setShowModal(false);
  };

  const toggle = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const priOrder = { high: 0, medium: 1, low: 2 };
  const filtered = tasks
    .filter(t => showDone || !t.done)
    .filter(t => filter === "all" || t.category === filter)
    .sort((a, b) => {
      if (sortBy === "priority") return priOrder[a.priority] - priOrder[b.priority];
      return a.deadline.localeCompare(b.deadline);
    });

  return (
    <div>
      <div style={s.flexBetween}>
        <h2 style={s.pageTitle}>タスク管理</h2>
        <button style={s.btn()} onClick={openAdd}><Plus size={14} /> タスクを追加</button>
      </div>

      <div style={{ ...s.flexGap(12), marginBottom: 20, flexWrap: "wrap" }}>
        <div style={s.flexGap(6)}>
          <Filter size={14} color={C.textMuted} />
          <select style={s.select} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">すべて</option>
            <option value="work">仕事</option>
            <option value="personal">プライベート</option>
          </select>
        </div>
        <div style={s.flexGap(6)}>
          <ArrowUpDown size={14} color={C.textMuted} />
          <select style={s.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="priority">優先度順</option>
            <option value="deadline">期限順</option>
          </select>
        </div>
        <label style={{ ...s.flexGap(6), cursor: "pointer", fontSize: 13, color: C.textDim }}>
          <input type="checkbox" checked={showDone} onChange={() => setShowDone(!showDone)} />
          完了済みも表示
        </label>
      </div>

      {filtered.length === 0 ? <div style={{ ...s.card, ...s.noData }}>タスクはありません</div> : filtered.map(t => (
        <div key={t.id} style={{ ...s.cardSmall, ...s.flexBetween, opacity: t.done ? 0.5 : 1, transition: "opacity 0.3s" }}>
          <div style={s.flexGap(12)}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: C.gold }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
              <div style={{ ...s.flexGap(8), marginTop: 4 }}>
                <span style={s.badge(priColor[t.priority])}>{priLabel[t.priority]}</span>
                <span style={s.badge(catColor[t.category])}>{catLabel[t.category]}</span>
                <span style={{ fontSize: 12, color: C.textMuted }}>{t.deadline}</span>
              </div>
            </div>
          </div>
          <div style={s.flexGap(4)}>
            <button style={s.btnIcon} onClick={() => openEdit(t)}><Edit3 size={16} color={C.textMuted} /></button>
            <button style={s.btnIcon} onClick={() => remove(t.id)}><Trash2 size={16} color={C.red} /></button>
          </div>
        </div>
      ))}

      {showModal && (
        <Modal title={editTask ? "タスクを編集" : "タスクを追加"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>タスク名</label>
              <input style={s.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="タスク名" />
            </div>
            <div style={s.grid2}>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>優先度</label>
                <select style={{ ...s.select, width: "100%" }} value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>カテゴリ</label>
                <select style={{ ...s.select, width: "100%" }} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="work">仕事</option>
                  <option value="personal">プライベート</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>期限</label>
              <input style={s.input} type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>
            <button style={{ ...s.btn(), width: "100%", justifyContent: "center", marginTop: 8 }} onClick={save}>
              {editTask ? "更新" : "追加"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ===== NOTES =====
const Notes = ({ notes, setNotes }) => {
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({ date: todayStr, content: "", tagInput: "" });
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const openAdd = () => { setEditNote(null); setForm({ date: todayStr, content: "", tagInput: "" }); setTags([]); setShowModal(true); };
  const openEdit = (n) => { setEditNote(n); setForm({ date: n.date, content: n.content, tagInput: "" }); setTags([...n.tags]); setShowModal(true); };

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setForm({ ...form, tagInput: "" }); }
  };

  const removeTag = (t) => setTags(tags.filter(x => x !== t));

  const save = () => {
    if (!form.content) return;
    if (editNote) {
      setNotes(prev => prev.map(n => n.id === editNote.id ? { ...n, date: form.date, content: form.content, tags } : n));
    } else {
      setNotes(prev => [...prev, { id: genId(), date: form.date, content: form.content, tags }]);
    }
    setShowModal(false);
  };

  const remove = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  const filtered = notes
    .filter(n => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q));
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div style={s.flexBetween}>
        <h2 style={s.pageTitle}>日記・メモ</h2>
        <button style={s.btn()} onClick={openAdd}><Plus size={14} /> 新しいメモ</button>
      </div>

      <div style={{ ...s.flexGap(8), marginBottom: 20 }}>
        <Search size={16} color={C.textMuted} />
        <input style={{ ...s.input, maxWidth: 320 }} placeholder="メモを検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? <div style={{ ...s.card, ...s.noData }}>メモがありません</div> : filtered.map(n => (
        <div key={n.id} style={s.card}>
          <div style={s.flexBetween}>
            <span style={{ fontSize: 13, color: C.textMuted }}>{n.date}</span>
            <div style={s.flexGap(4)}>
              <button style={s.btnIcon} onClick={() => openEdit(n)}><Edit3 size={16} color={C.textMuted} /></button>
              <button style={s.btnIcon} onClick={() => remove(n.id)}><Trash2 size={16} color={C.red} /></button>
            </div>
          </div>
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.8, marginTop: 8, whiteSpace: "pre-wrap" }}>{n.content}</div>
          {n.tags.length > 0 && (
            <div style={{ ...s.flexGap(6), marginTop: 12, flexWrap: "wrap" }}>
              <Tag size={12} color={C.textMuted} />
              {n.tags.map(t => <span key={t} style={s.tag}>{t}</span>)}
            </div>
          )}
        </div>
      ))}

      {showModal && (
        <Modal title={editNote ? "メモを編集" : "新しいメモ"} onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>日付</label>
              <input style={s.input} type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>内容</label>
              <textarea style={s.textarea} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="自由に書いてください..." rows={5} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>タグ</label>
              <div style={s.flexGap(8)}>
                <input style={{ ...s.input, flex: 1 }} value={form.tagInput} onChange={e => setForm({...form, tagInput: e.target.value})} placeholder="タグを入力" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button style={s.btn()} onClick={addTag}>追加</button>
              </div>
              {tags.length > 0 && (
                <div style={{ ...s.flexGap(6), marginTop: 8, flexWrap: "wrap" }}>
                  {tags.map(t => (
                    <span key={t} style={{ ...s.tag, cursor: "pointer" }} onClick={() => removeTag(t)}>{t} ✕</span>
                  ))}
                </div>
              )}
            </div>
            <button style={{ ...s.btn(), width: "100%", justifyContent: "center", marginTop: 8 }} onClick={save}>
              {editNote ? "更新" : "保存"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ===== HABIT TRACKER =====
const HabitTracker = ({ habits, setHabits, habitLog, setHabitLog }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", frequency: "daily" });

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() - (6 - i) * 86400000);
    return { date: fmt(d), dayName: DAYS_JP[d.getDay()], dayNum: d.getDate() };
  });

  const toggleHabit = (habitId, date) => {
    setHabitLog(prev => {
      const next = { ...prev };
      if (!next[habitId]) next[habitId] = {};
      next[habitId] = { ...next[habitId], [date]: !next[habitId][date] };
      return next;
    });
  };

  const addHabit = () => {
    if (!form.name) return;
    const id = genId();
    setHabits(prev => [...prev, { id, name: form.name, frequency: form.frequency }]);
    setHabitLog(prev => ({ ...prev, [id]: {} }));
    setForm({ name: "", frequency: "daily" });
    setShowModal(false);
  };

  const removeHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitLog(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  const getStreak = (habitId) => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = fmt(new Date(today.getTime() - i * 86400000));
      if (habitLog[habitId]?.[d]) streak++;
      else break;
    }
    return streak;
  };

  const overallRate = habits.length > 0 ? Math.round(habits.reduce((sum, h) => {
    const done = last7.filter(d => habitLog[h.id]?.[d.date]).length;
    return sum + done;
  }, 0) / (habits.length * 7) * 100) : 0;

  return (
    <div>
      <div style={s.flexBetween}>
        <h2 style={s.pageTitle}>習慣トラッカー</h2>
        <button style={s.btn()} onClick={() => setShowModal(true)}><Plus size={14} /> 習慣を追加</button>
      </div>

      <div style={{ ...s.card, marginBottom: 24 }}>
        <div style={{ ...s.flexGap(8), marginBottom: 12 }}>
          <BarChart3 size={18} color={C.gold} />
          <span style={{ fontWeight: 600, color: C.gold }}>週間達成率</span>
        </div>
        <div style={{ fontSize: 48, fontWeight: 800, color: overallRate >= 80 ? C.green : overallRate >= 50 ? C.gold : C.textDim }}>{overallRate}%</div>
        <div style={{ background: C.bgHover, borderRadius: 8, height: 10, marginTop: 8, overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright})`, height: "100%", width: `${overallRate}%`, borderRadius: 8, transition: "width 0.5s" }} />
        </div>
      </div>

      <div style={s.card}>
        <div style={{ display: "grid", gridTemplateColumns: "200px repeat(7, 1fr) 60px", gap: 4, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>習慣</div>
          {last7.map(d => (
            <div key={d.date} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textMuted }}>{d.dayName}</div>
              <div style={{ fontSize: 13, fontWeight: d.date === todayStr ? 700 : 400, color: d.date === todayStr ? C.gold : C.text }}>{d.dayNum}</div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: C.textMuted, textAlign: "center" }}>連続</div>

          {habits.map(h => (
            <React.Fragment key={h.id}>
              <div style={{ ...s.flexBetween, paddingRight: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{h.name}</span>
                <button style={s.btnIcon} onClick={() => removeHabit(h.id)}><Trash2 size={12} color={C.red} /></button>
              </div>
              {last7.map(d => {
                const done = habitLog[h.id]?.[d.date];
                return (
                  <div key={d.date} style={{ display: "flex", justifyContent: "center" }}>
                    <div onClick={() => toggleHabit(h.id, d.date)} style={{
                      width: 28, height: 28, borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
                      background: done ? C.gold : C.bgHover, border: `2px solid ${done ? C.gold : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: done ? C.bg : "transparent", fontWeight: 700
                    }}>
                      {done ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
              <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: getStreak(h.id) > 0 ? C.gold : C.textMuted }}>
                {getStreak(h.id)}日
              </div>
            </React.Fragment>
          ))}
        </div>

        {habits.length === 0 && <div style={s.noData}>習慣を追加してください</div>}
      </div>

      {showModal && (
        <Modal title="習慣を追加" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>習慣名</label>
              <input style={s.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="例：早起き、読書30分" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, display: "block" }}>頻度</label>
              <select style={{ ...s.select, width: "100%" }} value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                <option value="daily">毎日</option>
                <option value="weekdays">平日のみ</option>
              </select>
            </div>
            <button style={{ ...s.btn(), width: "100%", justifyContent: "center", marginTop: 8 }} onClick={addHabit}>追加</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ===== DATA MANAGEMENT =====
const DataPanel = ({ events, tasks, notes, habits, habitLog, importAll }) => {
  const exportData = () => {
    const data = JSON.stringify({ events, tasks, notes, habits, habitLog }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `planner-backup-${todayStr}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importAll(data);
      } catch { alert("ファイルの読み込みに失敗しました"); }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ ...s.card, marginTop: 24, ...s.flexGap(12) }}>
      <button style={s.btn()} onClick={exportData}><Download size={14} /> データをエクスポート</button>
      <label style={s.btnOutline}>
        <Upload size={14} /> データをインポート
        <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
      </label>
    </div>
  );
};

// ===== MAIN APP =====
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [habits, setHabits] = useState(SAMPLE_HABITS);
  const [habitLog, setHabitLog] = useState(generateSampleHabitLog);

  const importAll = useCallback((data) => {
    if (data.events) setEvents(data.events);
    if (data.tasks) setTasks(data.tasks);
    if (data.notes) setNotes(data.notes);
    if (data.habits) setHabits(data.habits);
    if (data.habitLog) setHabitLog(data.habitLog);
  }, []);

  const navItems = [
    { id: "dashboard", label: "ダッシュボード", icon: Home },
    { id: "schedule", label: "スケジュール", icon: Calendar },
    { id: "tasks", label: "タスク管理", icon: CheckSquare },
    { id: "notes", label: "日記・メモ", icon: BookOpen },
    { id: "habits", label: "習慣トラッカー", icon: Target },
  ];

  return (
    <div style={s.app}>
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={s.sidebarTitle}>EXECUTIVE</div>
          <div style={s.sidebarSubtitle}>Personal Planner</div>
        </div>
        <div style={s.navList}>
          {navItems.map(item => (
            <div key={item.id} style={s.navItem(page === item.id)} onClick={() => setPage(item.id)}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
          <DataPanel events={events} tasks={tasks} notes={notes} habits={habits} habitLog={habitLog} importAll={importAll} />
        </div>
      </div>

      <div style={s.main}>
        {page === "dashboard" && <Dashboard events={events} tasks={tasks} habits={habits} habitLog={habitLog} notes={notes} />}
        {page === "schedule" && <Schedule events={events} setEvents={setEvents} />}
        {page === "tasks" && <Tasks tasks={tasks} setTasks={setTasks} />}
        {page === "notes" && <Notes notes={notes} setNotes={setNotes} />}
        {page === "habits" && <HabitTracker habits={habits} setHabits={setHabits} habitLog={habitLog} setHabitLog={setHabitLog} />}
      </div>
    </div>
  );
}
