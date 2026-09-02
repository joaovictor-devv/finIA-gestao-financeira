import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Planejamento from "./pages/Planejamento";
import Metas from "./pages/Metas";
import Insights from "./pages/Insights";
import Perfil from "./pages/Perfil";
import RevisaoMensal from "./pages/RevisaoMensal";

function App() {
  return (
    <BrowserRouter>
      <Sidebar />

      <div className="pb-20 md:ml-[280px] md:pb-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/planejamento" element={<Planejamento />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/revisao-mensal" element={<RevisaoMensal />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;