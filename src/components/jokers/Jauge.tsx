import type { Jeton } from "@/domain/jokers";

// La jauge de jetons (`.jt`) : toujours trois emplacements, les jetons
// au-delà du budget s'ajoutent à la file en terracotta. Rien ne déborde.
const TICKET = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.2V7.6A1.6 1.6 0 014.6 6h14.8A1.6 1.6 0 0121 7.6v1.6a2.8 2.8 0 000 5.6v1.6a1.6 1.6 0 01-1.6 1.6H4.6A1.6 1.6 0 013 16.4v-1.6a2.8 2.8 0 000-5.6z" />
  </svg>
);

const OCHRE = "160,134,60";
const TERRE = "176,103,59";

function style(j: Jeton): React.CSSProperties {
  const moitie = (c: string, reste: string) => ({
    backgroundImage: `linear-gradient(90deg, rgba(${c},.16) 0 50%, ${reste} 50% 100%)`,
    boxShadow: `inset -1px 0 0 rgba(${c},.3)`,
  });
  switch (j.etat) {
    case "consomme":
      return j.moitie ? moitie(OCHRE, `rgba(${OCHRE},.05)`) : { backgroundColor: `rgba(${OCHRE},.16)` };
    case "pose":
      return { border: `1px solid rgba(${OCHRE},.45)`, ...(j.moitie ? moitie(OCHRE, "transparent") : {}) };
    case "au_dela":
      return {
        border: `1px solid rgba(${TERRE},.32)`,
        ...(j.moitie ? moitie(TERRE, `rgba(${TERRE},.02)`) : { backgroundColor: `rgba(${TERRE},.12)` }),
      };
    case "libre":
      return { border: "1px dashed #D8D3C9" };
  }
}

export function Jauge({ jetons }: { jetons: Jeton[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-0.5 pb-3.5" aria-hidden>
      {jetons.map((j, i) => (
        <span
          key={i}
          style={style(j)}
          className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-ic ${
            j.etat === "au_dela" ? "text-joker-text" : j.etat === "libre" ? "text-[#CFCAC0]" : "text-pose-text"
          }`}
        >
          {j.etat === "libre" ? "+" : TICKET}
        </span>
      ))}
    </div>
  );
}
