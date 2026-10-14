"use client";

import { ArrowRight, Loader2, Search } from "lucide-react";
import { useState } from "react";

import { formatCep, UFS } from "@/lib/br";
import { ErrorBox } from "./ui";

type Item = { cep: string; logradouro: string; complemento: string; bairro: string; cidade: string; uf: string };

const inputCls =
  "h-12 w-full rounded-2xl border border-line bg-card px-4 text-[15px] text-fg outline-none transition placeholder:text-faint focus:border-accent/60 focus:ring-4 focus:ring-accent/15";

export function EnderecoTab({ onPick }: { onPick: (cep: string) => void }) {
  const [uf, setUf] = useState("SP");
  const [cidade, setCidade] = useState("");
  const [rua, setRua] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (cidade.trim().length < 3 || rua.trim().length < 3) {
      setError("Cidade e rua precisam ter pelo menos 3 letras.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ uf, cidade: cidade.trim(), rua: rua.trim() });
      const r = await fetch(`/api/endereco?${q}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setItems(j);
    } catch (err) {
      setItems(null);
      setError(err instanceof Error ? err.message : "Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="grid gap-3 rounded-3xl border border-line bg-card p-4 sm:grid-cols-[110px_1fr_1.4fr_auto] sm:p-5">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted">Estado</span>
          <select value={uf} onChange={(e) => setUf(e.target.value)} className={inputCls}>
            {Object.keys(UFS).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted">Cidade</span>
          <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="São Paulo" className={inputCls} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted">Rua</span>
          <input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Avenida Paulista" className={inputCls} />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 self-end rounded-2xl bg-accent px-5 font-semibold text-accent-fg transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          Buscar
        </button>
      </form>

      {error && <ErrorBox>{error}</ErrorBox>}

      {items && (
        <div className="animate-rise space-y-3">
          <p className="px-1 text-sm text-muted">
            {items.length === 0
              ? "Nenhum CEP encontrado. Confira a grafia da cidade e da rua (sem número)."
              : `${items.length}${items.length === 50 ? "+" : ""} CEP(s) encontrado(s). Toque para ver o endereço completo e o mapa.`}
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
            {items.map((it) => (
              <li key={it.cep + it.complemento}>
                <button
                  type="button"
                  onClick={() => onPick(it.cep)}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-raised"
                >
                  <span className="w-[92px] shrink-0 font-mono text-accent">{formatCep(it.cep)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-fg">
                      {it.logradouro}
                      {it.complemento && <span className="text-faint"> · {it.complemento}</span>}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {it.bairro} · {it.cidade}/{it.uf}
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
