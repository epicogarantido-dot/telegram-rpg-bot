import { createHash, timingSafeEqual } from "node:crypto";

/**
 * O mesmo código sobe como um app só (padrão) ou como dois apps na Square:
 * - MODO_SITE=leads: cursos, Revista, /barbeiros e o painel de leads. Precisa de SAAS_URL.
 * - MODO_SITE=saas: /montar, sites das barbearias, agenda, painel do barbeiro e pagamentos.
 *   LEADS_URL (opcional) é pra onde vão os links de cursos e Revista.
 * Sem a URL do outro lado, o app volta a ter tudo junto: nada fica fora do ar por falta de config.
 * As rotas de cada lado ficam no proxy.ts, que manda quem pede uma página do outro lado pro app
 * certo; por isso os links entre os dois são relativos e com <a> (nada de <Link> com prefetch).
 */
export type Modo = "ambos" | "leads" | "saas";

const limpar = (url: string | undefined) => (url ?? "").trim().replace(/\/$/, "");

export function urlSaas(): string {
  return limpar(process.env.SAAS_URL);
}

export function urlLeads(): string {
  return limpar(process.env.LEADS_URL);
}

export function modoSite(): Modo {
  const modo = process.env.MODO_SITE;
  if (modo === "leads" && urlSaas()) return "leads";
  if (modo === "saas") return "saas";
  return "ambos";
}

/** Chave pra conversa servidor a servidor entre os dois apps: deriva da PAINEL_SENHA, a mesma nos dois. */
export function chaveEntreApps(): string | undefined {
  const senha = process.env.PAINEL_SENHA;
  return senha ? createHash("sha256").update(`entre-apps:${senha}`).digest("hex") : undefined;
}

export function chaveConfere(recebida: string | null): boolean {
  const chave = chaveEntreApps();
  if (!chave || !recebida) return false;
  const a = Buffer.from(chave);
  const b = Buffer.from(recebida);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Conta um cadastro por origem. Com os apps separados, a contagem fica no site de leads (onde está
 * a tela de Divulgação), então o SaaS avisa por lá; sem LEADS_URL, conta aqui mesmo.
 */
export async function contarCadastro(origem: string, registrarAqui: (origem: string) => void): Promise<void> {
  if (modoSite() === "saas" && urlLeads()) {
    await fetch(`${urlLeads()}/api/origem`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-chave": chaveEntreApps() ?? "" },
      body: JSON.stringify({ origem, tipo: "cadastro" }),
      signal: AbortSignal.timeout(5_000),
    }).catch(() => {});
    return;
  }
  registrarAqui(origem);
}
