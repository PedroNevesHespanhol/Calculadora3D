import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase.js";
import Calculator from "./pages/Calculator.js";
import Filaments from "./pages/Filaments.js";
import Printers from "./pages/Printers.js";
import Accessories from "./pages/Accessories.js";
import Settings from "./pages/Settings.js";
import History from "./pages/History.js";
import Quote from "./pages/Quote.js";
import Login from "./pages/Login.js";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) {
    return (
      <div className="app">
        <section>
          <h2>Banco de dados não configurado</h2>
          <p>
            Crie o arquivo <code>frontend/.env</code> (copie de <code>.env.example</code>) com{" "}
            <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> e reinicie o <code>npm run dev</code>.
          </p>
        </section>
      </div>
    );
  }

  if (session === undefined) return <div className="app">Carregando...</div>;

  if (!session) {
    return (
      <div className="app">
        <nav className="nav">
          <h1>Calculadora 3D</h1>
        </nav>
        <Login />
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-top">
          <h1>Calculadora 3D</h1>
          <span className="hint">
            {session.user.email}{" "}
            <button type="button" className="link-button" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
          </span>
        </div>
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
