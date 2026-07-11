/**
 * data.ts, referentiel metier des ferias du Sud-Ouest.
 *
 * C'est LE fichier central du domaine : chaque feria y est decrite avec
 * ses coordonnees GPS (centre de la fete, pas de la ville administrative),
 * ses dates 2026 et son programme indicatif.
 *
 * Regle d'honnetete metier : les programmes officiels sortent souvent
 * quelques semaines avant l'evenement. On expose donc un drapeau
 * `datesConfirmed` et on renvoie toujours vers le site officiel.
 */
import type { LatLng } from "@/lib/geo";

/** Un creneau du programme (indicatif) d'une feria. */
export type ProgramItem = {
  /** Heure au format "22h30", ou "toute la journee". */
  time: string;
  title: string;
  place?: string;
};

/** Une journee de programme. */
export type ProgramDay = {
  label: string;
  items: ProgramItem[];
};

/** Fiche complete d'une feria. */
export type Feria = {
  /** Identifiant URL (slug), stable, sert de cle partout. */
  id: string;
  name: string;
  city: string;
  /** Departement ou region affichee (ex : "Landes"). */
  area: string;
  /** Centre de gravite de la fete (bodegas / arenes / mairie). */
  center: LatLng;
  /** Dates 2026 au format ISO (inclusives). */
  start: string;
  end: string;
  /** false = dates estimees d'apres les editions precedentes. */
  datesConfirmed: boolean;
  /** Site officiel, seule source fiable pour le programme final. */
  official: string;
  /** Une phrase d'ambiance pour la carte de selection. */
  vibe: string;
  /** Ou acheter le bracelet / pass d'entree, si la feria est payante. */
  bracelets?: string;
  /** Navettes et bus de nuit : reseau + conseil pratique. */
  shuttles?: string;
  /** Couleur d'accent de la feria (rouge et blanc dominent partout). */
  accent: string;
  program: ProgramDay[];
};

/**
 * Programme "socle" commun a la plupart des ferias landaises et basques.
 * Les rituels sont les memes partout : encierro pour les enfants le matin,
 * bandas l'apres-midi, feu d'artifice et concerts le soir.
 */
function classicProgram(fireworks = "23h00"): ProgramDay[] {
  return [
    {
      label: "Tous les jours (indicatif)",
      items: [
        { time: "11h00", title: "Encierro txiki / courses pour enfants", place: "Centre-ville" },
        { time: "12h00", title: "Apero bodegas + bandas dans les rues" },
        { time: "17h00", title: "Course landaise ou corrida (selon jour)", place: "Arenes" },
        { time: "19h00", title: "Concerts gratuits places et bodegas" },
        { time: fireworks, title: "Feu d'artifice" },
        { time: "00h00", title: "Bals et DJ jusqu'au bout de la nuit" },
      ],
    },
  ];
}

/**
 * Referentiel 2026. Ordre = ordre chronologique de l'ete.
 * Les coordonnees pointent le coeur festif (verifie sur OpenStreetMap).
 */
