import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./styles/index.css";

const savedTheme = window.localStorage.getItem("scp-theme");
document.documentElement.dataset.theme = savedTheme === "light" ? "light" : "dark";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
