import { buscarNaReceita } from "@aprenda/prospeccao";
import { obterBanco } from "@/lib/painel";

/**
 * Busca na base da Receita rodando dentro do próprio site, em segundo plano: leva
 * alguns minutos (passa por ~7 GB lidos em fluxo, quase sem memória). Uma por vez.
 */
export interface EstadoBusca {
  rodando: boolean;
  cidade?: string;
  uf?: string;
  etapa?: string;
  inicio?: string;
  resultado?: string;
  erro?: string;
}

const estado: EstadoBusca = { rodando: false };

export function estadoDaBusca(): EstadoBusca {
  return { ...estado };
}

export function iniciarBusca(nicho: string, cidade: string, uf: string): boolean {
  if (estado.rodando) return false;
  Object.assign(estado, { rodando: true, cidade, uf, etapa: "Começando…", inicio: new Date().toISOString(), resultado: undefined, erro: undefined });
  void (async () => {
    try {
      const resultados = await buscarNaReceita(nicho, cidade, uf, { aoAvancar: (m) => { estado.etapa = m; } });
      const r = resultados.get(cidade)!;
      const { novos, total } = obterBanco().salvarDaReceita(r, nicho, cidade);
      const celular = r.achados.filter((a) => a.celular && !a.telefoneDeContador).length;
      const confirmados = r.achados.filter((a) => a.nomeConfirma).length;
      estado.resultado = `Receita ${r.mes}: ${r.totalNaCidade} empresas ativas em ${cidade}/${uf}; ${total} na atividade de cabeleireiro/barbeiro, ${confirmados} com "barb" no nome, ${celular} com celular próprio. ${novos} novos leads.`;
    } catch (e) {
      estado.erro = e instanceof Error ? e.message : String(e);
    } finally {
      estado.rodando = false;
      estado.etapa = undefined;
    }
  })();
  return true;
}
