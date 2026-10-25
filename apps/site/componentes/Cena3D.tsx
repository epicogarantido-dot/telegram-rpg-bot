"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cena 3D do topo: um planeta de pontos (o "mundo do conhecimento") com
 * objetos coloridos em órbita. Arrastar gira o planeta; tocar num objeto faz
 * ele pular e soltar faíscas. Decorativa: o texto da página não depende dela.
 *
 * Cuidados de experiência: carrega o three.js só no navegador e depois do
 * texto; pausa fora da tela e com a aba escondida; limita a resolução no
 * celular; com "reduzir movimento" desenha um quadro parado.
 */
export function Cena3D() {
  const caixa = useRef<HTMLDivElement>(null);
  const [pronta, setPronta] = useState(false);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    let encerrar = () => {};
    let cancelado = false;

    void import("three").then((THREE) => {
      if (cancelado) return;
      const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // sem WebGL: fica só o brilho em CSS
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const cena = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 10);

      cena.add(new THREE.HemisphereLight(0xfff4e0, 0x1d6b4e, 1.4));
      const sol = new THREE.DirectionalLight(0xffffff, 2.2);
      sol.position.set(4, 6, 8);
      cena.add(sol);
      const luzRosa = new THREE.PointLight(0xf472b6, 18, 20);
      luzRosa.position.set(-5, -3, 4);
      cena.add(luzRosa);

      const mundo = new THREE.Group();
      cena.add(mundo);

      // Planeta: pontos distribuídos igualmente na esfera (espiral de Fibonacci).
      const N = 1400;
      const raio = 2.1;
      const pos = new Float32Array(N * 3);
      const cor = new Float32Array(N * 3);
      const verde = new THREE.Color("#b6f5d3");
      const dourado = new THREE.Color("#e0a43a");
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const t = Math.PI * (3 - Math.sqrt(5)) * i;
        const rp = raio * 1.02;
        pos.set([Math.cos(t) * r * rp, y * rp, Math.sin(t) * r * rp], i * 3);
        const c = verde.clone().lerp(dourado, Math.random() < 0.12 ? 1 : Math.random() * 0.25);
        cor.set([c.r, c.g, c.b], i * 3);
      }
      const geoPlaneta = new THREE.BufferGeometry();
      geoPlaneta.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geoPlaneta.setAttribute("color", new THREE.BufferAttribute(cor, 3));
      const matPlaneta = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
      const planeta = new THREE.Points(geoPlaneta, matPlaneta);
      mundo.add(planeta);

      // Núcleo lapidado (parece uma joia) + "atmosfera" + anel dourado tipo Saturno.
      const nucleo = new THREE.Mesh(
        new THREE.IcosahedronGeometry(raio * 0.93, 2),
        new THREE.MeshStandardMaterial({ color: "#2fae78", emissive: "#0c3b28", emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2, flatShading: true }),
      );
      mundo.add(nucleo);
      const atmosfera = new THREE.Mesh(
        new THREE.SphereGeometry(raio * 1.18, 48, 48),
        new THREE.MeshBasicMaterial({ color: "#6fcf9f", transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false }),
      );
      mundo.add(atmosfera);
      const anel = new THREE.Mesh(
        new THREE.TorusGeometry(raio * 1.45, 0.05, 12, 120),
        new THREE.MeshStandardMaterial({ color: "#f0bb5e", emissive: "#7a5310", emissiveIntensity: 0.5, roughness: 0.25, metalness: 0.6 }),
      );
      anel.rotation.set(Math.PI / 2.4, 0.3, 0);
      mundo.add(anel);

      // Estrelas de fundo.
      const NE = 500;
      const posE = new Float32Array(NE * 3);
      for (let i = 0; i < NE; i++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(14 + Math.random() * 18);
        posE.set([v.x, v.y, v.z], i * 3);
      }
      const geoEstrelas = new THREE.BufferGeometry();
      geoEstrelas.setAttribute("position", new THREE.BufferAttribute(posE, 3));
      const matEstrelas = new THREE.PointsMaterial({ size: 0.08, color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
      const estrelas = new THREE.Points(geoEstrelas, matEstrelas);
      cena.add(estrelas);

      // Objetos em órbita: formas simples e cores vivas.
      const cores = ["#e0a43a", "#f472b6", "#60a5fa", "#a78bfa", "#facc15", "#34d399", "#fb7185", "#38bdf8"];
      const formas = [
        new THREE.IcosahedronGeometry(0.42, 0),
        new THREE.TorusGeometry(0.34, 0.14, 16, 40),
        new THREE.OctahedronGeometry(0.42, 0),
        new THREE.BoxGeometry(0.62, 0.44, 0.16), // um "livro"
        new THREE.DodecahedronGeometry(0.38, 0),
        new THREE.TorusKnotGeometry(0.24, 0.09, 80, 12),
        new THREE.ConeGeometry(0.32, 0.6, 5),
        new THREE.SphereGeometry(0.3, 24, 24),
      ];
      const orbitantes = formas.map((geo, i) => {
        const mat = new THREE.MeshStandardMaterial({ color: cores[i], roughness: 0.35, metalness: 0.15, flatShading: true });
        const malha = new THREE.Mesh(geo, mat);
        const dados = {
          raio: 3.1 + (i % 3) * 0.45,
          velocidade: 0.18 + Math.random() * 0.22,
          fase: (i / formas.length) * Math.PI * 2,
          inclinacao: (Math.random() - 0.5) * 0.9,
          giro: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(1.4),
          pulo: 0,
        };
        malha.userData = dados;
        mundo.add(malha);
        return malha;
      });

      // Faíscas quando toca.
      type Faisca = { pontos: InstanceType<typeof THREE.Points>; vel: Float32Array; vida: number };
      const faiscas: Faisca[] = [];
      function explodir(origem: InstanceType<typeof THREE.Vector3>, corHex: string) {
        const n = 46;
        const p = new Float32Array(n * 3);
        const v = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          p.set([origem.x, origem.y, origem.z], i * 3);
          const d = new THREE.Vector3().randomDirection().multiplyScalar(2 + Math.random() * 3);
          v.set([d.x, d.y, d.z], i * 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(p, 3));
        const m = new THREE.PointsMaterial({ size: 0.12, color: corHex, transparent: true, opacity: 1, depthWrite: false });
        const pontos = new THREE.Points(g, m);
        cena.add(pontos);
        faiscas.push({ pontos, vel: v, vida: 1 });
      }

      // Interação: arrastar gira, tocar faz pular.
      const alvo = { x: 0, y: 0 };
      let giroY = 0;
      let inerciaY = 0;
      let arrastando = false;
      let ultimoX = 0;
      let moveu = 0;
      const raycaster = new THREE.Raycaster();
      const ponteiro = new THREE.Vector2();
      const canvas = renderer.domElement;

      function noPonteiro(e: PointerEvent) {
        const r = canvas.getBoundingClientRect();
        ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        alvo.x = ponteiro.y * 0.25;
        alvo.y = ponteiro.x * 0.35;
        if (arrastando) {
          const dx = e.clientX - ultimoX;
          ultimoX = e.clientX;
          moveu += Math.abs(dx);
          inerciaY = dx * 0.006;
          giroY += inerciaY;
        }
      }
      function aoApertar(e: PointerEvent) {
        arrastando = true;
        moveu = 0;
        ultimoX = e.clientX;
        canvas.setPointerCapture(e.pointerId);
      }
      function aoSoltar(e: PointerEvent) {
        arrastando = false;
        if (moveu > 6) return; // foi arrasto, não toque
        noPonteiro(e);
        raycaster.setFromCamera(ponteiro, camera);
        const [acerto] = raycaster.intersectObjects(orbitantes, false);
        if (acerto) {
          const obj = acerto.object as (typeof orbitantes)[number];
          obj.userData.pulo = 1;
          explodir(acerto.point, cores[orbitantes.indexOf(obj)]!);
        } else {
          const ponto = new THREE.Vector3(ponteiro.x, ponteiro.y, 0.5).unproject(camera);
          const dir = ponto.sub(camera.position).normalize();
          explodir(camera.position.clone().add(dir.multiplyScalar(8)), "#facc15");
        }
        if (semMovimento) desenhar(0);
      }
      canvas.addEventListener("pointermove", noPonteiro);
      canvas.addEventListener("pointerdown", aoApertar);
      canvas.addEventListener("pointerup", aoSoltar);
      canvas.addEventListener("pointercancel", () => (arrastando = false));

      function ajustar() {
        const { width, height } = el!.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // Em tela estreita, afasta a câmera pra órbita caber.
        camera.position.z = width / height < 1 ? 13 : 10;
        camera.updateProjectionMatrix();
      }
      const observador = new ResizeObserver(() => {
        ajustar();
        if (semMovimento) desenhar(0);
      });
      observador.observe(el);
      ajustar();

      const relogio = new THREE.Clock();
      let tempo = 0;
      function desenhar(dt: number) {
        tempo += dt;
        if (!arrastando) {
          inerciaY *= 0.95;
          giroY += inerciaY + dt * 0.12;
        }
        mundo.rotation.y = giroY;
        mundo.rotation.x += (alvo.x - mundo.rotation.x) * 0.05;
        cena.rotation.y += (alvo.y * 0.3 - cena.rotation.y) * 0.03;
        estrelas.rotation.y = tempo * 0.01;

        for (const o of orbitantes) {
          const d = o.userData as { raio: number; velocidade: number; fase: number; inclinacao: number; giro: InstanceType<typeof THREE.Vector3>; pulo: number };
          const a = d.fase + tempo * d.velocidade;
          o.position.set(Math.cos(a) * d.raio, Math.sin(a * 1.3) * 0.5 + Math.sin(a) * d.raio * d.inclinacao, Math.sin(a) * d.raio);
          o.rotation.x += d.giro.x * dt * (1 + d.pulo * 8);
          o.rotation.y += d.giro.y * dt * (1 + d.pulo * 8);
          const escala = 1 + Math.sin(d.pulo * Math.PI) * 0.6;
          o.scale.setScalar(escala);
          d.pulo = Math.max(0, d.pulo - dt * 1.6);
        }

        for (let i = faiscas.length - 1; i >= 0; i--) {
          const f = faiscas[i]!;
          f.vida -= dt * 0.9;
          const attr = f.pontos.geometry.getAttribute("position") as InstanceType<typeof THREE.BufferAttribute>;
          for (let j = 0; j < attr.count; j++) {
            f.vel[j * 3 + 1]! -= dt * 3; // gravidade
            attr.setXYZ(j, attr.getX(j) + f.vel[j * 3]! * dt, attr.getY(j) + f.vel[j * 3 + 1]! * dt, attr.getZ(j) + f.vel[j * 3 + 2]! * dt);
          }
          attr.needsUpdate = true;
          (f.pontos.material as InstanceType<typeof THREE.PointsMaterial>).opacity = Math.max(0, f.vida);
          if (f.vida <= 0) {
            cena.remove(f.pontos);
            f.pontos.geometry.dispose();
            (f.pontos.material as InstanceType<typeof THREE.PointsMaterial>).dispose();
            faiscas.splice(i, 1);
          }
        }
        renderer.render(cena, camera);
      }

      let visivel = true;
      let quadro = 0;
      function laco() {
        quadro = requestAnimationFrame(laco);
        if (!visivel || document.hidden) {
          relogio.getDelta();
          return;
        }
        desenhar(Math.min(relogio.getDelta(), 0.05));
      }
      const vigia = new IntersectionObserver(([e]) => (visivel = !!e?.isIntersecting));
      vigia.observe(el);

      if (semMovimento) desenhar(0);
      else laco();
      setPronta(true);

      encerrar = () => {
        cancelAnimationFrame(quadro);
        observador.disconnect();
        vigia.disconnect();
        cena.traverse((obj) => {
          const o = obj as { geometry?: { dispose(): void }; material?: { dispose(): void } };
          o.geometry?.dispose();
          o.material?.dispose();
        });
        renderer.dispose();
        canvas.remove();
      };
    });

    return () => {
      cancelado = true;
      encerrar();
    };
  }, []);

  return (
    <div className={`cena-3d ${pronta ? "pronta" : ""}`} ref={caixa}>
      {pronta && <span className="dica-3d" aria-hidden>👆 toque nos objetos · arraste pra girar</span>}
    </div>
  );
}
