import { Choice } from "@/pages/Choice";
import { GameView } from "@/pages/GameView";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export function PageRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Choice />} />
        <Route path="/game" element={<GameView />} />
      </Routes>
    </BrowserRouter>
  );
}
