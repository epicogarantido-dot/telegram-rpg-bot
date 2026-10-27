import { cookies } from "next/headers";
import { ErroAgenda, type Barbearia } from "@aprenda/agenda";
import { obterAgenda } from "./agenda";
import { criarSitesDeExemplo, sitesDeExemplo } from "./exemplos";

/**
 * Prévia montada pelo próprio barbeiro em /montar: uma demonstração com o nome dele, no estilo
 * que escolheu, com as fotos do site de exemplo daquele estilo (o arquivo é dividido, não
 * copiado: `copiarFotos`). Sem dono, sem marcação, fora do Google. O convite fica num cookie
 * deste aparelho; é ele que mostra "Quero este site" e deixa trocar o estilo.
 */
export const COOKIE_PREVIA = "previa_convite";
export const PREVIA_DIAS = 7;
/** Prévias por aparelho por dia: dá pra testar à vontade sem encher o banco. */
const MAX_PREVIAS_DIA = 10;

export async function criarPrevia(dados: { nome: string; cidade?: string; tema: string; aparelho: string }): Promise<Barbearia> {
  const banco = obterAgenda();
  const chave = `previa:ip:${dados.aparelho}`;
  if (banco.contarTentativas(chave, 24 * 60) >= MAX_PREVIAS_DIA) {
    throw new ErroAgenda("Muitas prévias montadas deste aparelho hoje. Abra a última que você fez ou tente amanhã.");
  }
  let exemplos = sitesDeExemplo();
  if (!exemplos[dados.tema]) {
    await criarSitesDeExemplo();
    exemplos = sitesDeExemplo();
  }
  const { barbearia, convite } = banco.criarDemonstracao({ nome: dados.nome.slice(0, 60), tema: dados.tema, cidade: dados.cidade?.slice(0, 60), dias: PREVIA_DIAS });
  const exemplo = exemplos[dados.tema] ? banco.barbeariaPorSlug(exemplos[dados.tema]!) : undefined;
  if (exemplo) banco.copiarFotos(exemplo.id, barbearia.id);
  banco.consumirLimite(chave, Number.MAX_SAFE_INTEGER, 24 * 60, "");
  (await cookies()).set(COOKIE_PREVIA, convite, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: PREVIA_DIAS * 86_400,
    path: "/",
  });
  return barbearia;
}

/** A prévia deste aparelho, se for a barbearia `id` (e ainda estiver no ar, sem dono). */
export async function conviteDaPrevia(id: number): Promise<string | undefined> {
  const convite = (await cookies()).get(COOKIE_PREVIA)?.value;
  return obterAgenda().demonstracaoPorConvite(convite)?.id === id ? convite : undefined;
}
