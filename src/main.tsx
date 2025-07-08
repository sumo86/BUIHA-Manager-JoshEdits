import { createRoot } from "react-dom/client";
import App from "./App.tsx"; // App now exports the RouterProvider wrapped with context
import "./globals.css";

createRoot(document.getElementById("root")!).render(<App />);