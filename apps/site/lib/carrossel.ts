/**
 * Teto de itens por carrossel: mais que isso ninguém rola, e a lista completa tem página própria.
 * Fica fora de Carrossel.tsx ("use client"): constante importada de arquivo de cliente chega
 * no servidor como referência, não como número.
 */
export const MAX_ITENS_CARROSSEL = 20;
