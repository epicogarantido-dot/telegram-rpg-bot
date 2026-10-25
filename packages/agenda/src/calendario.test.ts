import { describe, expect, it } from "vitest";
import { gerarCalendario, gerarIcs, linkGoogleAgenda, paraUtc } from "./calendario.ts";

const evento = {
  uid: "ag-42@box-7",
  titulo: "Corte na Box 7",
  descricao: "Corte com Rafael, 30 min.\nPrecisa remarcar? WhatsApp: https://wa.me/5519900000000",
  local: "Rua Exemplo, 123; Centro, Campinas",
  inicio: "2026-10-27T14:30",
  duracaoMin: 30,
  fuso: "America/Sao_Paulo",
  lembreteMin: 60,
};

describe("adicionar à agenda", () => {
  it("converte o horário local pra UTC (São Paulo = UTC−3)", () => {
    expect(paraUtc("2026-10-27T14:30", "America/Sao_Paulo").toISOString()).toBe("2026-10-27T17:30:00.000Z");
    expect(paraUtc("2026-10-27T23:30", "America/Manaus").toISOString()).toBe("2026-10-28T03:30:00.000Z");
  });

  it("gera .ics válido com lembrete 1 h antes e texto escapado", () => {
    const ics = gerarIcs(evento, new Date("2026-10-25T12:00:00Z"));
    expect(ics).toContain("DTSTART:20261027T173000Z\r\n");
    expect(ics).toContain("DTEND:20261027T180000Z\r\n");
    expect(ics).toContain("TRIGGER:-PT60M");
    expect(ics).toContain("LOCATION:Rua Exemplo\\, 123\\; Centro\\, Campinas");
    expect(ics).toContain("\\nPrecisa remarcar?");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    // Nenhuma linha passa de 75 bytes.
    for (const linha of ics.split("\r\n")) expect(Buffer.byteLength(linha)).toBeLessThanOrEqual(75);
  });

  it("link do Google Agenda com início e fim", () => {
    const url = new URL(linkGoogleAgenda(evento));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261027T173000Z/20261027T180000Z");
    expect(url.searchParams.get("text")).toBe("Corte na Box 7");
  });
});

describe("calendário assinável do barbeiro", () => {
  it("junta vários horários, com nome e pedido de atualização", () => {
    const ics = gerarCalendario("Agenda · Box 7", [evento, { ...evento, uid: "ag-43@box-7", inicio: "2026-10-27T15:00" }], new Date("2026-10-25T12:00:00Z"));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("X-WR-CALNAME:Agenda · Box 7");
    expect(ics).toContain("REFRESH-INTERVAL;VALUE=DURATION:PT15M");
    expect(ics).toContain("DTSTART:20261027T180000Z");
  });

  it("calendário vazio continua válido (o app apaga o que sumiu)", () => {
    const ics = gerarCalendario("Vazia", []);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});
