import { useEffect, useState } from "react";
import { printersStore } from "../storage.js";
import type { Printer } from "../types.js";

export default function Printers() {
  const [items, setItems] = useState<Printer[]>([]);
  const [name, setName] = useState("");
  const [powerWatts, setPowerWatts] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [lifetimeHours, setLifetimeHours] = useState("5000");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setItems(printersStore.list());
  }

  useEffect(load, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const power = Number(powerWatts);
    const price = Number(purchasePrice);
    const lifetime = Number(lifetimeHours);
    if (!name.trim() || !Number.isFinite(power) || !Number.isFinite(price) || !Number.isFinite(lifetime)) {
      setError("Preencha todos os campos com valores válidos.");
      return;
    }
    printersStore.add({ name: name.trim(), powerWatts: power, purchasePrice: price, lifetimeHours: lifetime });
    setName("");
    setPowerWatts("");
    setPurchasePrice("");
    setLifetimeHours("5000");
    load();
  }

  function handleDelete(id: string) {
    printersStore.remove(id);
    load();
  }

  return (
    <section>
      <h2>Impressoras</h2>
      <p className="hint">
        Verifique a potência (Watts) no manual ou em um medidor de consumo. Vida útil é uma estimativa
        (ex: 5.000h ≈ 2 a 3 anos de uso moderado).
      </p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form-row">
        <input placeholder="Nome (ex: Ender 3 V2)" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Potência (W)"
          value={powerWatts}
          onChange={(e) => setPowerWatts(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Valor pago (R$)"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          required
        />
        <input
          type="number"
          step="1"
          min="1"
          placeholder="Vida útil (horas)"
          value={lifetimeHours}
          onChange={(e) => setLifetimeHours(e.target.value)}
          required
        />
        <button type="submit">Adicionar</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Potência</th>
            <th>Valor pago</th>
            <th>Vida útil</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.powerWatts} W</td>
              <td>R$ {item.purchasePrice.toFixed(2)}</td>
              <td>{item.lifetimeHours} h</td>
              <td>
                <button onClick={() => handleDelete(item.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="hint">Nenhuma impressora cadastrada ainda.</p>}
    </section>
  );
}
