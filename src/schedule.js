// نظام المراجعة:
// 1) الورد الأساسي: صفحات متتالية من المحفوظ تبدأ من حيث توقفت أمس، فتكتمل ختمة مراجعة كل (المحفوظ ÷ الورد) يومًا.
// 2) التثبيت: الصفحة المقيَّمة "ضعيفة" تعود في اليوم التالي زيادةً على الورد، حتى تُقيَّم "جيدة" أو "متقنة".
// 3) ما لم يُراجَع من ورد الأمس يُقدَّم أول ورد اليوم.
import { addDays } from "./date.js";

export const WEAK = 1;
export const GOOD = 2;
export const EXCELLENT = 3;

export function cycleDays(state) {
  return Math.max(1, Math.ceil(state.memorized.length / state.settings.dailyPages));
}

// أقصى عدد لصفحات التثبيت في اليوم حتى لا يثقل الورد
export function maxWeakPerDay(state) {
  return Math.max(2, Math.ceil(state.settings.dailyPages / 4));
}

export function addMemorized(state, pages) {
  const set = new Set([...state.memorized, ...pages]);
  return { ...state, memorized: [...set].sort((a, b) => a - b) };
}

export function removeMemorized(state, pages) {
  const drop = new Set(pages);
  return { ...state, memorized: state.memorized.filter((p) => !drop.has(p)) };
}

// يأخذ count صفحة متتالية من المحفوظ بدءًا من الصفحة start (مع الالتفاف لأول المحفوظ)
function takeSequential(state, start, count, exclude) {
  const mem = state.memorized;
  const out = [];
  if (!mem.length) return { pages: out, next: start, wrapped: 0 };
  let i = mem.findIndex((p) => p >= start);
  if (i < 0) i = 0;
  let wrapped = 0;
  for (let n = 0; n < mem.length && out.length < count; n++) {
    const p = mem[i];
    if (!exclude.has(p)) out.push(p);
    i++;
    if (i >= mem.length) {
      i = 0;
      wrapped++;
    }
  }
  return { pages: out, next: mem[i], wrapped };
}

function weakDue(state, day, exclude) {
  return state.memorized
    .filter((p) => state.cards[p]?.weakDue && state.cards[p].weakDue <= day && !exclude.has(p))
    .sort((a, b) => (state.cards[a].weakDue < state.cards[b].weakDue ? -1 : a - b))
    .slice(0, maxWeakPerDay(state));
}

function buildDay(state, day, cycle, carried, done, prevWeak) {
  const mem = new Set(state.memorized);
  const carry = carried.filter((p) => mem.has(p)).slice(0, state.settings.dailyPages);
  const seq = takeSequential(state, cycle.next, state.settings.dailyPages - carry.length, new Set(carry));
  const pages = [...carry, ...seq.pages];
  // صفحات التثبيت التي رُوجعت اليوم تبقى ظاهرة في القائمة حتى نهاية اليوم
  const reviewedWeak = prevWeak.filter((p) => done[p] != null && mem.has(p) && !pages.includes(p));
  const weak = [...reviewedWeak, ...weakDue(state, day, new Set([...pages, ...reviewedWeak]))];
  const keptDone = Object.fromEntries(Object.entries(done).filter(([p]) => pages.includes(+p) || weak.includes(+p)));
  return {
    ...state,
    cycle: { next: seq.next ?? cycle.next, count: cycle.count + seq.wrapped },
    today: { date: day, cycleBefore: cycle, carried: carry, pages, weak, done: keptDone },
  };
}

const startCycle = (state) => state.cycle ?? { next: state.memorized[0] ?? 1, count: 0 };

// ورد اليوم يُحسب مرة واحدة عند أول فتح للتطبيق في اليوم
export function ensureToday(state, day) {
  if (state.today && state.today.date === day) return state;
  const prev = state.today;
  const carried = prev ? prev.pages.filter((p) => prev.done[p] == null) : [];
  return buildDay(state, day, startCycle(state), carried, {}, []);
}

// عند تغيير مقدار الورد أو المحفوظ في منتصف اليوم: يُعاد بناء ورد اليوم من النقطة نفسها مع إبقاء ما رُوجع
export function rebuildToday(state, day) {
  const t = state.today;
  if (!t || t.date !== day) return ensureToday(state, day);
  return buildDay(state, day, t.cycleBefore, t.carried, t.done, t.weak);
}

// "زدني": صفحات إضافية من حيث انتهى الورد، فتتقدم الختمة
export function addExtra(state, count) {
  const t = state.today;
  const seq = takeSequential(state, state.cycle.next, count, new Set([...t.pages, ...t.weak]));
  return {
    ...state,
    cycle: { next: seq.next, count: state.cycle.count + seq.wrapped },
    today: { ...t, pages: [...t.pages, ...seq.pages] },
  };
}

export function reviewPage(state, page, rating, day) {
  const old = state.cards[page] || { reps: 0, lapses: 0 };
  const already = state.today?.date === day && state.today.done[page] != null;
  const card = {
    reps: old.reps + (already ? 0 : 1),
    lapses: old.lapses + (rating === WEAK && !already ? 1 : 0),
    last: day,
    rating,
    weakDue: rating === WEAK ? addDays(day, 1) : null,
  };
  const history = { ...state.history, [day]: (state.history[day] || 0) + (already ? 0 : 1) };
  let today = state.today;
  if (today?.date === day && (today.pages.includes(page) || today.weak.includes(page))) {
    today = { ...today, done: { ...today.done, [page]: rating } };
  }
  return { ...state, cards: { ...state.cards, [page]: card }, history, today };
}

export function streak(history, day) {
  let n = 0;
  let d = history[day] ? day : addDays(day, -1);
  while (history[d]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

// يجمع الصفحات المتتالية في مقاطع مع الحفاظ على ترتيبها: [601,602,1,2] -> [[601,602],[1,2]]
export function toRanges(pages) {
  const out = [];
  for (const p of pages) {
    const last = out[out.length - 1];
    if (last && last[1] === p - 1) last[1] = p;
    else out.push([p, p]);
  }
  return out;
}

// تقدّم الختمة الحالية: كم صفحة من المحفوظ قبل نقطة البداية التالية
export function cycleProgress(state) {
  const next = state.cycle?.next;
  if (next == null) return 0;
  const i = state.memorized.findIndex((p) => p >= next);
  return i < 0 ? 0 : i;
}
