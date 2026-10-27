"use client";

import { useState } from "react";

/**
 * Campo de foto que reduz a imagem NO CELULAR antes de enviar (ideia do painel do jogo):
 * foto de celular tem 3–12 MB e o site nunca mostra maior que 1600px, então subir o
 * original gasta o 4G do barbeiro e a memória do servidor à toa. De quebra, o desenho no
 * canvas não leva o EXIF: a localização nem sai do aparelho.
 *
 * O servidor continua passando tudo por `processarFoto`: isto só deixa o envio leve.
 * O que o navegador não conseguir abrir (HEIC fora do iPhone, PDF) vai como está.
 */
export function CampoFoto({ name, accept, multiple, required, ladoMaximo = 1600 }: {
  name: string; accept: string; multiple?: boolean; required?: boolean; ladoMaximo?: number;
}) {
  const [estado, setEstado] = useState("");

  async function reduzir(arquivo: File): Promise<File> {
    if (!arquivo.type.startsWith("image/") || arquivo.type === "image/gif") return arquivo;
    try {
      const imagem = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
      const escala = Math.min(1, ladoMaximo / Math.max(imagem.width, imagem.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(imagem.width * escala));
      canvas.height = Math.max(1, Math.round(imagem.height * escala));
      canvas.getContext("2d")!.drawImage(imagem, 0, 0, canvas.width, canvas.height);
      imagem.close();
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.88));
      if (!blob || blob.size >= arquivo.size) return arquivo;
      return new File([blob], arquivo.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
      return arquivo;
    }
  }

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const campo = e.currentTarget;
    const originais = Array.from(campo.files ?? []);
    if (originais.length === 0 || typeof DataTransfer === "undefined") return;
    // Enquanto prepara, o formulário não envia (validação nativa segura o botão).
    campo.setCustomValidity("Espere um instante: preparando as fotos.");
    setEstado(originais.length > 1 ? `Preparando ${originais.length} fotos…` : "Preparando a foto…");
    const prontas = await Promise.all(originais.map(reduzir));
    const lista = new DataTransfer();
    prontas.forEach((f) => lista.items.add(f));
    campo.files = lista.files;
    campo.setCustomValidity("");
    const antes = originais.reduce((s, f) => s + f.size, 0);
    const depois = prontas.reduce((s, f) => s + f.size, 0);
    setEstado(depois < antes ? `Pronto: ${mb(antes)} → ${mb(depois)}.` : "");
  }

  return (
    <>
      <input type="file" name={name} accept={accept} multiple={multiple} required={required} onChange={aoEscolher} />
      {estado && <small className="suave" role="status">{estado}</small>}
    </>
  );
}

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}
