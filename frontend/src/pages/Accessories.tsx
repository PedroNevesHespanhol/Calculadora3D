import { useEffect, useState } from "react";
import { accessoriesStore } from "../storage.js";
import type { Accessory } from "../types.js";

export default function Accessories() {
  const [items, setItems] = useState<Accessory[]>([]);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await accessoriesStore.list());
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
    const value = Number(cost);
    if (!name.trim() || !Number.isFinite(value) || value < 0) {
      setError("Preencha nome e custo válidos.");
      return;
    }
    try {
      await accessoriesStore.add({ name: name.trim(), cost: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }
    setName("");
    setCost("");
    load();
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await accessoriesStore.remove(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    load();
  }

  return (
    <section>
      <h2>Acessórios</h2>
      <p className="hint">
        Embalagens, chaveiros, ímãs, etc. Na calculadora você pode selecionar mais de um acessório por
        peça — os custos são somados.
      </p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form-row">
        <input placeholder="Nome (ex: Caixa pequena)" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Custo (R$)"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
        />
        <button type="submit">Adicionar</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Custo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>R$ {item.cost.toFixed(2)}</td>
              <td>
                <button onClick={() => handleDelete(item.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="hint">Nenhum acessório cadastrado ainda.</p>}
    </section>
  );
}
