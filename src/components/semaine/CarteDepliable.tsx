"use client";

import { useState, type ReactNode } from "react";
import { CarteReduite } from "./CarteSemaine";

// Une semaine passée : réduite par défaut, dépliée sur place au toucher. La
// carte complète est rendue côté serveur et simplement montrée ou cachée.
export function CarteDepliable({
  titre,
  chip,
  complete,
  deplieeAuDepart = false,
}: {
  titre: string;
  chip: ReactNode;
  complete: ReactNode;
  deplieeAuDepart?: boolean;
}) {
  const [depliee, setDepliee] = useState(deplieeAuDepart);
  if (depliee) return <>{complete}</>;
  return <CarteReduite titre={titre} chip={chip} onClick={() => setDepliee(true)} />;
}
