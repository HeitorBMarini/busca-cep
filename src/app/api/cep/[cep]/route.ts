import { onlyDigits } from "@/lib/br";
import { buscarCep, CepError } from "@/lib/cep-server";

export async function GET(_req: Request, ctx: RouteContext<"/api/cep/[cep]">) {
  const cep = onlyDigits((await ctx.params).cep);
  if (cep.length !== 8) return Response.json({ error: "O CEP precisa ter 8 dígitos." }, { status: 400 });
  try {
    return Response.json(await buscarCep(cep), { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (e) {
    const status = e instanceof CepError ? e.status : 500;
    return Response.json({ error: e instanceof Error ? e.message : "Erro inesperado." }, { status });
  }
}
