"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import type { Endereco } from "@/lib/br";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export async function fetchCep(cep: string): Promise<Endereco> {
  const r = await fetch(`/api/cep/${cep}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Não foi possível buscar o CEP.");
  return j as Endereco;
}

export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* sem permissão de área de transferência */
        }
      }}
      className={cx(
        "inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-sm font-medium text-fg transition hover:border-accent/60 active:scale-[0.98]",
        className,
      )}
    >
      {done ? <Check size={16} className="text-accent" /> : <Copy size={16} className="text-muted" />}
      {done ? "Copiado!" : label}
    </button>
  );
}

/** Mapa do OpenStreetMap embutido, sem biblioteca. */
export function MapView({ lat, lon, zoom = "rua", title }: { lat: number; lon: number; zoom?: "rua" | "cidade"; title: string }) {
  const d = zoom === "rua" ? 0.006 : 0.06;
  const bbox = [lon - d * 1.6, lat - d, lon + d * 1.6, lat + d].join(",");
  return (
    <iframe
      title={title}
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
      className="h-full w-full border-0 dark:[filter:invert(0.92)_hue-rotate(180deg)_saturate(0.7)]"
      loading="lazy"
    />
  );
}

export function Field({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={cx("rounded-2xl border border-line bg-raised/60 px-4 py-3", wide && "col-span-2")}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd className={cx("mt-1 text-[15px] text-fg", mono && "font-mono", !value && "text-faint")}>{value || "Não informado"}</dd>
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="animate-rise rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      {children}
    </p>
  );
}
