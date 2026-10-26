import { BancoProspeccao, STATUS, type Status } from "./banco.ts";
import { buscarEstabelecimentos } from "./google-places.ts";
import { buscarNoOSM } from "./openstreetmap.ts";
import { buscarNaReceita, buscarNoBrasil, nomeDeExibicao } from "./receita.ts";
import { exportarCsv } from "./exportar.ts";

const USO = `Uso:
  npm run prospectar -- buscar <nicho> <cidade> [--fonte osm|google] [--paginas N]
      ex.: buscar barbearia Campinas
      osm (padrão, grátis): cidade = nome exato do município; nichos em FILTROS_OSM
      google (precisa de GOOGLE_MAPS_API_KEY e conta com cartão): cidade livre, ex. "Campinas SP"
  npm run prospectar -- receita <nicho> <cidade[,cidade2,...]> <UF>
      ex.: receita barbearia Alegrete RS   (dados abertos do CNPJ, grátis; ~15-20 min por passada)
  npm run prospectar -- receita-brasil <nicho>
      todas as do Brasil numa passada (~20-40 min); depois: exportar
  npm run prospectar -- exportar <arquivo.csv> [--uf RS] [--nicho barbearia|salao|manicure|beleza_indefinido]
  npm run prospectar -- reclassificar   (separa barbearia, salão e manicure em bases antigas)
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
    case "receita": {
      // Várias cidades da mesma UF numa passada só: receita barbearia "Alegrete,Uruguaiana" RS
      const [nicho, cidades, uf] = args;
      if (!nicho || !cidades || !uf) return sair(USO);
      const inicio = Date.now();
      const resultados = await buscarNaReceita(nicho, cidades.split(",").map((c) => c.trim()).filter(Boolean), uf,
        { aoAvancar: (m) => console.log(`⏳ ${m} (${Math.round((Date.now() - inicio) / 1000)} s)`) });
      for (const [cidade, r] of resultados) {
        const { novos, total } = banco.salvarDaReceita(r, nicho, cidade);
        const celular = r.achados.filter((a) => a.celular && !a.telefoneDeContador).length;
        const confirmados = r.achados.filter((a) => a.nomeConfirma).length;
        console.log(`\n📋 Receita ${r.mes}: ${r.totalNaCidade} empresas ativas em ${cidade}/${uf}.`);
        console.log(`✂️  ${total} na atividade de cabeleireiro/barbeiro, ${confirmados} com "barb" no nome, ${celular} com celular próprio. ${novos} novos no banco.`);
        for (const a of r.achados.filter((x) => x.nomeConfirma)) console.log(`  • ${nomeDeExibicao(a)} · ${a.telefone ?? "sem tel"}${a.telefone && !a.celular ? " (fixo)" : ""}${a.telefoneDeContador ? " (contador?)" : ""}`);
      }
      console.log(`⏱️  ${Math.round((Date.now() - inicio) / 1000)} s`);
      return;
    }
    case "receita-brasil": {
      const [nicho] = args;
      if (!nicho) return sair(USO);
      const inicio = Date.now();
      let novos = 0;
      let salvos = 0;
      const r = await buscarNoBrasil(nicho, (lote) => {
        const s = banco.salvarAchados(lote, nicho);
        novos += s.novos;
        salvos += s.total;
      }, { aoAvancar: (m) => console.log(`⏳ ${m} (${Math.round((Date.now() - inicio) / 1000)} s)`) });
      console.log(`\n📋 Receita ${r.mes}: ${r.total} empresas ativas na atividade do nicho no Brasil; ${salvos} salvas, ${novos} novas.`);
      console.log(`⏱️  ${Math.round((Date.now() - inicio) / 1000)} s`);
      return;
    }
    case "exportar": {
      const [arquivo] = args;
      if (!arquivo) return sair(USO);
      const i = args.indexOf("--uf");
      const j = args.indexOf("--nicho");
      const n = exportarCsv(banco, arquivo, { uf: i >= 0 ? args[i + 1] : undefined, nicho: j >= 0 ? args[j + 1] : undefined });
      console.log(`💾 ${n} leads em ${arquivo}`);
      return;
    }
    case "reclassificar": {
      console.table(banco.reclassificarBeleza());
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