export const FERIAS: Feria[] = [
  {
    id: "vic-fezensac",
    name: "Feria de Pentecote",
    city: "Vic-Fezensac",
    area: "Gers",
    center: { lat: 43.7646, lng: 0.3031 },
    start: "2026-05-22",
    end: "2026-05-25",
    datesConfirmed: false,
    official: "https://www.pentecotavic.com",
    vibe: "La doyenne gasconne, corridas et bodegas non-stop.",
    accent: "#B3261E",
    program: classicProgram("23h30"),
  },
  {
    id: "aire-sur-adour",
    name: "Fetes de l'Adour",
    city: "Aire-sur-l'Adour",
    area: "Landes",
    center: { lat: 43.7027, lng: -0.2647 },
    start: "2026-06-17",
    end: "2026-06-21",
    datesConfirmed: false,
    official: "https://www.aire-sur-adour.fr",
    vibe: "Feria a taille humaine au bord de l'Adour.",
    accent: "#C8102E",
    program: classicProgram(),
  },
  {
    id: "san-fermin",
    name: "San Fermin",
    city: "Pampelune (Navarre)",
    area: "Bonus hors Sud-Ouest",
    center: { lat: 42.8172, lng: -1.6442 },
    start: "2026-07-06",
    end: "2026-07-14",
    datesConfirmed: true,
    official: "https://www.sanfermin.com",
    vibe: "L'encierro mythique, 6h du mat, rue Estafeta.",
    accent: "#DA291C",
    program: [
      {
        label: "Tous les jours",
        items: [
          { time: "08h00", title: "Encierro (lacher de taureaux)", place: "Calle Estafeta" },
          { time: "12h00", title: "Gigantes y cabezudos (parade)" },
          { time: "18h30", title: "Corrida", place: "Plaza de Toros" },
          { time: "23h00", title: "Feu d'artifice", place: "Ciudadela" },
        ],
      },
    ],
  },
  {
    id: "bayonne",
    name: "Fetes de Bayonne",
    city: "Bayonne",
    area: "Pays basque",
    center: { lat: 43.4907, lng: -1.4748 },
    start: "2026-07-08",
    end: "2026-07-12",
    datesConfirmed: true,
    official: "https://fetes.bayonne.fr",
    vibe: "La plus grande fete de France, blanc et rouge obligatoires.",
    bracelets:
      "Acces payant pour les non-residents (bracelet Fetes de Bayonne). Achat en ligne sur fetes.bayonne.fr ou aux points d'entree du perimetre festif. Gratuit pour les mineurs.",
    shuttles:
      "Navettes Txik Txak / bus de nuit depuis les parkings relais (Ametzondo, Technocite...). Le centre est ferme aux voitures, vise un parking relais des l'arrivee.",
    accent: "#C8102E",
    program: [
      {
        label: "Mercredi (ouverture)",
        items: [
          { time: "22h00", title: "Remise des cles + Roi Leon", place: "Balcon de la mairie" },
          { time: "22h30", title: "Ouverture officielle, la ville explose" },
        ],
      },
      {
        label: "Tous les jours (indicatif)",
        items: [
          { time: "10h00", title: "Encierro txiki (enfants)", place: "Petit Bayonne" },
          { time: "12h00", title: "Bandas + bodegas", place: "Rues du Petit Bayonne" },
          { time: "17h00", title: "Courses de vaches", place: "Arenes / place Paul-Bert" },
          { time: "22h30", title: "Feu d'artifice", place: "Ponts sur l'Adour" },
          { time: "23h00", title: "Concerts et DJ toute la nuit" },
        ],
      },
      {
        label: "Dimanche (cloture)",
        items: [
          { time: "22h30", title: "Ceremonie de cloture + Agur Jaunak", place: "Mairie" },
        ],
      },
    ],
  },
  {
    id: "mont-de-marsan",
    name: "Fetes de la Madeleine",
    city: "Mont-de-Marsan",
    area: "Landes",
    center: { lat: 43.8914, lng: -0.5005 },
    start: "2026-07-15",
    end: "2026-07-19",
    datesConfirmed: false,
    official: "https://www.fetesmadeleine.fr",
    vibe: "La grande semaine landaise, arenes du Plumacon.",
    bracelets:
      "Entree libre, spectacles des arenes du Plumacon payants : billetterie sur fetesmadeleine.fr.",
    shuttles:
      "Navettes de nuit et parkings relais mis en place par Mont-de-Marsan Agglo pendant la Madeleine.",
    accent: "#C8102E",
    program: classicProgram("23h00"),
  },
  {
    id: "orthez",
    name: "Fetes d'Orthez",
    city: "Orthez",
    area: "Bearn",
    center: { lat: 43.4886, lng: -0.7713 },
    start: "2026-07-24",
    end: "2026-07-26",
    datesConfirmed: false,
    official: "https://www.mairie-orthez.fr",
    vibe: "Le Bearn en jaune et rouge, ambiance familiale et penas.",
    accent: "#E0A800",
    program: classicProgram(),
  },
  {
    id: "hagetmau",
    name: "Fetes d'Hagetmau",
    city: "Hagetmau",
    area: "Landes",
    center: { lat: 43.6547, lng: -0.5928 },
    start: "2026-08-05",
    end: "2026-08-09",
    datesConfirmed: false,
    official: "https://www.hagetmau.fr",
    vibe: "Reputees comme les fetes les plus folles des Landes.",
    accent: "#C8102E",
    program: classicProgram(),
  },
  {
    id: "dax",
    name: "Fetes de Dax",
    city: "Dax",
    area: "Landes",
    center: { lat: 43.7089, lng: -1.0541 },
    start: "2026-08-12",
    end: "2026-08-16",
    datesConfirmed: false,
    official: "https://www.fetesdedax.fr",
    vibe: "Six jours de folie autour du 15 aout, la reine des Landes.",
    bracelets:
      "Entree libre, mais certaines arenes et concerts sont payants : billetterie sur fetesdedax.fr et aux guichets des arenes.",
    shuttles:
      "Navettes gratuites depuis les parkings peripheriques, renforts de bus regionaux les soirs de fete. Details sur le site officiel.",
    accent: "#C8102E",
    program: classicProgram("23h00"),
  },
  {
    id: "parentis",
    name: "Fetes de Parentis",
    city: "Parentis-en-Born",
    area: "Landes",
    center: { lat: 44.3519, lng: -1.0705 },
    start: "2026-08-13",
    end: "2026-08-16",
    datesConfirmed: false,
    official: "https://www.parentis.com",
    vibe: "La feria du lac, entre pinede et bodegas.",
    accent: "#C8102E",
    program: classicProgram(),
  },
  {
    id: "beziers",
    name: "Feria de Beziers",
    city: "Beziers",
    area: "Bonus Occitanie",
    center: { lat: 43.3442, lng: 3.2158 },
    start: "2026-08-13",
    end: "2026-08-16",
    datesConfirmed: false,
    official: "https://www.beziers-mediterranee.com",
    vibe: "Un million de festayres autour du 15 aout.",
    accent: "#B3261E",
    program: classicProgram(),
  },
];

