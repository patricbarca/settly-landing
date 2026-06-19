import type { Group } from "./types";
import { uid } from "./format";

export function createSeed(): Group {
  const me = { id: uid(), name: "Siena", avatar: "" };
  const alexa = { id: uid(), name: "Alexa", avatar: "" };
  const patrick = { id: uid(), name: "Patrick", avatar: "" };
  const john = { id: uid(), name: "John", avatar: "" };
  const members = [me, alexa, patrick, john];
  const ids = members.map((m) => m.id);

  return {
    id: uid(),
    name: "Piso compartido",
    currency: "USD",
    meId: me.id,
    members,
    expenses: [
      { id: uid(), label: "Cena de bienvenida", amount: 120, payerId: alexa.id, participantIds: ids, category: "comida", date: "2026-06-10" },
      { id: uid(), label: "Súper de la semana", amount: 86.4, payerId: me.id, participantIds: ids, category: "compras", date: "2026-06-12" },
      { id: uid(), label: "Taxi al aeropuerto", amount: 32, payerId: patrick.id, participantIds: [me.id, patrick.id, john.id], category: "transporte", date: "2026-06-14" },
      { id: uid(), label: "Entradas concierto", amount: 160, payerId: john.id, participantIds: ids, category: "ocio", date: "2026-06-15" },
    ],
  };
}
