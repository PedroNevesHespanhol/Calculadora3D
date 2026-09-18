import { useEffect, useMemo, useState } from "react";
import { calculatePricing, suggestResellerMarkup } from "../calc.js";
import { accessoriesStore, filamentsStore, piecesStore, printersStore, settingsStore } from "../storage.js";
import type { Accessory, CalcResult, Filament, Printer, Settings } from "../types.js";

const currency = (n: number) => `R$ ${n.toFixed(2)}`;

export default function Calculator() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [pieceName, setPieceName] = useState("");
  const [printerId, setPrinterId] = useState<string | null>(null);
  const [filamentId, setFilamentId] = useState<string | null>(null);
  const [gramsUsed, setGramsUsed] = useState("");
  const [printHours, setPrintHours] = useState("");
  const [printMinutesPart, setPrintMinutesPart] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [failureRatePct, setFailureRatePct] = useState("");
  const [consumerMarkup, setConsumerMarkup] = useState("");
  const [resellerMarkup, setResellerMarkup] = useState("");
  const [resellerAuto, setResellerAuto] = useState(true);
  const [marketplaceFeePct, setMarketplaceFeePct] = useState("");
  const [cardFeePct, setCardFeePct] = useState("");
  const [extraPackagingCost, setExtraPackagingCost] = useState("0");
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const p = printersStore.list();
    const f = filamentsStore.list();
    const a = accessoriesStore.list();
    const s = settingsStore.get();
    setPrinters(p);
    setFilaments(f);
    setAccessories(a);
    setSettings(s);
    if (p.length > 0) setPrinterId(p[0].id);
    if (f.length > 0) setFilamentId(f[0].id);
    setFailureRatePct(String(s.defaultFailureRatePct));
    setConsumerMarkup(String(s.defaultConsumerMarkup));
    setResellerMarkup(String(s.defaultResellerMarkup));
    setMarketplaceFeePct(String(s.marketplaceFeePct));
    setCardFeePct(String(s.cardFeePct));
  }, []);

  function handleConsumerMarkupChange(value: string) {
    setConsumerMarkup(value);
    if (resellerAuto) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) setResellerMarkup(String(suggestResellerMarkup(parsed)));
    }
  }

  function handleResellerMarkupChange(value: string) {
    setResellerAuto(false);
    setResellerMarkup(value);
  }

  function resetResellerAuto() {
    setResellerAuto(true);
    const parsed = Number(consumerMarkup);
    if (Number.isFinite(parsed)) setResellerMarkup(String(suggestResellerMarkup(parsed)));
  }

  const selectedPrinter = useMemo(() => printers.find((p) => p.id === printerId) ?? null, [printers, printerId]);
  const selectedFilament = useMemo(() => filaments.find((f) => f.id === filamentId) ?? null, [filaments, filamentId]);

  const totalPrintMinutes = (Number(printHours || 0) * 60) + Number(printMinutesPart || 0);

  const result: CalcResult | null = useMemo(() => {
    if (!selectedPrinter || !selectedFilament || !settings) return null;
    const grams = Number(gramsUsed);
    if (
      gramsUsed === "" ||
      (printHours === "" && printMinutesPart === "") ||
      !Number.isFinite(grams) ||
      !Number.isFinite(totalPrintMinutes) ||
      totalPrintMinutes <= 0
    ) {
      return null;
    }
    const accessoriesCost = accessories
      .filter((a) => selectedAccessoryIds.includes(a.id))
      .reduce((sum, a) => sum + a.cost, 0);

    return calculatePricing({
      gramsUsed: grams,
      printMinutes: totalPrintMinutes,
      filamentPricePerKg: selectedFilament.pricePerKg,
      printerPowerWatts: selectedPrinter.powerWatts,
      printerPurchasePrice: selectedPrinter.purchasePrice,
      printerLifetimeHours: selectedPrinter.lifetimeHours,
      energyPriceKwh: settings.energyPriceKwh,
      accessoriesCost,
      extraPackagingCost: Number(extraPackagingCost || 0),
      failureRatePct: Number(failureRatePct || 0),
      consumerMarkup: Number(consumerMarkup || 1),
      resellerMarkup: Number(resellerMarkup || 1),
      marketplaceFeePct: Number(marketplaceFeePct || 0),
      cardFeePct: Number(cardFeePct || 0),
      quantity: Number(quantity || 1),
    });
  }, [
    selectedPrinter,
    selectedFilament,
    settings,
    gramsUsed,
    printHours,
    printMinutesPart,
    totalPrintMinutes,
    accessories,
    selectedAccessoryIds,
    extraPackagingCost,
    failureRatePct,
    consumerMarkup,
    resellerMarkup,
    marketplaceFeePct,
    cardFeePct,
    quantity,
  ]);

  function toggleAccessory(id: string) {
    setSelectedAccessoryIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function handleSave() {
    if (!result || !printerId || !filamentId) {
      setError("Preencha os campos da calculadora antes de salvar.");
      return;
    }
    if (!pieceName.trim()) {
      setError("Informe o nome da peça antes de salvar.");
      return;
    }
    setError(null);
    piecesStore.add({
      name: pieceName.trim(),
      printerId,
      filamentId,
      gramsUsed: Number(gramsUsed),
      printMinutes: totalPrintMinutes,
      quantity: Number(quantity || 1),
      failureRatePct: Number(failureRatePct || 0),
      consumerMarkup: Number(consumerMarkup || 1),
      resellerMarkup: Number(resellerMarkup || 1),
      marketplaceFeePct: Number(marketplaceFeePct || 0),
      cardFeePct: Number(cardFeePct || 0),
      extraPackagingCost: Number(extraPackagingCost || 0),
      accessoryIds: selectedAccessoryIds,
      result,
      createdAt: new Date().toISOString(),
    });
    setSaveMessage("Peça salva no histórico.");
  }

  if (!settings) return <p>Carregando...</p>;

  if (printers.length === 0 || filaments.length === 0) {
    return (
      <section>
        <h2>Calculadora</h2>
        <p className="hint">
          Cadastre pelo menos uma impressora e um filamento antes de usar a calculadora.
        </p>
      </section>
    );
  }

  return (
    <section className="calculator">
      <h2>Calculadora de Precificação</h2>
      {error && <p className="error">{error}</p>}
      {saveMessage && <p className="success">{saveMessage}</p>}

      <div className="calculator-grid">
        <div className="form-grid">
          <label>
            Nome da peça
            <input value={pieceName} onChange={(e) => setPieceName(e.target.value)} placeholder="Ex: Suporte de celular" />
          </label>

          <label>
            Impressora
            <select value={printerId ?? ""} onChange={(e) => setPrinterId(e.target.value)}>
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Filamento
            <select value={filamentId ?? ""} onChange={(e) => setFilamentId(e.target.value)}>
              {filaments.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Gramas usadas (g)
            <input type="number" min="0" step="0.1" value={gramsUsed} onChange={(e) => setGramsUsed(e.target.value)} />
          </label>

          <label>
            Tempo de impressão
            <div className="time-input">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Horas"
                value={printHours}
                onChange={(e) => setPrintHours(e.target.value)}
              />
              <span>h</span>
              <input
                type="number"
                min="0"
                max="59"
                step="1"
                placeholder="Minutos"
                value={printMinutesPart}
                onChange={(e) => setPrintMinutesPart(e.target.value)}
              />
              <span>min</span>
            </div>
          </label>

          <label>
            Quantidade de peças no lote
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <span className="hint">Gramas e tempo acima são do lote inteiro; o preço será calculado por peça.</span>
          </label>

          <label>
            Taxa de falha (%)
            <input type="number" min="0" max="100" step="0.1" value={failureRatePct} onChange={(e) => setFailureRatePct(e.target.value)} />
          </label>

          <label>
            Markup consumidor final (x)
            <input type="number" min="1" step="0.1" value={consumerMarkup} onChange={(e) => handleConsumerMarkupChange(e.target.value)} />
          </label>

          <label>
            Markup lojista (x) {resellerAuto && <span className="hint">(automático)</span>}
            <input type="number" min="1" step="0.1" value={resellerMarkup} onChange={(e) => handleResellerMarkupChange(e.target.value)} />
          </label>

          {!resellerAuto && (
            <button type="button" onClick={resetResellerAuto}>
              Usar sugestão automática
            </button>
          )}

          <label>
            Taxa marketplace (%)
            <input type="number" min="0" max="99" step="0.1" value={marketplaceFeePct} onChange={(e) => setMarketplaceFeePct(e.target.value)} />
          </label>

          <label>
            Taxa cartão (%)
            <input type="number" min="0" max="99" step="0.1" value={cardFeePct} onChange={(e) => setCardFeePct(e.target.value)} />
          </label>

          <label>
            Embalagem extra manual (R$)
            <input type="number" min="0" step="0.01" value={extraPackagingCost} onChange={(e) => setExtraPackagingCost(e.target.value)} />
          </label>

          <fieldset>
            <legend>Acessórios</legend>
            {accessories.length === 0 && <p className="hint">Nenhum acessório cadastrado.</p>}
            {accessories.map((a) => (
              <label key={a.id} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={selectedAccessoryIds.includes(a.id)}
                  onChange={() => toggleAccessory(a.id)}
                />
                {a.name} ({currency(a.cost)})
              </label>
            ))}
          </fieldset>

          <button type="button" onClick={handleSave}>
            Salvar peça no histórico
          </button>
        </div>

        <div className="result-panel">
          <h3>Resultado {result && result.quantity > 1 && <span className="hint">(por peça, lote de {result.quantity})</span>}</h3>
          {!result && <p className="hint">Preencha gramas e tempo de impressão para calcular.</p>}
          {result && (
            <>
              <table className="result-table">
                <tbody>
                  <tr>
                    <td>Custo filamento</td>
                    <td>{currency(result.filamentCost)}</td>
                  </tr>
                  <tr>
                    <td>Custo energia</td>
                    <td>{currency(result.energyCost)}</td>
                  </tr>
                  <tr>
                    <td>Depreciação impressora</td>
                    <td>{currency(result.depreciationCost)}</td>
                  </tr>
                  <tr>
                    <td>Embalagem/acessórios</td>
                    <td>{currency(result.packagingCost)}</td>
                  </tr>
                  <tr className="subtotal">
                    <td>Custo direto (unitário)</td>
                    <td>{currency(result.directCost)}</td>
                  </tr>
                  <tr className="subtotal">
                    <td>Custo com falha (unitário)</td>
                    <td>{currency(result.costWithFailure)}</td>
                  </tr>
                  {result.quantity > 1 && (
                    <tr className="subtotal">
                      <td>Custo com falha (lote de {result.quantity})</td>
                      <td>{currency(result.costWithFailure * result.quantity)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="price-cards">
                <div className="price-card">
                  <span>Preço Consumidor Final (unitário)</span>
                  <strong>{currency(result.consumerFinalPrice)}</strong>
                  <small>Seu lucro: {currency(result.myProfitConsumerSale)}</small>
                </div>
                <div className="price-card">
                  <span>Preço para Lojista (unitário)</span>
                  <strong>{currency(result.resellerFinalPrice)}</strong>
                  <small>Seu lucro: {currency(result.myProfitResellerSale)}</small>
                  <small>Lucro do lojista ao revender: {currency(result.resellerProfit)}</small>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
