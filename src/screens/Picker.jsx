import { useState } from "react";
import { useStore, setState } from "../store.js";
import { addMemorized, removeMemorized, rebuildToday } from "../schedule.js";
import { today } from "../date.js";
import MemorizedPicker from "./MemorizedPicker.jsx";

// تعديل المحفوظ من الإعدادات
export default function Picker({ nav }) {
  const state = useStore();
  const [selected, setSelected] = useState(new Set(state.memorized));

  const save = () => {
    const day = today();
    setState((s) => {
      const removed = s.memorized.filter((p) => !selected.has(p));
      let next = removeMemorized(s, removed);
      next = addMemorized(next, [...selected]);
      return rebuildToday(next, day);
    });
    nav.back();
  };

  return (
    <div className="screen">
      <header className="bar">
        <button className="icon" onClick={nav.back}>→</button>
        <h2>تعديل المحفوظ</h2>
        <button className="primary small" disabled={!selected.size} onClick={save}>حفظ</button>
      </header>
      <div className="content">
        <MemorizedPicker selected={selected} onChange={setSelected} />
      </div>
    </div>
  );
}
