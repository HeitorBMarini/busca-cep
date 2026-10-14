import { UFS } from "@/lib/br";
import { buscarPorEndereco, CepError } from "@/lib/cep-server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const uf = (q.get("uf") ?? "").toUpperCase();
  const cidade = (q.get("cidade") ?? "").trim();
  const rua = (q.get("rua") ?? "").trim();
  if (!UFS[uf]) return Response.json({ error: "Escolha um estado." }, { status: 400 });
  if (cidade.length < 3 || rua.length < 3) return Response.json({ error: "Cidade e rua precisam ter pelo menos 3 letras." }, { status: 400 });
  try {
    return Response.json(await buscarPorEndereco(uf, cidade, rua), { headers: { "Cache-Control": "public, s-maxage=86400" } });
  } catch (e) {
    const status = e instanceof CepError ? e.status : 500;
    return Response.json({ error: e instanceof Error ? e.message : "Erro inesperado." }, { status });
  }
}
