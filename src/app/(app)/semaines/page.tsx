import Link from "next/link";
import { EnteteOnglet } from "@/components/ds/Entete";
import { Pad } from "@/components/ds/Ecran";
import { Section } from "@/components/ds/Section";
import { formatJourLong } from "@/lib/dates";

// Onglet Semaines. Vide en phase 0 : la carte de semaine arrive en phase 2.
export default function PageSemaines() {
  return (
    <>
      <EnteteOnglet titre="Les semaines" sousTitre={formatJourLong(new Date())} />
      <Pad className="flex flex-1 flex-col">
        <div className="flex-1" />
        {/* Lien discret de changement de foyer : ressaisir un code, rien d'autre. */}
        <Section className="mt-6 py-4 text-center">
          <Link href="/foyer" className="text-faint">
            changer de foyer
          </Link>
        </Section>
      </Pad>
    </>
  );
}
