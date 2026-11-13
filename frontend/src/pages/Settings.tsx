import { useEffect, useState } from "react";
import { suggestResellerMarkup } from "../calc.js";
import { clearLegacyData, getLegacySummary, importLegacyData, type LegacySummary } from "../migration.js";
import { settingsStore } from "../storage.js";
import type { Settings as SettingsType } from "../types.js";

export default function Settings() {
  const [form, setForm] = useState<SettingsType | null>(null);
  const [resellerAuto, setResellerAuto] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setForm(await settingsStore.get());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateNumber(field: keyof SettingsType, value: string) {
    if (!form) return;
    setForm({ ...form, [field]: Number(value) });
    setSaved(false);
  }

  function updateConsumerMarkup(value: string) {
    if (!form) return;
    const consumerMarkup = Number(value);
    setForm({
      ...form,
      defaultConsumerMarkup: consumerMarkup,
      defaultResellerMarkup: resellerAuto ? suggestResellerMarkup(consumerMarkup) : form.defaultResellerMarkup,
    });
    setSaved(false);
  }

  function updateResellerMarkup(value: string) {
    if (!form) return;
    setResellerAuto(false);
    setForm({ ...form, defaultResellerMarkup: Number(value) });
    setSaved(false);
  }

  function resetResellerAuto() {
    if (!form) return;
    setResellerAuto(true);
    setForm({ ...form, defaultResellerMarkup: suggestResellerMarkup(form.defaultConsumerMarkup) });
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    try {
      await settingsStore.save(form);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (!form) return error ? <p className="error">{error}</p> : <p>Carregando...</p>;

  return (
    <>
    <section>
      <h2>Configurações padrão</h2>
      <p className="hint">
        Esses valores são usados como padrão na calculadora, mas podem ser ajustados por peça. Tudo é
        salvo no banco de dados da sua conta.
      </p>
      {error && <p className="error">{error}</p>}
      {saved && <p className="success">Salvo com sucesso.</p>}
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Preço do kWh (R$)
          <input
            type="number"
            step="0.0001"
            min="0"
            value={form.energyPriceKwh}
            onChange={(e) => updateNumber("energyPriceKwh", e.target.value)}
          />
        </label>
        <label>
          Taxa de falha padrão (%)
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.defaultFailureRatePct}
            onChange={(e) => updateNumber("defaultFailureRatePct", e.target.value)}
          />
        </label>
        <label>
          Markup consumidor final (x)
          <input
            type="number"
            step="0.1"
            min="1"
            value={form.defaultConsumerMarkup}
            onChange={(e) => updateConsumerMarkup(e.target.value)}
          />
        </label>
        <label>
          Markup lojista (x) {resellerAuto && <span className="hint">(automático — keystone)</span>}
          <input
            type="number"
            step="0.1"
            min="1"
            value={form.defaultResellerMarkup}
            onChange={(e) => updateResellerMarkup(e.target.value)}
          />
        </label>
        {!resellerAuto && (
          <button type="button" onClick={resetResellerAuto}>
            Usar sugestão automática
          </button>
        )}
        <label>
          Taxa marketplace (%)
          <input
            type="number"
            step="0.1"
            min="0"
            max="99"
            value={form.marketplaceFeePct}
            onChange={(e) => updateNumber("marketplaceFeePct", e.target.value)}
          />
        </label>
        <label>
          Taxa cartão/maquininha (%)
          <input
            type="number"
            step="0.1"
            min="0"
            max="99"
            value={form.cardFeePct}
            onChange={(e) => updateNumber("cardFeePct", e.target.value)}
          />
        </label>
        <button type="submit">Salvar</button>
      </form>
      <p className="hint">
        Markup é o multiplicador sobre o custo (ex: 3x = preço final é 3 vezes o custo). O padrão de
        mercado (keystone pricing) sugere markup do lojista = markup do consumidor ÷ 2, para que ele
        possa dobrar o preço e ainda bater no valor sugerido ao consumidor final.
      </p>
    </section>
    <LegacyImport onImported={load} />
    </>
  );
}

function LegacyImport({ onImported }: { onImported: () => void }) {
  const [summary, setSummary] = useState<LegacySummary>(() => getLegacySummary());
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (summary.total === 0 && !imported) return null;

  async function handleImport() {
    setBusy(true);
    setError(null);
    try {
      await importLegacyData();
      setImported(true);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function handleClear() {
    if (!confirm("Apagar os dados antigos deste navegador? Eles já estão no banco.")) return;
    clearLegacyData();
    setSummary(getLegacySummary());
  }

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2>Dados antigos deste navegador</h2>
      <p className="hint">
        Encontramos dados salvos no navegador (versão anterior do app): {summary.printers} impressora(s),{" "}
        {summary.filaments} filamento(s), {summary.accessories} acessório(s), {summary.pieces} peça(s) no histórico
        {summary.hasSettings && ", configurações"}
        {summary.hasQuoteDraft && ", rascunho de orçamento"}.
      </p>
      {error && <p className="error">{error}</p>}
      {imported ? (
        <>
          <p className="success">
            Importação concluída! Confira as páginas. Depois, se quiser, apague a cópia antiga do navegador.
          </p>
          {summary.total > 0 && (
            <button type="button" onClick={handleClear}>
              Apagar dados antigos do navegador
            </button>
          )}
        </>
      ) : (
        <>
          <p className="hint">
            A importação envia tudo para a sua conta mantendo os vínculos entre peças, impressoras e filamentos.
            Importar de novo não duplica nada. As configurações e o rascunho atuais no banco serão substituídos pelos do
            navegador.
          </p>
          <button type="button" onClick={handleImport} disabled={busy}>
            {busy ? "Importando..." : "Importar para o banco"}
          </button>
        </>
      )}
    </section>
  );
}
