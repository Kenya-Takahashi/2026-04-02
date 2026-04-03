import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { SessionPage } from "./pages/SessionPage";
import { EmptyState } from "./pages/EmptyState";

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<EmptyState />} />
          <Route path="/sessions/:id" element={<SessionPage />} />
        </Routes>
      </main>
    </div>
  );
}
