import { Check } from "lucide-react";
import { reais } from "@/lib/agenda";
import { marcarSinalRecebido } from "@/app/(barbearias)/app/acoes-whatsapp";

/**
 * Sinal de um horário no painel: aguardando (com "Recebi o sinal", depois de conferir no banco)
 * ou recebido (dá pra desfazer). Horário sem sinal não mostra nada.
 */
export function SinalDoHorario({ a, voltar }: { a: { id: number; sinalCentavos?: number; sinalPagoEm?: string }; voltar: string }) {
  if (!a.sinalCentavos) return null;
  return (
    <form action={marcarSinalRecebido} className={`sinal ${a.sinalPagoEm ? "pago" : ""}`}>
      <input type="hidden" name="id" value={a.id} />
      <input type="hidden" name="voltar" value={voltar} />
      <input type="hidden" name="pago" value={a.sinalPagoEm ? "0" : "1"} />
      {a.sinalPagoEm
        ? <><span><Check size={14} aria-hidden /> Sinal de {reais(a.sinalCentavos)} recebido</span><button className="sinal-desfazer">desfazer</button></>
        : <><span>Sinal de {reais(a.sinalCentavos)}: aguardando</span><button className="botao-sec">Recebi o sinal</button></>}
    </form>
  );
}
