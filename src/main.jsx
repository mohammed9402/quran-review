import { createRoot } from "react-dom/client";
import "@fontsource/amiri-quran/arabic-400.css";
import "./styles.css";
import App from "./App.jsx";
import { loadState } from "./store.js";

loadState().then(() => createRoot(document.getElementById("root")).render(<App />));
