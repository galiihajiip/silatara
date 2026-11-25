/**
 * Rapikan tanda pisah panjang (em dash U+2014) pada teks yang datang dari data/API
 * menjadi tanda baca Indonesia yang wajar. Isi dan fakta teks tidak diubah.
 *
 * - `sep` default ", " untuk kalimat; pakai ": " untuk label judul ("Silat Beksi: 12 jurus dasar").
 */
export function cleanDashes(text: string | null | undefined, sep: ", " | ": " = ", "): string {
  if (!text) return "";
  return text
    .replace(/\s*[\u2014\u2015]\s*/g, sep)
    .replace(/^[,:]\s*|\s*[,:]\s*$/g, "")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}
