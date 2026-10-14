import "server-only";

import { cacheLife } from "next/cache";

import { UFS, type Endereco } from "./br";

const UA = "busca-cep/2.0 (+https://github.com/HeitorBMarini/busca-cep)";

export class CepError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function getJson(url: string, timeoutMs = 6000) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(timeoutMs) });
  return { ok: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

type Base = Omit<Endereco, "coords">;

async function viaCep(cep: string): Promise<Base | null> {
  const { ok, data } = await getJson(`https://viacep.com.br/ws/${cep}/json/`);
  if (!ok) throw new Error("ViaCEP indisponível");
  if (data?.erro) return null;
  const uf = data.uf as string;
  return {
    cep,
    logradouro: data.logradouro ?? "",
    complemento: data.complemento ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade ?? "",
    uf,
    estado: data.estado || UFS[uf]?.nome || uf,
    regiao: data.regiao || UFS[uf]?.regiao || "",
    ibge: data.ibge ?? "",
    ddd: data.ddd ?? "",
    fonte: "ViaCEP",
  };
}

async function brasilApi(cep: string): Promise<(Base & { lat?: number; lon?: number }) | null> {
  const { ok, status, data } = await getJson(`https://brasilapi.com.br/api/cep/v2/${cep}`);
  if (status === 404) return null;
  if (!ok) throw new Error("BrasilAPI indisponível");
  const uf = data.state as string;
  const c = data.location?.coordinates;
  return {
    cep,
    logradouro: data.street ?? "",
    complemento: "",
    bairro: data.neighborhood ?? "",
    cidade: data.city ?? "",
    uf,
    estado: UFS[uf]?.nome ?? uf,
    regiao: UFS[uf]?.regiao ?? "",
    ibge: "",
    ddd: "",
    fonte: "BrasilAPI",
    lat: c?.latitude ? Number(c.latitude) : undefined,
    lon: c?.longitude ? Number(c.longitude) : undefined,
  };
}

/** Localização aproximada no OpenStreetMap (Nominatim): tenta a rua, depois a cidade. */
async function geocode(e: Base): Promise<Endereco["coords"]> {
  "use cache";
  cacheLife("max");
  const tries: [Record<string, string>, "rua" | "cidade"][] = [];
  if (e.logradouro) tries.push([{ street: e.logradouro, city: e.cidade, state: e.estado }, "rua"]);
  tries.push([{ city: e.cidade, state: e.estado }, "cidade"]);
  for (const [q, precisao] of tries) {
    try {
      const params = new URLSearchParams({ ...q, country: "Brasil", format: "jsonv2", limit: "1" });
      const { ok, data } = await getJson(`https://nominatim.openstreetmap.org/search?${params}`, 5000);
      if (ok && data?.[0]) return { lat: Number(data[0].lat), lon: Number(data[0].lon), precisao };
    } catch {
      // segue para a próxima tentativa
    }
  }
  return null;
}

/** CEP -> endereço (ou null se não existe), com ViaCEP e BrasilAPI de reserva. Cacheado por dias. */
async function buscarCepCacheado(cep: string): Promise<Endereco | null> {
  "use cache";
  cacheLife("days");

  let base: (Base & { lat?: number; lon?: number }) | null = null;
  let falhas = 0;
  for (const provider of [viaCep, brasilApi]) {
    try {
      base = await provider(cep);
      if (base) break;
    } catch {
      falhas++;
    }
  }
  // os dois fora do ar: lança (erro não entra no cache) para tentar de novo na próxima requisição
  if (!base && falhas === 2) throw new Error("indisponível");
  if (!base) return null;

  const { lat, lon, ...rest } = base;
  const coords = lat && lon ? { lat, lon, precisao: "rua" as const } : await geocode(rest);
  return { ...rest, coords };
}

export async function buscarCep(cep: string): Promise<Endereco> {
  let r: Endereco | null;
  try {
    r = await buscarCepCacheado(cep);
  } catch {
    throw new CepError(503, "Os serviços de CEP estão fora do ar agora. Tente de novo em instantes.");
  }
  if (!r) throw new CepError(404, "CEP não encontrado.");
  return r;
}

export type ResultadoEndereco = Pick<Endereco, "cep" | "logradouro" | "complemento" | "bairro" | "cidade" | "uf">;

async function buscarPorEnderecoCacheado(uf: string, cidade: string, rua: string): Promise<ResultadoEndereco[]> {
  "use cache";
  cacheLife("days");
  const url = `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(cidade)}/${encodeURIComponent(rua)}/json/`;
  const { ok, data } = await getJson(url);
  if (!ok) throw new Error("indisponível");
  if (!Array.isArray(data)) return [];
  return data.map((d: Record<string, string>) => ({
    cep: d.cep.replace(/\D/g, ""),
    logradouro: d.logradouro,
    complemento: d.complemento,
    bairro: d.bairro,
    cidade: d.localidade,
    uf: d.uf,
  }));
}

/** Endereço -> CEPs (o ViaCEP exige UF, cidade e pelo menos 3 letras da rua). */
export async function buscarPorEndereco(uf: string, cidade: string, rua: string) {
  try {
    return await buscarPorEnderecoCacheado(uf, cidade, rua);
  } catch {
    throw new CepError(503, "Não foi possível consultar o ViaCEP agora.");
  }
}
