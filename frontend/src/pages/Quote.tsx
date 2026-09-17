import { useEffect, useMemo, useState } from "react";
import { piecesStore, quoteDraftStore } from "../storage.js";
import type { Piece, PriceType, QuoteItem } from "../types.js";

const currency = (n: number) => `R$ ${n.toFixed(2)}`;

function priceForPiece(piece: Piece, priceType: PriceType): number {
  return priceType === "consumidor" ? piece.result.consumerFinalPrice : piece.result.resellerFinalPrice;
}

function buildQuoteText(clientName: string, items: QuoteItem[], notes: string): string {
  const lines: string[] = [];
  lines.push(`*Orçamento${clientName.trim() ? ` - ${clientName.trim()}` : ""}*`);
  lines.push(`Data: ${new Date().toLocaleDateString("pt-BR")}`);
  lines.push("");

  items.forEach((item, index) => {
    const subtotal = item.unitPrice * item.quantity;
    const label = item.priceType === "consumidor" ? "Consumidor Final" : "Lojista";
    lines.push(`${index + 1}. ${item.name} (${label})`);
    lines.push(`   ${item.quantity}x ${currency(item.unitPrice)} = ${currency(subtotal)}`);
    lines.push("");
  });

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  lines.push(`*Total: ${currency(total)}*`);

  if (notes.trim()) {
    lines.push("");
    lines.push(notes.trim());
  }

  return lines.join("\n");
}

export default function Quote() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);

  const [selectedPieceId, setSelectedPieceId] = useState<string>("manual");
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("consumidor");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    setPieces(piecesStore.list());
    const draft = quoteDraftStore.get();
    setClientName(draft.clientName);
    setNotes(draft.notes);
    setItems(draft.items);
  }, []);

  useEffect(() => {
    quoteDraftStore.save({ clientName, notes, items });
  }, [clientName, notes, items]);

  const selectedPiece = useMemo(() => pieces.find((p) => p.id === selectedPieceId) ?? null, [pieces, selectedPieceId]);

  useEffect(() => {
    if (selectedPiece) {
      setManualPrice(priceForPiece(selectedPiece, priceType).toFixed(2));
    }
  }, [selectedPiece, priceType]);

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    const price = Number(manualPrice);
    const name = selectedPiece ? selectedPiece.name : manualName.trim();

    if (!name) {
      setError("Informe o nome do produto ou selecione um item salvo.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Informe uma quantidade válida.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Informe um preço válido.");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        pieceId: selectedPiece?.id ?? null,
        name,
        quantity: qty,
        unitPrice: price,
        priceType,
      },
    ]);

    setManualName("");
    setQuantity("1");
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleClear() {
    setItems([]);
    setClientName("");
    setNotes("");
    quoteDraftStore.clear();
  }

  async function handleCopy() {
    const text = buildQuoteText(clientName, items, notes);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Orçamento copiado! Cole no WhatsApp.");
    } catch {
      setCopyMessage("Não foi possível copiar automaticamente — selecione e copie o texto abaixo.");
    }
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const quoteText = buildQuoteText(clientName, items, notes);

  return (
    <section>
      <h2>Orçamento</h2>
      <p className="hint">Monte um orçamento com um ou mais produtos e copie o texto para enviar no WhatsApp.</p>
      {error && <p className="error">{error}</p>}
      {copyMessage && <p className="success">{copyMessage}</p>}

      <div className="calculator-grid">
        <div>
          <div className="form-grid">
            <label>
              Nome do cliente (opcional)
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: Maria" />
            </label>
          </div>

          <h3>Adicionar produto</h3>
          <form onSubmit={handleAddItem} className="form-grid">
            <label>
              Produto salvo
              <select value={selectedPieceId} onChange={(e) => setSelectedPieceId(e.target.value)}>
                <option value="manual">Item manual (digitar abaixo)</option>
                {pieces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            {!selectedPiece && (
              <label>
                Nome do produto
                <input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Ex: Vaso decorativo" />
              </label>
            )}

            <label>
              Tipo de preço
              <select value={priceType} onChange={(e) => setPriceType(e.target.value as PriceType)}>
                <option value="consumidor">Consumidor final</option>
                <option value="lojista">Lojista</option>
              </select>
            </label>

            <label>
              Preço unitário (R$)
              <input type="number" min="0" step="0.01" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} />
            </label>

            <label>
              Quantidade
              <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>

            <button type="submit">Adicionar ao orçamento</button>
          </form>

          <h3>Itens do orçamento</h3>
          {items.length === 0 && <p className="hint">Nenhum item adicionado ainda.</p>}
          {items.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Qtd</th>
                  <th>Unitário</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.priceType === "consumidor" ? "Consumidor" : "Lojista"}</td>
                    <td>{item.quantity}</td>
                    <td>{currency(item.unitPrice)}</td>
                    <td>{currency(item.unitPrice * item.quantity)}</td>
                    <td>
                      <button type="button" onClick={() => handleRemoveItem(item.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {items.length > 0 && (
            <p>
              <strong>Total: {currency(total)}</strong>
            </p>
          )}

          <label>
            Observações (opcional, entram no final do texto)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>

          <div className="form-row">
            <button type="button" onClick={handleCopy} disabled={items.length === 0}>
              Copiar orçamento
            </button>
            <button type="button" onClick={handleClear}>
              Limpar orçamento
            </button>
          </div>
        </div>

        <div className="result-panel">
          <h3>Pré-visualização</h3>
          <pre className="quote-preview">{quoteText}</pre>
        </div>
      </div>
    </section>
  );
}
