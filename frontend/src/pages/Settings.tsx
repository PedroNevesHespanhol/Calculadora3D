import { useEffect, useState } from "react";
import { suggestResellerMarkup } from "../calc.js";
import { settingsStore } from "../storage.js";
import type { Settings as SettingsType } from "../types.js";

export default function Settings() {
  const [form, setForm] = useState<SettingsType | null>(null);
  const [resellerAuto, setResellerAuto] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settingsStore.get());
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    settingsStore.save(form);
    setSaved(true);
  }

  if (!form) return <p>Carregando...</p>;

  return (
    <section>
      <h2>Configurações padrão</h2>
      <p className="hint">
        Esses valores são usados como padrão na calculadora, mas podem ser ajustados por peça. Tudo é
        salvo automaticamente no seu navegador (localStorage).
      </p>
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
  );
}
