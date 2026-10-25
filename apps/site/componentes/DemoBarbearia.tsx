import { CalendarCheck, MapPin, Star } from "lucide-react";
import { Inclinavel } from "./Inclinavel";

/**
 * Vitrine do produto: um celular em 3D mostrando como fica o "book" de uma
 * barbearia (trabalhos + agenda). É só HTML/CSS, sem imagem pra baixar.
 */
const TRABALHOS = ["degradê", "navalhado", "barba", "social", "pigmentação", "kids"];
const HORARIOS = [["09:00", true], ["09:30", false], ["10:00", true], ["10:30", true], ["11:00", false], ["13:30", true]] as const;

export function DemoBarbearia() {
  return (
    <Inclinavel intensidade={14} className="demo-palco">
      <div className="celular" aria-label="Exemplo do site de uma barbearia" role="img">
        <div className="celular-tela">
          <div className="demo-capa">
            <div className="demo-avatar">✂️</div>
            <div>
              <strong>Navalha de Ouro</strong>
              <span><Star size={12} aria-hidden /> 4,9 · <MapPin size={12} aria-hidden /> Centro</span>
            </div>
          </div>
          <p className="demo-titulo">Trabalhos</p>
          <div className="demo-grade">
            {TRABALHOS.map((t, i) => (
              <div key={t} className={`demo-foto f${i}`}><span>{t}</span></div>
            ))}
          </div>
          <p className="demo-titulo"><CalendarCheck size={13} aria-hidden /> Horários de hoje</p>
          <div className="demo-horarios">
            {HORARIOS.map(([h, livre]) => (
              <span key={h} className={livre ? "livre" : "ocupado"}>{h}</span>
            ))}
          </div>
          <div className="demo-botao">Agendar agora</div>
        </div>
      </div>
    </Inclinavel>
  );
}
