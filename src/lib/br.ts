// Dados e utilitários compartilhados entre servidor e cliente.

export type Endereco = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  ddd: string;
  fonte: "ViaCEP" | "BrasilAPI";
  coords: { lat: number; lon: number; precisao: "rua" | "cidade" } | null;
};

export const UFS: Record<string, { nome: string; regiao: string }> = {
  AC: { nome: "Acre", regiao: "Norte" },
  AL: { nome: "Alagoas", regiao: "Nordeste" },
  AP: { nome: "Amapá", regiao: "Norte" },
  AM: { nome: "Amazonas", regiao: "Norte" },
  BA: { nome: "Bahia", regiao: "Nordeste" },
  CE: { nome: "Ceará", regiao: "Nordeste" },
  DF: { nome: "Distrito Federal", regiao: "Centro-Oeste" },
  ES: { nome: "Espírito Santo", regiao: "Sudeste" },
  GO: { nome: "Goiás", regiao: "Centro-Oeste" },
  MA: { nome: "Maranhão", regiao: "Nordeste" },
  MT: { nome: "Mato Grosso", regiao: "Centro-Oeste" },
  MS: { nome: "Mato Grosso do Sul", regiao: "Centro-Oeste" },
  MG: { nome: "Minas Gerais", regiao: "Sudeste" },
  PA: { nome: "Pará", regiao: "Norte" },
  PB: { nome: "Paraíba", regiao: "Nordeste" },
  PR: { nome: "Paraná", regiao: "Sul" },
  PE: { nome: "Pernambuco", regiao: "Nordeste" },
  PI: { nome: "Piauí", regiao: "Nordeste" },
  RJ: { nome: "Rio de Janeiro", regiao: "Sudeste" },
  RN: { nome: "Rio Grande do Norte", regiao: "Nordeste" },
  RS: { nome: "Rio Grande do Sul", regiao: "Sul" },
  RO: { nome: "Rondônia", regiao: "Norte" },
  RR: { nome: "Roraima", regiao: "Norte" },
  SC: { nome: "Santa Catarina", regiao: "Sul" },
  SP: { nome: "São Paulo", regiao: "Sudeste" },
  SE: { nome: "Sergipe", regiao: "Nordeste" },
  TO: { nome: "Tocantins", regiao: "Norte" },
};

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const maskCep = (s: string) => {
  const d = onlyDigits(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export const formatCep = (cep: string) => maskCep(cep);

/** Endereço numa linha, pronto para colar. */
export function enderecoEmLinha(e: Endereco) {
  const rua = [e.logradouro, e.complemento].filter(Boolean).join(", ");
  return [rua, e.bairro, `${e.cidade}/${e.uf}`, `CEP ${formatCep(e.cep)}`].filter(Boolean).join(" - ");
}

/** Distância em linha reta (fórmula de haversine), em km. */
export function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
