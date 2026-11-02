import Link from "next/link";
import { exigirAcessoAtivo } from "@/lib/agenda";
import { chavesAviso } from "@/lib/avisos";
import { soEntrega } from "@/lib/modo";
import { InstalarApp } from "@/componentes/InstalarApp";
import { AvisosCelular } from "@/componentes/barbearia/AvisosCelular";
import { removerAviso, salvarAviso, testarAviso } from "../acoes-avisos";

export const metadata = { title: "Avisos no celular", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * O painel é um app: instala na tela do celular e recebe um aviso a cada horário marcado.
 * Tocar no aviso abre o horário com o "Confirmar no WhatsApp". (Substituiu o calendário .ics.)
 */
export default async function Avisos() {
  const { barbearia, usuario } = await exigirAcessoAtivo();
  return (
    <>
      <p><Link href="/app">← Voltar pra agenda</Link></p>
      <h1>Avisos no celular</h1>
      <p className="suave">
        Cada horário marcado pelo site chega como aviso no seu celular{usuario.profissionalId ? " (só os seus)" : ""}. Tocou no aviso,
        abre o horário com o botão de confirmar com o cliente no WhatsApp, com a mensagem pronta.
      </p>
      <ol className="passos-avisos">
        <li><strong>Instale o app</strong> na tela do celular (no iPhone, os avisos só funcionam com ele instalado).</li>
        <li><strong>Ligue os avisos</strong> e toque em &quot;Testar&quot; pra ver chegando.</li>
      </ol>
      {soEntrega() && <InstalarApp tipo="painel" nome={barbearia.nome} />}
      <AvisosCelular chavePublica={chavesAviso().publica} salvar={salvarAviso} remover={removerAviso} testar={testarAviso} />
    </>
  );
}
