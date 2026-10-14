"use client";

import { ExternalLink, Loader2, Route } from "lucide-react";
import { useState } from "react";

import { distanciaKm, enderecoEmLinha, formatCep, maskCep, onlyDigits, type Endereco } from "@/lib/br";
import { ErrorBox, fetchCep } from "./ui";

const inputCls =
  "h-12 w-full rounded-2xl border border-line bg-card px-4 font-mono text-lg tracking-wider text-fg outline-none transition placeholder:text-faint/60 focus:border-accent/60 focus:ring-4 focus:ring-accent/15";

function Ponto({ e, letra }: { e: Endereco; letra: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-sm font-bold text-accent">{letra}</span>
      <div className="min-w-0">
        <p className="font-mono text-sm text-accent">{formatCep(e.cep)}</p>
        <p className="truncate text-fg">{e.logradouro || "CEP geral da cidade"}</p>
        <p className="truncate text-sm text-muted">
          {e.bairro ? `${e.bairro} · ` : ""}
          {e.cidade}/{e.uf}
        </p>
      </div>
    </div>
  );
}

export function DistanciaTab() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<{ a: Endereco; b: Endereco; km: number | null } | null>(null);

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    if (onlyDigits(a).length !== 8 || onlyDigits(b).length !== 8) {
      setError("Preencha os dois CEPs com 8 números.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ea, eb] = await Promise.all([fetchCep(onlyDigits(a)), fetchCep(onlyDigits(b))]);
      setRes({ a: ea, b: eb, km: ea.coords && eb.coords ? distanciaKm(ea.coords, eb.coords) : null });
    } catch (err) {
      setRes(null);
      setError(err instanceof Error ? err.message : "Erro ao calcular.");
    } finally {
      setLoading(false);
    }
  }

  const km = res?.km;
  const rotaUrl = res
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(enderecoEmLinha(res.a))}&destination=${encodeURIComponent(enderecoEmLinha(res.b))}`
    : "";

  return (
    <div className="space-y-6">
      <form onSubmit={calc} className="grid gap-3 rounded-3xl border border-line bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:p-5">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted">CEP de origem</span>
          <input inputMode="numeric" value={a} onChange={(e) => setA(maskCep(e.target.value))} placeholder="01310-100" className={inputCls} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted">CEP de destino</span>
          <input inputMode="numeric" value={b} onChange={(e) => setB(maskCep(e.target.value))} placeholder="20040-020" className={inputCls} />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 self-end rounded-2xl bg-accent px-5 font-semibold text-accent-fg transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Route size={18} />}
          Calcular
        </button>
      </form>

      {error && <ErrorBox>{error}</ErrorBox>}

      {res && (
        <section className="animate-rise grid gap-6 rounded-3xl border border-line bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div className="space-y-4">
            <Ponto e={res.a} letra="A" />
            <div className="ml-4 h-6 border-l-2 border-dashed border-line" />
            <Ponto e={res.b} letra="B" />
          </div>
          <div className="space-y-3 rounded-2xl bg-raised p-5 text-center sm:min-w-[220px]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Em linha reta</p>
            <p className="text-4xl font-semibold text-fg">
              {km == null ? "—" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString("pt-BR", { maximumFractionDigits: km < 100 ? 1 : 0 })} km`}
            </p>
            {km == null && <p className="text-xs text-faint">Não foi possível localizar um dos CEPs.</p>}
            {km != null && <p className="text-xs text-faint">De carro costuma ser 20% a 40% mais.</p>}
            <a
              href={rotaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-sm font-medium text-fg transition hover:border-accent/60"
            >
              <ExternalLink size={15} className="text-muted" /> Ver rota
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
