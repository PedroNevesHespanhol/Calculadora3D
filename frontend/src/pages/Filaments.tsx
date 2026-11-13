import { useEffect, useState } from "react";
import { filamentsStore } from "../storage.js";
import type { Filament } from "../types.js";

export default function Filaments() {
  const [items, setItems] = useState<Filament[]>([]);
  const [name, setName] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await filamentsStore.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const price = Number(pricePerKg);
    if (!name.trim() || !Number.isFinite(price) || price < 0) {
      setError("Preencha nome e preço por kg válidos.");
      return;
    }
    try {
      await filamentsStore.add({ name: name.trim(), pricePerKg: price });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }
    setName("");
    setPricePerKg("");
    load();
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await filamentsStore.remove(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    load();
  }

  return (
    <section>
      <h2>Filamentos</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form-row">
        <input placeholder="Nome (ex: PLA Branco)" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Preço por kg (R$)"
          value={pricePerKg}
          onChange={(e) => setPricePerKg(e.target.value)}
          required
        />
        <button type="submit">Adicionar</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Preço/kg</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>R$ {item.pricePerKg.toFixed(2)}</td>
              <td>
                <button onClick={() => handleDelete(item.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="hint">Nenhum filamento cadastrado ainda.</p>}
    </section>
  );
}
