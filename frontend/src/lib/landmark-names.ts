/** 33 landmark MediaPipe Pose (BlazePose) dengan nama Indonesia, hanya label pilihan; bukan klaim biomekanik. */
export const POSE_LANDMARK_NAMES: readonly string[] = [
  "Hidung", "Mata kiri (dalam)", "Mata kiri", "Mata kiri (luar)", "Mata kanan (dalam)", "Mata kanan", "Mata kanan (luar)",
  "Telinga kiri", "Telinga kanan", "Mulut kiri", "Mulut kanan", "Bahu kiri", "Bahu kanan", "Siku kiri", "Siku kanan",
  "Pergelangan tangan kiri", "Pergelangan tangan kanan", "Kelingking kiri", "Kelingking kanan", "Telunjuk kiri", "Telunjuk kanan",
  "Jempol kiri", "Jempol kanan", "Pinggul kiri", "Pinggul kanan", "Lutut kiri", "Lutut kanan", "Pergelangan kaki kiri",
  "Pergelangan kaki kanan", "Tumit kiri", "Tumit kanan", "Ujung kaki kiri", "Ujung kaki kanan",
];
/** Kelompok landmark tubuh utama untuk pemilihan cepat. */
export const LANDMARK_GROUPS: { label: string; ids: number[] }[] = [
  { label: "Kepala", ids: [0, 7, 8] }, { label: "Bahu & lengan", ids: [11, 12, 13, 14, 15, 16] },
  { label: "Tangan", ids: [17, 18, 19, 20, 21, 22] }, { label: "Pinggul & tungkai", ids: [23, 24, 25, 26, 27, 28] },
  { label: "Kaki", ids: [29, 30, 31, 32] },
];
