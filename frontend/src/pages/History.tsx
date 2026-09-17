import { useEffect, useState } from "react";
import { piecesStore } from "../storage.js";
import type { Piece } from "../types.js";

const currency = (n: number) => `R$ ${n.toFixed(2)}`;

export default function History() {
  const [items, setItems] = useState<Piece[]>([]);

  function load() {
    setItems(
      [...piecesStore.list()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }

  useEffect(load, []);

  function handleDelete(id: string) {
    piecesStore.remove(id);
    load();
  }

  return (
    <section>
      <h2>Histórico de peças</h2>
      <p className="hint">Salvo localmente no seu navegador.</p>
      <table>
        <thead>
          <tr>
            <th>Peça</th>
            <th>Custo direto</th>
            <th>Preço consumidor</th>
            <th>Preço lojista</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{currency(item.result.directCost)}</td>
              <td>{currency(item.result.consumerFinalPrice)}</td>
              <td>{currency(item.result.resellerFinalPrice)}</td>
              <td>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td>
              <td>
                <button onClick={() => handleDelete(item.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="hint">Nenhuma peça salva ainda.</p>}
    </section>
  );
}
