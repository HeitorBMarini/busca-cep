"use client";

import { MapPinned, Moon, Ruler, Search, Signpost, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { onlyDigits } from "@/lib/br";
import { CepTab } from "./CepTab";
import { DistanciaTab } from "./DistanciaTab";
import { EnderecoTab } from "./EnderecoTab";
import { cx } from "./ui";

type Tab = "cep" | "endereco" | "distancia";

const TABS: { key: Tab; label: string; short: string; icon: typeof Search }[] = [
  { key: "cep", label: "CEP → endereço", short: "CEP", icon: Search },
  { key: "endereco", label: "Endereço → CEP", short: "Endereço", icon: Signpost },
  { key: "distancia", label: "Distância", short: "Distância", icon: Ruler },
];

function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o tema aplicado pelo script do layout
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("theme", next ? "dark" : "light");
        } catch {}
        setDark(next);
      }}
      aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-fg"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export function BuscaCep() {
  const [tab, setTab] = useState<Tab>("cep");
  const [initialCep, setInitialCep] = useState<string | null>(null);
  const [cepKey, setCepKey] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const cep = onlyDigits(q.get("cep") ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- link compartilhado (?cep=)
    setInitialCep(cep.length === 8 ? cep : "");
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" aria-hidden />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 pt-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-fg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-fg">
            <MapPinned size={19} />
          </span>
          Busca CEP
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative mx-auto max-w-5xl px-5 pb-20 pt-14 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-6xl">
            Qualquer CEP do Brasil, <span className="text-accent">no mapa.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted sm:text-lg">
            Endereço completo, localização, DDD e código IBGE. Também descobre o CEP de uma rua e calcula a distância entre dois CEPs.
          </p>
        </div>

        <div role="tablist" aria-label="Tipo de busca" className="mx-auto mt-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-card p-1">
          {TABS.map(({ key, label, short, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cx(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                tab === key ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              <Icon size={15} />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-4xl" role="tabpanel">
          {initialCep !== null && (
            <div hidden={tab !== "cep"}>
              <CepTab key={cepKey} initialCep={initialCep || undefined} />
            </div>
          )}
          {tab === "endereco" && (
            <EnderecoTab
              onPick={(cep) => {
                setInitialCep(cep);
                setCepKey((k) => k + 1);
                setTab("cep");
              }}
            />
          )}
          {tab === "distancia" && <DistanciaTab />}
        </div>
      </main>

      <footer className="relative border-t border-line py-6 text-center text-xs text-faint">
        Dados do <a className="underline-offset-2 hover:underline" href="https://viacep.com.br" target="_blank" rel="noopener noreferrer">ViaCEP</a>,{" "}
        <a className="underline-offset-2 hover:underline" href="https://brasilapi.com.br" target="_blank" rel="noopener noreferrer">BrasilAPI</a> e{" "}
        <a className="underline-offset-2 hover:underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
        {" · "}
        <a className="underline-offset-2 hover:underline" href="https://github.com/HeitorBMarini/busca-cep" target="_blank" rel="noopener noreferrer">código no GitHub</a>
      </footer>
    </div>
  );
}
