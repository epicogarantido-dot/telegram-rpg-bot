import { BancoProspeccao, STATUS, type Status } from "./banco.ts";
import { buscarEstabelecimentos } from "./google-places.ts";

const USO = `Uso:
  npm run prospectar -- buscar <nicho> <cidade> [--paginas N]   ex.: buscar barbearia "Campinas SP"
  npm run prospectar -- listar [status]
  npm run prospectar -- marcar <place_id> <${STATUS.join("|")}>
  npm run prospectar -- resumo`;

async function main() {
  const [comando, ...args] = process.argv.slice(2);
  const banco = new BancoProspeccao();

  switch (comando) {
    case "buscar": {
      const [nicho, cidade] = args.filter((a) => !a.startsWith("--"));
      if (!nicho || !cidade) return sair(USO);
      const chave = process.env.GOOGLE_MAPS_API_KEY;
      if (!chave) return sair("Defina GOOGLE_MAPS_API_KEY (Places API (New) ativada no Google Cloud).");
      const i = args.indexOf("--paginas");
      const maxPaginas = i >= 0 ? Number(args[i + 1]) : 3;
      const achados = await buscarEstabelecimentos(`${nicho} em ${cidade}`, { chave, maxPaginas });
      const novos = banco.salvarEstabelecimentos(achados, nicho, cidade);
      const comTel = achados.filter((a) => a.telefone).length;
      console.log(`🔎 ${achados.length} encontrados (${comTel} com telefone), ${novos} novos no banco.`);
      return;
    }
    case "listar": {
      const status = args[0] as Status | undefined;
      for (const l of banco.listar({ status })) {
        console.log(`[${l.status}] ${l.nome} · ${l.telefone ?? "sem tel"} · ⭐${l.nota ?? "-"} (${l.avaliacoes ?? 0}) · ${l.placeId}`);
      }
      return;
    }
    case "marcar": {
      const [id, status] = args;
      if (!id || !STATUS.includes(status as Status)) return sair(USO);
      banco.marcar(id, status as Status);
      console.log("✅ atualizado");
      return;
    }
    case "resumo":
      console.table(banco.resumo());
      console.log(`Contatados hoje: ${banco.contatadosHoje()}`);
      return;
    default:
      sair(USO);
  }
}

function sair(msg: string): never {
  console.error(msg);
  process.exit(1);
}

main().catch((e) => sair(String(e)));
