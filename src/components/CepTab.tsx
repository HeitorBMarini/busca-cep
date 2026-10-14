"use client";

import { ExternalLink, History, Link2, Loader2, MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { enderecoEmLinha, formatCep, maskCep, onlyDigits, type Endereco } from "@/lib/br";
import { CopyButton, cx, ErrorBox, fetchCep, Field, MapView } from "./ui";

const HIST_KEY = "busca-cep.historico";

function readHistory(): Endereco[] {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function CepTab({ initialCep }: { initialCep?: string }) {
  const [input, setInput] = useState(initialCep ? maskCep(initialCep) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Endereco | null>(null);
  const [history, setHistory] = useState<Endereco[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSearched = useRef<string | null>(null);

  async function search(raw: string) {
    const cep = onlyDigits(raw);
    if (cep.length !== 8) {
      setError("Digite os 8 números do CEP.");
      return;
    }
    if (cep === lastSearched.current && result) return;
    lastSearched.current = cep;
    setLoading(true);
    setError(null);
    try {
      const r = await fetchCep(cep);
      setResult(r);
      const next = [r, ...readHistory().filter((h) => h.cep !== r.cep)].slice(0, 8);
      localStorage.setItem(HIST_KEY, JSON.stringify(next));
      setHistory(next);
      updateUrl(cep);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  }

  // ?cep= na URL para compartilhar
  function updateUrl(cep: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("cep", cep);
    url.searchParams.delete("aba");
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    // carrega o histórico salvo e, se veio um CEP pelo link, busca na hora
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única do localStorage
    setHistory(readHistory());
    if (initialCep) search(initialCep);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareUrl = result && typeof window !== "undefined" ? `${window.location.origin}/?cep=${result.cep}` : "";
  const mapsUrl = result ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoEmLinha(result))}` : "";

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(input);
        }}
        className="flex items-center gap-2 rounded-3xl border border-line bg-card p-2 shadow-sm focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/15"
      >
        <MapPin size={20} className="ml-3 shrink-0 text-faint" />
        <label htmlFor="cep" className="sr-only">
          CEP
        </label>
        <input
          id="cep"
          ref={inputRef}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={input}
          onChange={(e) => {
            const m = maskCep(e.target.value);
            setInput(m);
            setError(null);
            if (onlyDigits(m).length === 8) search(m);
          }}
          className="h-12 min-w-0 flex-1 bg-transparent font-mono text-2xl tracking-wider text-fg outline-none placeholder:text-faint/60"
        />
        {input && (
          <button
            type="button"
            aria-label="Limpar"
            onClick={() => {
              setInput("");
              setResult(null);
              setError(null);
              lastSearched.current = null;
              inputRef.current?.focus();
            }}
            className="grid h-10 w-10 place-items-center rounded-full text-faint hover:bg-raised hover:text-fg"
          >
            <X size={18} />
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-5 font-semibold text-accent-fg transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </form>

      <p className="-mt-3 px-2 text-xs text-faint">
        A busca começa sozinha quando o CEP fica completo. Atalho: <kbd className="rounded border border-line bg-raised px-1.5 font-mono">/</kbd>
      </p>

      {error && <ErrorBox>{error}</ErrorBox>}

      {loading && !result && (
        <div className="grid animate-pulse gap-3 sm:grid-cols-2" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[70px] rounded-2xl bg-raised" />
          ))}
        </div>
      )}

      {result && (
        <section key={result.cep} className={cx("animate-rise overflow-hidden rounded-3xl border border-line bg-card", loading && "opacity-60")} aria-live="polite">
          <div className="grid lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-5 p-5 sm:p-7">
              <div>
                <p className="font-mono text-sm text-accent">CEP {formatCep(result.cep)}</p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight text-fg sm:text-3xl">
                  {result.logradouro || `${result.cidade}/${result.uf}`}
                </h2>
                {result.logradouro && (
                  <p className="mt-1 text-muted">
                    {[result.bairro, `${result.cidade}/${result.uf}`].filter(Boolean).join(" · ")}
                  </p>
                )}
                {!result.logradouro && <p className="mt-1 text-sm text-muted">CEP geral da cidade (não tem rua específica).</p>}
              </div>

              <dl className="grid grid-cols-2 gap-2.5">
                <Field label="Logradouro" value={result.logradouro} wide />
                {result.complemento && <Field label="Complemento" value={result.complemento} wide />}
                <Field label="Bairro" value={result.bairro} />
                <Field label="Cidade" value={result.cidade} />
                <Field label="Estado" value={`${result.estado} (${result.uf})`} />
                <Field label="Região" value={result.regiao} />
                <Field label="DDD" value={result.ddd} mono />
                <Field label="Código IBGE" value={result.ibge} mono />
              </dl>

              <div className="flex flex-wrap gap-2">
                <CopyButton text={enderecoEmLinha(result)} label="Copiar endereço" />
                <CopyButton text={formatCep(result.cep)} label="Copiar CEP" />
                <CopyButton text={shareUrl} label="Copiar link" />
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-sm font-medium text-fg transition hover:border-accent/60"
                >
                  <ExternalLink size={16} className="text-muted" />
                  Google Maps
                </a>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-faint">
                <Link2 size={12} /> Dados: {result.fonte}
                {result.coords && ` · Mapa: OpenStreetMap (${result.coords.precisao === "rua" ? "localização da rua" : "centro da cidade"})`}
              </p>
            </div>
            <div className="relative min-h-[280px] border-t border-line bg-raised lg:border-l lg:border-t-0">
              {result.coords ? (
                <MapView lat={result.coords.lat} lon={result.coords.lon} zoom={result.coords.precisao} title={`Mapa de ${enderecoEmLinha(result)}`} />
              ) : (
                <div className="grid h-full place-items-center p-8 text-center text-sm text-faint">Não foi possível localizar no mapa.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted">
              <History size={15} /> Buscas recentes
            </h3>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(HIST_KEY);
                setHistory([]);
              }}
              className="text-xs text-faint hover:text-fg"
            >
              Limpar histórico
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                key={h.cep}
                type="button"
                onClick={() => {
                  setInput(formatCep(h.cep));
                  search(h.cep);
                }}
                className={cx(
                  "rounded-full border px-3.5 py-1.5 text-left text-sm transition",
                  result?.cep === h.cep ? "border-accent bg-accent-soft text-fg" : "border-line bg-card text-muted hover:border-accent/50 hover:text-fg",
                )}
              >
                <span className="font-mono">{formatCep(h.cep)}</span>
                <span className="text-faint"> · {h.cidade}/{h.uf}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
