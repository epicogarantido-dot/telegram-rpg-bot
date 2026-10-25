"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Efeitos que precisam de JavaScript nos sites das barbearias. Cada tema
 * liga só os seus (plano em docs/estilos/plano.md). Tudo:
 * - fica desligado com "reduzir movimento" (exceto navegação da galeria);
 * - pausa quando sai da tela ou a aba fica escondida;
 * - é só enfeite: a página já está completa sem ele.
 */
export function Efeitos({ tema }: { tema: string }) {
  const caminho = usePathname();

  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>(".site-b");
    if (!raiz) return;
    const limpar: (() => void)[] = [];
    const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Navegação da galeria de uma foto por vez (Cerimônia). É controle, não enfeite: vale sempre.
    if (tema === "cerimonia") limpar.push(galeriaComSetas(raiz, semMovimento));

    if (!semMovimento) {
      if (tema === "potencia") {
        limpar.push(faixaQueAcelera(raiz));
        limpar.push(faiscas(raiz, "#d7ff1e"));
        if (matchMedia("(pointer: fine)").matches) limpar.push(ima(raiz));
      }
      if (tema === "extravagancia" && aparelhoAguenta()) limpar.push(particulasDouradas(raiz));
      if (tema === "tecnico") limpar.push(contadores(raiz));
    }
    return () => limpar.forEach((f) => f());
  }, [tema, caminho]);

  return null;
}

function aparelhoAguenta(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((nav.deviceMemory ?? 8) < 4) return false;
  return (nav.hardwareConcurrency ?? 8) >= 4;
}

/** Roda `passo(dt)` a cada quadro só enquanto `alvo` estiver visível e a aba aberta. */
function laco(alvo: Element, passo: (dt: number) => void): () => void {
  let visivel = false;
  let quadro = 0;
  let anterior = performance.now();
  const vigia = new IntersectionObserver(([e]) => { visivel = !!e?.isIntersecting; });
  vigia.observe(alvo);
  const girar = (agora: number) => {
    const dt = Math.min((agora - anterior) / 1000, 0.05);
    anterior = agora;
    if (visivel && !document.hidden) passo(dt);
    quadro = requestAnimationFrame(girar);
  };
  quadro = requestAnimationFrame(girar);
  return () => { cancelAnimationFrame(quadro); vigia.disconnect(); };
}

/* ---------- Potência ---------- */

/** Faixa de texto infinita que acelera quando a pessoa rola a página. */
function faixaQueAcelera(raiz: HTMLElement): () => void {
  const trilho = raiz.querySelector<HTMLElement>(".b-faixa > div");
  if (!trilho) return () => {};
  trilho.classList.add("b-faixa-js");
  let x = 0;
  let impulso = 0;
  let ultimoY = scrollY;
  const aoRolar = () => {
    impulso = Math.min(impulso + Math.abs(scrollY - ultimoY) * 4, 1400);
    ultimoY = scrollY;
  };
  addEventListener("scroll", aoRolar, { passive: true });
  const parar = laco(trilho, (dt) => {
    const terco = trilho.scrollWidth / 3;
    x -= (60 + impulso) * dt;
    if (-x >= terco) x += terco;
    impulso *= 0.92;
    trilho.style.transform = `translate3d(${x}px, 0, 0)`;
  });
  return () => { parar(); removeEventListener("scroll", aoRolar); trilho.classList.remove("b-faixa-js"); trilho.style.transform = ""; };
}

