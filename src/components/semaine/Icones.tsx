// Les quatre pastilles d'icône de la carte de semaine, reprises des maquettes.
const commun = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const };

export const ICONES = {
  mesures: (
    <svg width="17" height="17" viewBox="0 0 24 24" strokeWidth="1.8" {...commun}>
      <path d="M12 20a8 8 0 100-16 8 8 0 000 16zM12 12l4-4" />
    </svg>
  ),
  jokers: (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.7" strokeLinejoin="round" {...commun}>
      <path d="M3 9.2V7.6A1.6 1.6 0 014.6 6h14.8A1.6 1.6 0 0121 7.6v1.6a2.8 2.8 0 000 5.6v1.6a1.6 1.6 0 01-1.6 1.6H4.6A1.6 1.6 0 013 16.4v-1.6a2.8 2.8 0 000-5.6z" />
      <path d="M12 10v4" strokeDasharray="1.6 2" />
    </svg>
  ),
  plats: (
    <svg width="17" height="17" viewBox="0 0 24 24" strokeWidth="1.8" {...commun}>
      <path d="M4 10h16v4.5a4.5 4.5 0 01-4.5 4.5h-7A4.5 4.5 0 014 14.5zM2 12.5h2M20 12.5h2M9.5 6.6c.9-.9.9-1.8 0-2.6M14.5 6.6c.9-.9.9-1.8 0-2.6" />
    </svg>
  ),
  activite: (
    <svg width="17" height="17" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinejoin="round" {...commun}>
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </svg>
  ),
} as const;

export type Sujet = keyof typeof ICONES;
