import { RecitationEvent, RecitationTimingStats } from "./types";

/**
 * Minimum and maximum bounds for a valid recitation interval in seconds
 * Any gap larger than 300 seconds (5 minutes) indicates a pause/break,
 * and shouldn't artificially inflate the pace estimate.
 */
const MIN_VALID_DURATION_SECONDS = 3;
const MAX_VALID_DURATION_SECONDS = 300;

/**
 * Format seconds into a friendly human-readable duration (e.g. "1m 24s", "45s")
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);

  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/**
 * Calculate average recitation duration and estimated time to complete 33 recitations
 */
export function calculateRecitationStats(
  events: RecitationEvent[],
  currentCount: number,
  targetCount = 33
): RecitationTimingStats {
  const remainingCount = Math.max(0, targetCount - currentCount);

  // Filter valid durations from events, sorting by most recent first
  const validDurations = events
    .filter(
      (e) =>
        e.duration_seconds >= MIN_VALID_DURATION_SECONDS &&
        e.duration_seconds <= MAX_VALID_DURATION_SECONDS
    )
    .map((e) => e.duration_seconds);

  // Take the 5 most recent valid recitation intervals
  const recentValid = validDurations.slice(-5);

  if (recentValid.length < 2) {
    return {
      averageDurationSeconds: 0,
      estimatedRemainingSeconds: 0,
      formattedAverage: "Calculating...",
      formattedRemaining: remainingCount === 0 ? "Complete" : "Calculating after 2+ recitations",
      hasEnoughData: false,
    };
  }

  const sum = recentValid.reduce((acc, curr) => acc + curr, 0);
  const avg = Math.round(sum / recentValid.length);
  const estimatedRemaining = remainingCount * avg;

  return {
    averageDurationSeconds: avg,
    estimatedRemainingSeconds: estimatedRemaining,
    formattedAverage: `${avg}s per swalath`,
    formattedRemaining:
      remainingCount === 0 ? "Completed Alhamdulillah" : `~${formatDuration(estimatedRemaining)} remaining`,
    hasEnoughData: true,
  };
}

/**
 * Standard canonical wording for Nariyal Swalath (Swalathun Nariyya / Tafrijiyya)
 * Configurable via site_settings or UI options
 */
export const DEFAULT_NARIYAL_SWALATH_TEXT =
  "اللَّهُمَّ صَلِّ صَلاَةً كَامِلَةً وَسَلِّمْ سَلاَمًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ وَتَنْفَرِجُ بِهِ الْكُرَبُ وَتُقْضَى بِهِ الْحَوَائِجُ وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِيمِ وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ وَعَلَى آلِهِ وَصَحْبِهِ فِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ";

/**
 * Sequential A-to-Z lines for classical rhythmic recitation of Nariyal Swalath
 * with dedicated line-by-line low-opacity fill progression.
 */
export const NARIYAL_SWALATH_LINES = [
  {
    id: 1,
    label: "Line 1",
    arabic: "اللَّهُمَّ صَلِّ صَلاَةً كَامِلَةً وَسَلِّمْ سَلاَمًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ",
    transliteration: "Allāhumma ṣalli ṣalātan kāmilatan wa sallim salāman tāmman ‘alā sayyidinā Muḥammad",
  },
  {
    id: 2,
    label: "Line 2",
    arabic: "الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ وَتَنْفَرِجُ بِهِ الْكُرَبُ",
    transliteration: "Alladhī tanḥallu bihil-‘uqad wa tanfariju bihil-kurab",
  },
  {
    id: 3,
    label: "Line 3",
    arabic: "وَتُقْضَى بِهِ الْحَوَائِجُ وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِيمِ",
    transliteration: "Wa tuqḍā bihil-ḥawā’ij wa tunālu bihir-raghā’ib wa ḥusnul-khawātīm",
  },
  {
    id: 4,
    label: "Line 4",
    arabic: "وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ",
    transliteration: "Wa yustasqal-ghamāmu biwajhihil-karīm",
  },
  {
    id: 5,
    label: "Line 5",
    arabic: "وَعَلَى آلِهِ وَصَحْبِهِ فِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ",
    transliteration: "Wa ‘alā ālihī wa ṣaḥbihī fī kulli lamḥatin wa nafasin bi-‘adadi kulli ma‘lūmin lak",
  },
];

export const DEFAULT_NARIYAL_SWALATH_TRANSLITERATION =
  "Allahumma salli salaatan kaamilatan wa sallim salaaman taamman 'ala sayyidina Muhammadinilladhi tanhallu bihil 'uqad, wa tanfariju bihil kurab, wa tuqda bihil hawaa'ij, wa tunaalu bihir raghaa'ib, wa husnul khawaateem, wa yustasqal ghamaamu biwajhihil kareem, wa 'ala aalihi wa sahbihi fee kulli lamhatin wa nafasin bi'adadi kulli ma'loomin lak.";

export const DEFAULT_NARIYAL_SWALATH_MEANING =
  "O Allah! Bestow complete blessings and perfect peace upon our Master Muhammad, by whom knots are untied, hardships are removed, needs are fulfilled, desires and good endings are attained, and rain clouds are sought through his noble countenance; and upon his family and companions in every glance and breath, by the number of all that is known to You.";

// Canonical aliases for Nariath Swalath
export const DEFAULT_NARIATH_SWALATH_TEXT = DEFAULT_NARIYAL_SWALATH_TEXT;
export const NARIATH_SWALATH_LINES = NARIYAL_SWALATH_LINES;
export const DEFAULT_NARIATH_SWALATH_TRANSLITERATION = DEFAULT_NARIYAL_SWALATH_TRANSLITERATION;
export const DEFAULT_NARIATH_SWALATH_MEANING = DEFAULT_NARIYAL_SWALATH_MEANING;
