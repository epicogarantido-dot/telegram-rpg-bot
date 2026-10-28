import { agoraNoFuso, formatarData, type Barbearia } from "@aprenda/agenda";
import { obterAgenda } from "./agenda";

/** Com quantos dias (contando hoje) o painel começa a avisar que o período pago está acabando. */
export const AVISAR_COM_DIAS = 5;

export interface Prazo {
  situacao: "em dia" | "acabando" | "acabou";
  /** Dias pagos que faltam, contando hoje (0 = acabou). */
  dias: number;
  /** Dias desde que acabou (0 se não acabou). */
  atraso: number;
  frase: string;
}

/**
 * Como está o período pago de uma conta. No SaaS vira a faixa do painel (só avisa, não bloqueia);
 * no site de leads, a situação da assinatura na lista do admin.
 */
export function prazoDaConta(b: Barbearia, agora?: Date): Prazo {
  const dias = obterAgenda().diasRestantes(b, agora);
  const data = formatarData(b.acessoAte);
  if (dias === 0) {
    const hoje = agoraNoFuso(b.fuso, agora).slice(0, 10);
    const atraso = Math.round((Date.parse(hoje) - Date.parse(b.acessoAte)) / 86_400_000);
    return { situacao: "acabou", dias, atraso, frase: `Seus dias pagos acabaram em ${data}.` };
  }
  if (dias <= AVISAR_COM_DIAS) {
    return {
      situacao: "acabando", dias, atraso: 0,
      frase: dias === 1 ? `Seu período pago acaba hoje (${data}).` : `Seu período pago está acabando: faltam ${dias} dias (vai até ${data}).`,
    };
  }
  return { situacao: "em dia", dias, atraso: 0, frase: `Período pago até ${data}: faltam ${dias} dias.` };
}
