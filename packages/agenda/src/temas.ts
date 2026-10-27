/**
 * Temas do site da barbearia (plano completo em docs/estilos/plano.md).
 * `efeitos` é o teto de movimento do tema, de 1 (quase parado) a 5 (máximo).
 */
export const TEMAS = [
  { id: "silencioso", nome: "Luxo Silencioso", efeitos: 1, resumo: "Branco, preto e muito espaço. O trabalho fala sozinho." },
  { id: "atemporal", nome: "Elegância Atemporal", efeitos: 2, resumo: "Preto e branco clássico; as fotos ganham cor ao toque." },
  { id: "cerimonia", nome: "Cerimônia", efeitos: 2, resumo: "Escuro, calmo e exclusivo, como atendimento sob reserva." },
  { id: "tecnico", nome: "Luxo Técnico", efeitos: 3, resumo: "Claro, macio e confortável, com cantos arredondados." },
  { id: "potencia", nome: "Potência", efeitos: 4, resumo: "Escuro, letras gigantes e neon. Pra degradê e freestyle." },
  { id: "extravagancia", nome: "Extravagância", efeitos: 5, resumo: "Preto e ouro, ornamentos e brilho. Clássico premium." },
] as const;

export type IdTema = (typeof TEMAS)[number]["id"];
export const TEMA_PADRAO: IdTema = "silencioso";

export function temaValido(id: string): id is IdTema {
  return TEMAS.some((t) => t.id === id);
}

/** Categorias das fotos dos trabalhos (viram os filtros da galeria). */
export const CATEGORIAS_FOTO = [
  { id: "ambiente", nome: "Ambiente" },
  { id: "degrade", nome: "Degradê" },
  { id: "corte", nome: "Cortes" },
  { id: "barba", nome: "Barba" },
  { id: "navalhado", nome: "Navalhado" },
  { id: "infantil", nome: "Infantil" },
  { id: "sobrancelha", nome: "Sobrancelha" },
  { id: "produtos", nome: "Produtos" },
  { id: "equipe", nome: "Equipe" },
] as const;

export type CategoriaFoto = (typeof CATEGORIAS_FOTO)[number]["id"];

export function categoriaValida(id: string): id is CategoriaFoto {
  return CATEGORIAS_FOTO.some((c) => c.id === id);
}
