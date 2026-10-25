import { BancoProspeccao, STATUS, type Status } from "./banco.ts";
import { buscarEstabelecimentos } from "./google-places.ts";
import { buscarNoOSM } from "./openstreetmap.ts";

const USO = `Uso:
  npm run prospectar -- buscar <nicho> <cidade> [--fonte osm|google] [--paginas N]
      ex.: buscar barbearia Campinas
      osm (padrão, grátis): cidade = nome exato do município; nichos em FILTROS_OSM
      google (precisa de GOOGLE_MAPS_API_KEY e conta com cartão): cidade livre, ex. "Campinas SP"
  npm run prospectar -- listar [status]
  npm run prospectar -- marcar <place_id> <${STATUS.join("|")}>
  npm run prospectar -- resumo`;

async function main() {
  const [comando, ...args] = process.argv.slice(2);
  const banco = new BancoProspeccao();

  switch (comando) {
    case "buscar": {
      // Posicionais = tudo que não é "--flag" nem o valor logo depois dela.
      const [nicho, cidade] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
      if (!nicho || !cidade) return sair(USO);
      const fi = args.indexOf("--fonte");
      const fonte = fi >= 0 ? args[fi + 1] : "osm";
      let achados;
      if (fonte === "google") {
        const chave = process.env.GOOGLE_MAPS_API_KEY;
        if (!chave) return sair("Defina GOOGLE_MAPS_API_KEY (Places API (New) ativada no Google Cloud).");
        const i = args.indexOf("--paginas");
        const maxPaginas = i >= 0 ? Number(args[i + 1]) : 3;
        achados = await buscarEstabelecimentos(`${nicho} em ${cidade}`, { chave, maxPaginas });
      } else {
        achados = await buscarNoOSM(nicho, cidade);
      }
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
