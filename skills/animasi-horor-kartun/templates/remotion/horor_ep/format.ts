// Format video episode ini. YouTube panjang: 1920 x 1080. Shorts / Instagram Reels / TikTok: 1080 x 1920 (potret).
// Semua ukuran piksel lain (garis tinta, blur lensa, bloom, kartu tokoh) mengikuti sisi terpendek, jadi cukup ganti di sini
// lalu daftarkan Composition dengan width={W} height={H}. Mode potret otomatis menampilkan caption per kata (CAPTION).
export const W = 1920;
export const H = 1080;
export const POTRET = H > W;
/** caption per kata di video: wajib di potret (banyak penonton tanpa suara), opsional di 16:9 */
export const CAPTION = POTRET;