/** Statut temporel d'une feria par rapport a "maintenant". */
export type FeriaStatus = "live" | "upcoming" | "past";

/**
 * Determine si une feria est en cours, a venir ou terminee.
 * Le jour de cloture compte comme "en cours" jusqu'a minuit :
 * personne ne rentre chez soi avant la fin du feu d'artifice.
 */
export function feriaStatus(feria: Feria, now: Date = new Date()): FeriaStatus {
  const start = new Date(`${feria.start}T00:00:00`);
  const endExclusive = new Date(`${feria.end}T23:59:59`);
  if (now < start) return "upcoming";
  if (now > endExclusive) return "past";
  return "live";
}

/** Nombre de jours entiers avant l'ouverture (0 si commencee/passee). */
export function daysUntil(feria: Feria, now: Date = new Date()): number {
  const start = new Date(`${feria.start}T00:00:00`);
  const diff = start.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

/** Format d'affichage des dates : "8 au 12 juillet 2026". */
export function formatDates(feria: Feria): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
  const start = new Date(`${feria.start}T12:00:00`);
  const end = new Date(`${feria.end}T12:00:00`);
  const year = end.getFullYear();
  return `${fmt.format(start).split(" ")[0]} au ${fmt.format(end)} ${year}`;
}

/** Recherche par slug, utilisee par la route /feria/[id]. */
export function getFeria(id: string): Feria | undefined {
  return FERIAS.find((f) => f.id === id);
}
