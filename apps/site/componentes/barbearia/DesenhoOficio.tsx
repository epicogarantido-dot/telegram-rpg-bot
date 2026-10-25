/**
 * Ferramentas do ofício em traço único (desenho nosso): tesoura, pente e
 * navalha. Com movimento liberado, o traço se completa conforme a pessoa rola
 * (temas.css, .b-desenho); sem suporte ou com movimento reduzido, aparece pronto.
 */
export function DesenhoOficio() {
  return (
    <div className="b-desenho-faixa" aria-hidden="true">
      <svg className="b-desenho" viewBox="0 0 640 200" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g className="t-tesoura">
          <circle cx="52" cy="72" r="22" pathLength="1" />
          <circle cx="52" cy="132" r="22" pathLength="1" />
          <path d="M72 82 L124 104 L216 126 Q206 132 194 128 L118 110" pathLength="1" />
          <path d="M72 122 L124 100 L216 78 Q206 72 194 76 L118 94" pathLength="1" />
          <circle cx="122" cy="102" r="3" pathLength="1" />
        </g>
        <g className="t-pente">
          <rect x="262" y="62" width="150" height="26" rx="5" pathLength="1" />
          <path d="M272 88v44 M284 88v44 M296 88v44 M308 88v44 M320 88v44 M332 88v44 M344 88v30 M356 88v30 M368 88v30 M380 88v30 M392 88v30 M404 88v30" pathLength="1" />
        </g>
        <g className="t-navalha">
          <path d="M540 104 L456 104 Q440 104 440 120 Q440 140 460 140 L540 128 L540 104" pathLength="1" />
          <path d="M540 104 Q552 98 556 108" pathLength="1" />
          <rect x="540" y="110" width="84" height="18" rx="9" pathLength="1" />
          <circle cx="550" cy="119" r="3" pathLength="1" />
        </g>
        <path className="t-base" d="M24 180 H616" pathLength="1" />
      </svg>
    </div>
  );
}