/** Faíscas saindo do ponto tocado nos botões de agendar. */
function faiscas(raiz: HTMLElement, cor: string): () => void {
  const aoTocar = (e: PointerEvent) => {
    const botao = (e.target as Element).closest(".b-botao");
    if (!botao) return;
    for (let i = 0; i < 10; i++) {
      const f = document.createElement("span");
      f.className = "b-faisca";
      const angulo = (i / 10) * Math.PI * 2;
      f.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${Math.cos(angulo) * 34}px;--dy:${Math.sin(angulo) * 34}px;--rot:${(angulo * 180) / Math.PI}deg;background:${cor}`;
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 450);
    }
  };
  raiz.addEventListener("pointerdown", aoTocar);
  return () => raiz.removeEventListener("pointerdown", aoTocar);
}

/** Botões que puxam levemente na direção do mouse (só com mouse; no toque não faz sentido). */
function ima(raiz: HTMLElement): () => void {
  const botoes = [...raiz.querySelectorAll<HTMLElement>(".b-heroi .b-botao, .b-secao .b-botao")];
  const aoMover = (e: PointerEvent) => {
    const b = e.currentTarget as HTMLElement;
    const r = b.getBoundingClientRect();
    b.style.setProperty("--ima-x", `${((e.clientX - r.left) / r.width - 0.5) * 12}px`);
    b.style.setProperty("--ima-y", `${((e.clientY - r.top) / r.height - 0.5) * 10}px`);
  };
  const aoSair = (e: PointerEvent) => {
    const b = e.currentTarget as HTMLElement;
    b.style.setProperty("--ima-x", "0px");
    b.style.setProperty("--ima-y", "0px");
  };
  botoes.forEach((b) => { b.classList.add("b-ima"); b.addEventListener("pointermove", aoMover); b.addEventListener("pointerleave", aoSair); });
  return () => botoes.forEach((b) => { b.classList.remove("b-ima"); b.removeEventListener("pointermove", aoMover); b.removeEventListener("pointerleave", aoSair); });
}

/* ---------- Extravagância ---------- */

/** Partículas douradas subindo devagar no fundo da abertura. */
function particulasDouradas(raiz: HTMLElement): () => void {
  const heroi = raiz.querySelector<HTMLElement>(".b-heroi");
  if (!heroi) return () => {};
  const canvas = document.createElement("canvas");
  canvas.className = "b-particulas";
  canvas.setAttribute("aria-hidden", "true");
  heroi.insertBefore(canvas, heroi.querySelector(".b-heroi-texto"));
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => canvas.remove();
  const dpr = Math.min(devicePixelRatio, 1.5);
  let w = 0;
  let h = 0;
  const ajustar = () => {
    w = heroi.clientWidth;
    h = heroi.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  ajustar();
  const obs = new ResizeObserver(ajustar);
  obs.observe(heroi);
  const total = w < 600 ? 28 : 54;
  const ps = Array.from({ length: total }, () => ({
    x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8,
    v: 8 + Math.random() * 22, fase: Math.random() * Math.PI * 2, brilho: 0.25 + Math.random() * 0.55,
  }));
  let t = 0;
  const parar = laco(heroi, (dt) => {
    t += dt;
    ctx.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.y -= p.v * dt;
      p.x += Math.sin(t * 0.8 + p.fase) * 6 * dt;
      if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
      const a = p.brilho * (0.6 + 0.4 * Math.sin(t * 2 + p.fase));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `rgba(255, 236, 170, ${a})`);
      g.addColorStop(0.4, `rgba(232, 199, 102, ${a * 0.6})`);
      g.addColorStop(1, "rgba(201, 165, 75, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  return () => { parar(); obs.disconnect(); canvas.remove(); };
}

/* ---------- Luxo Técnico ---------- */

/** Números que sobem do zero quando aparecem na tela. O valor final já vem no HTML. */
function contadores(raiz: HTMLElement): () => void {
  const els = [...raiz.querySelectorAll<HTMLElement>("[data-contar]")];
  const vigia = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      vigia.unobserve(e.target);
      const el = e.target as HTMLElement;
      const alvo = Number(el.dataset.contar);
      const inicio = performance.now();
      const passo = (agora: number) => {
        const p = Math.min((agora - inicio) / 1400, 1);
        el.textContent = String(Math.round(alvo * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }
  }, { threshold: 0.6 });
  els.forEach((el) => vigia.observe(el));
  return () => vigia.disconnect();
}

/* ---------- Cerimônia ---------- */

/** Setas da galeria de uma foto por vez; o deslizar com o dedo funciona sem elas. */
function galeriaComSetas(raiz: HTMLElement, semMovimento: boolean): () => void {
  const galeria = raiz.querySelector<HTMLElement>(".b-galeria");
  const botoes = [...raiz.querySelectorAll<HTMLButtonElement>("[data-galeria]")];
  if (!galeria || botoes.length === 0) return () => {};
  const atualizar = () => {
    const fim = galeria.scrollWidth - galeria.clientWidth - 2;
    botoes.forEach((b) => { b.disabled = b.dataset.galeria === "anterior" ? galeria.scrollLeft <= 2 : galeria.scrollLeft >= fim; });
  };
  const aoClicar = (e: Event) => {
    const dir = (e.currentTarget as HTMLElement).dataset.galeria === "anterior" ? -1 : 1;
    galeria.scrollBy({ left: dir * galeria.clientWidth, behavior: semMovimento ? "auto" : "smooth" });
  };
  botoes.forEach((b) => b.addEventListener("click", aoClicar));
  galeria.addEventListener("scroll", atualizar, { passive: true });
  atualizar();
  return () => { botoes.forEach((b) => b.removeEventListener("click", aoClicar)); galeria.removeEventListener("scroll", atualizar); };
}
