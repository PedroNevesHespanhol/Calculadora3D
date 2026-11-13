import { useState } from "react";
import { supabase } from "../supabase.js";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setMessage("Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.");
          setMode("login");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="login">
      <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
      <p className="hint">Seus dados ficam salvos no banco e acessíveis de qualquer dispositivo.</p>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>
      <p className="hint">
        {mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
        <button type="button" className="link-button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Criar conta" : "Entrar"}
        </button>
      </p>
    </section>
  );
}
