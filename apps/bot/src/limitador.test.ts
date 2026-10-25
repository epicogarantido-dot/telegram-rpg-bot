import { expect, it } from "vitest";
import { Limitador } from "./limitador.ts";

it("bloqueia acima do limite e libera depois de 1 minuto", () => {
  let t = 0;
  const l = new Limitador({ porMinuto: 2 }, () => t);
  expect(l.permitir("a")).toBe(true);
  expect(l.permitir("a")).toBe(true);
  expect(l.permitir("a")).toBe(false);
  expect(l.permitir("b")).toBe(true);
  t = 61_000;
  expect(l.permitir("a")).toBe(true);
});
