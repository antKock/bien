import Link from "next/link";
import { Chip } from "@/components/ds/Chip";
import { EnteteOnglet } from "@/components/ds/Entete";
import { Pad } from "@/components/ds/Ecran";
import { Section } from "@/components/ds/Section";
import { CarteDepliable } from "@/components/semaine/CarteDepliable";
import { CarteFantome, CarteReduite } from "@/components/semaine/CarteSemaine";
import { CarteDeSemaine, CHIPS, titreSemaine } from "@/components/semaine/construire";
import { personnesDuFoyer } from "@/db/personnes";
import { repertoire } from "@/db/recettes";
import { infoDe, semainesDuFoyer } from "@/db/semaines";
import { jourDe } from "@/domain/jours";
import { composerOnglet } from "@/domain/onglet-semaines";
import { jourLong } from "@/lib/dates";
import { foyerCourant } from "@/lib/foyer-courant";
import { horloge } from "@/lib/horloge";

// Onglet Semaines : la semaine à confirmer, la courante, la fantôme, puis les
// semaines passées réduites. Tout se déduit du jour et des lignes existantes.
export default async function PageSemaines() {
  const foyer = (await foyerCourant())!;
  const [semaines, personnes, recettes] = await Promise.all([
    semainesDuFoyer(foyer.id),
    personnesDuFoyer(foyer.id),
    repertoire(),
  ]);
  const { jour } = await horloge();
  const onglet = composerOnglet(semaines.map(infoDe), jour);
  const parDebut = new Map(semaines.map((s) => [s.debut, s]));
  // Une semaine clôturée aujourd'hui reste dépliée : c'est la carte qu'on vient de toucher.
  const clotureeAujourdhui = (debut: string) => {
    const c = parDebut.get(debut)?.clotureeLe;
    return c ? jourDe(c) === jour : false;
  };
  const carte = (debut: string) => (
    <CarteDeSemaine
      debut={debut}
      semaine={parDebut.get(debut) ?? null}
      personnes={personnes}
      aujourdhui={jour}
      recettes={recettes}
    />
  );

  return (
    <>
      <EnteteOnglet titre="Les semaines" sousTitre={jourLong(jour)} />
      <Pad className="flex flex-1 flex-col gap-4">
        {onglet.aConfirmer && carte(onglet.aConfirmer)}
        {carte(onglet.courante)}
        {onglet.fantome && (
          <CarteFantome titre={titreSemaine(onglet.fantome, false)} chip={<Chip>dimanche prochain</Chip>} />
        )}
        {onglet.passees.length > 0 && (
          <>
            <div className="mt-1.5 flex items-center gap-2.5">
              <Section>déjà passées</Section>
              <span className="h-px flex-1 bg-border" />
            </div>
            {onglet.passees.map((p) =>
              p.etat === "vide" ? (
                <CarteReduite key={p.debut} titre={titreSemaine(p.debut, true)} chip={<Chip>{CHIPS.vide}</Chip>} />
              ) : (
                <CarteDepliable
                  key={p.debut}
                  titre={titreSemaine(p.debut, true)}
                  chip={<Chip>{CHIPS[p.etat]}</Chip>}
                  complete={carte(p.debut)}
                  deplieeAuDepart={clotureeAujourdhui(p.debut)}
                />
              ),
            )}
          </>
        )}
        <Section className="mt-auto py-4 text-center">
          <Link href="/foyer" className="text-faint">
            changer de foyer
          </Link>
        </Section>
      </Pad>
    </>
  );
}
