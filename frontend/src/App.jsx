import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import Metas from "./pages/Metas";
import Perfil from "./pages/Perfil";
import Planejamento from "./pages/Planejamento";
import Simulacoes from "./pages/Simulacoes";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Sidebar />
      <div id="conteudo" tabIndex={-1} className="finia-app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/planejamento" element={<Planejamento />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/simulacoes" element={<Simulacoes />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
