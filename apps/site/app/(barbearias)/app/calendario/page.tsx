import { redirect } from "next/navigation";

/** O calendário (.ics) saiu do painel: agora o celular recebe avisos do app. Link antigo leva pra lá. */
export default function Calendario() {
  redirect("/app/avisos");
}
