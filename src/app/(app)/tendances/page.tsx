import { EnteteOnglet } from "@/components/ds/Entete";
import { Pad } from "@/components/ds/Ecran";
import { formatPoids } from "@/components/semaine/copie";
import { CarteActivite, CarteJokers } from "@/components/tendances/CartesSemaines";
import { Courbe, TableauMesures, type SeriePersonne } from "@/components/tendances/Courbe";
import { personnesDuFoyer } from "@/db/personnes";
import { infoDe, semainesDuFoyer } from "@/db/semaines";
import { bilanJokers, frequenceTypes, TYPES_ECART, type TypeEcart } from "@/domain/jokers";
import { tendance, type TypeMesure } from "@/domain/mesures";
import { initiales } from "@/domain/personnes";
import { dimanchePreparation } from "@/domain/semaine";
import { fenetreSemaines } from "@/domain/tendances";
import { jourCourt } from "@/lib/dates";
import { foyerCourant } from "@/lib/foyer-courant";
import { horloge } from "@/lib/horloge";

const FENETRE = 8;
const DATES_TABLEAU = 4;

// Écran 21 : le seul qui regarde plus loin qu'une semaine. Tout en % du
// départ ; une personne sous trois mesures n'a pas de courbe, sans message.
export default async function PageTendances() {
  const foyer = (await foyerCourant())!;
  const [semaines, personnes] = await Promise.all([semainesDuFoyer(foyer.id), personnesDuFoyer(foyer.id)]);
  const { jour } = await horloge();
  const ini = initiales(personnes.map((p) => p.prenom));
  const triees = [...semaines].sort((a, b) => a.debut.localeCompare(b.debut));

  // Mesures : séries par type et par personne, tableau des dernières dates.
  const points = (personneId: string, type: TypeMesure) =>
    triees.flatMap((s) =>
      s.mesures
        .filter((m) => m.personneId === personneId && m.type === type)
        .map((m) => ({ jour: dimanchePreparation(s.debut), valeur: m.valeur })),
    );
  const series = Object.fromEntries(
    (["poids", "tour_taille"] as TypeMesure[]).map((type) => [
      type,
      personnes.map(
        (p, i): SeriePersonne => ({ prenom: p.prenom, initiales: ini[i], ordre: p.ordre, points: tendance(points(p.id, type)) }),
      ),
    ]),
  ) as Record<TypeMesure, SeriePersonne[]>;
  const datesMesurees = triees.filter((s) => s.mesures.length > 0).slice(-DATES_TABLEAU);
  const tableau = personnes.map((p, i) => ({
    initiales: ini[i],
    ordre: p.ordre,
    cellules: datesMesurees.map((s) => {
      const v = (type: TypeMesure) => s.mesures.find((m) => m.personneId === p.id && m.type === type)?.valeur ?? null;
      const poids = v("poids");
      const taille = v("tour_taille");
      return { poids: poids === null ? null : formatPoids(poids), taille: taille === null ? null : String(taille) };
    }),
  }));

  // Jokers et activité sur la fenêtre.
  const fenetre = fenetreSemaines(jour, FENETRE);
  const parDebut = new Map(semaines.map((s) => [s.debut, s]));
  const jokers = fenetre.map((debut) => {
    const s = parDebut.get(debut);
    if (!s) return { debut, pose: 0, consomme: 0 };
    const b = bilanJokers(s.ecarts, infoDe(s), jour);
    return { debut, pose: b.pose, consomme: b.consomme };
  });
  const frequence = Object.fromEntries(TYPES_ECART.map((t) => [t, 0])) as Record<TypeEcart, number>;
  for (const debut of fenetre) {
    const f = frequenceTypes(parDebut.get(debut)?.ecarts ?? []);
    for (const t of TYPES_ECART) frequence[t] += f[t];
  }
  const activite = personnes.map((p) => ({
    prenom: p.prenom,
    semaines: fenetre.map((debut) => (parDebut.get(debut)?.seances ?? []).some((x) => x.personneId === p.id && x.faite)),
  }));

  const premiere = triees[0]?.debut;
  const nbSemaines = premiere ? fenetreSemaines(jour, 1000).filter((d) => d >= premiere).length : 0;
  const rien = semaines.length === 0;

  return (
    <>
      <EnteteOnglet titre="Tendances" sousTitre={rien ? undefined : `${nbSemaines} semaine${nbSemaines > 1 ? "s" : ""} · en % du départ`} />
      {!rien && (
        <Pad className="pb-4">
          <Courbe series={series} />
          {datesMesurees.length > 0 && (
            <TableauMesures dates={datesMesurees.map((s) => ({ jour: s.debut, libelle: jourCourt(dimanchePreparation(s.debut)) }))} lignes={tableau} />
          )}
          {jokers.some((j) => j.pose > 0 || j.consomme > 0) && <CarteJokers semaines={jokers} frequence={frequence} />}
          {activite.some((a) => a.semaines.some(Boolean)) && <CarteActivite personnes={activite} />}
        </Pad>
      )}
    </>
  );
}
