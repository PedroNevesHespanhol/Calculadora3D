import { NavLink, Route, Routes } from "react-router-dom";
import Calculator from "./pages/Calculator.js";
import Filaments from "./pages/Filaments.js";
import Printers from "./pages/Printers.js";
import Accessories from "./pages/Accessories.js";
import Settings from "./pages/Settings.js";
import History from "./pages/History.js";
import Quote from "./pages/Quote.js";

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <h1>Calculadora 3D</h1>
        <div className="nav-links">
          <NavLink to="/" end>
            Calculadora
          </NavLink>
          <NavLink to="/orcamento">Orçamento</NavLink>
          <NavLink to="/historico">Histórico</NavLink>
          <NavLink to="/impressoras">Impressoras</NavLink>
          <NavLink to="/filamentos">Filamentos</NavLink>
          <NavLink to="/acessorios">Acessórios</NavLink>
          <NavLink to="/configuracoes">Configurações</NavLink>
        </div>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Calculator />} />
          <Route path="/orcamento" element={<Quote />} />
          <Route path="/historico" element={<History />} />
          <Route path="/impressoras" element={<Printers />} />
          <Route path="/filamentos" element={<Filaments />} />
          <Route path="/acessorios" element={<Accessories />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
