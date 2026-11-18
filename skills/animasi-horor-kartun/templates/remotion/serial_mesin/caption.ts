/** Pemotong caption bahasa Indonesia (murni, tanpa React — bisa diuji dengan node).
 *
 *  Masalah lama: frasa dipotong tiap 3 kata, jadi nama & tanggal terbelah ("TAPI UPACARA EKA" | "DASA RUDRA TETAP").
 *  Sekarang: kata dulu dilekatkan jadi UNIT makna, lalu unit dikemas ke halaman.
 *   - kata depan/sambung melekat ke kata sesudahnya (di, ke, dari, yang, dan, untuk, ...)
 *   - "ini/itu/pun/lah/tersebut" melekat ke kata sebelumnya
 *   - deret angka/bulan melekat ("tujuh belas Maret", "seribu sembilan ratus")
 *   - deret kata berhuruf besar (nama) melekat ("Eka Dasa Rudra", "Pura Besakih")
 *   - halaman: maks 3 kata / 22 huruf (unit utuh boleh sampai 4 kata / 24 huruf), selalu putus sesudah tanda baca
 *  Kata kunci (diwarnai kuning tetap): angka, bulan, nama diri, dan daftar `kunci` per episode.
 */
export type Kata = [string, number, number];

const LEKAT_KANAN = new Set(["di", "ke", "dari", "pada", "dan", "yang", "untuk", "dengan", "oleh", "tapi", "atau", "para", "sang", "si", "sebuah",
  "seorang", "sebagai", "bagi", "akan", "sudah", "telah", "belum", "tidak", "tak", "bukan", "jangan", "masih", "sedang", "agar", "supaya", "karena",
  "saat", "ketika", "makin", "semakin", "hanya", "baru", "pernah", "bisa", "harus", "ingin", "mau", "lalu", "kemudian", "sehari", "sebelum", "sesudah", "setelah", "sejak", "hingga", "sampai", "tanpa", "dalam", "antara", "tepat", "lebih", "paling", "sangat", "begitu", "seperti", "kalau", "jika",
  "the", "a", "of", "to", "in"]);
const LEKAT_KIRI = new Set(["ini", "itu", "pun", "lah", "tersebut", "saja", "juga", "lagi", "sana", "sini"]);
/** kata majemuk yang tidak boleh dipisah (kata pertama -> awalan kata kedua) */
const MAJEMUK: Record<string, string[]> = { ulang: ["tahun"], kisah: ["nyata"], orang: ["tua"], rumah: ["sakit"], anak: ["muda"], hari: ["ini", "itu", "terakhir"],
  tengah: ["malam"], kepala: ["desa"], gunung: ["api"], buku: ["harian"], catatan: ["harian"] };
const majemuk = (a: string, b: string) => (MAJEMUK[bersih(a).toLowerCase()] ?? []).some((x) => bersih(b).toLowerCase().startsWith(x));
const BULAN = new Set(["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"]);
const ANGKA = new Set(["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas", "belas", "puluh",
  "ratus", "ribu", "juta", "seratus", "seribu", "sejuta", "setengah", "puluhan", "ratusan", "ribuan", "kedua", "ketiga", "pertama"]);

export const bersih = (w: string) => w.replace(/[^0-9A-Za-zÀ-ÿ'-]/g, "");
const ujungBaca = (w: string) => /[.,?!:;…]$/.test(w) || /\.\.\.$/.test(w);
const isAngka = (w: string) => { const b = bersih(w).toLowerCase(); return /^\d/.test(b) || ANGKA.has(b) || BULAN.has(b); };
const isNama = (w: string) => /^[A-Z][a-zà-ÿ]/.test(bersih(w));

/** kata kunci untuk sorotan kuning tetap */
export const isKunci = (w: string, awalKalimat: boolean, kunci: string[] = []) => {
  const b = bersih(w).toLowerCase();
  if (!b) return false;
  if (kunci.some((k) => b === k.toLowerCase() || b.startsWith(k.toLowerCase()))) return true;
  if (/^\d/.test(b) || BULAN.has(b)) return true;
  return isNama(w) && !awalKalimat && !LEKAT_KANAN.has(b);
};

const panjang = (ws: Kata[]) => ws.reduce((n, x) => n + x[0].length, 0) + Math.max(0, ws.length - 1);

/** kata -> unit makna */
export const unitKata = (k: Kata[]): Kata[][] => {
  const out: Kata[][] = [];
  for (let i = 0; i < k.length; i++) {
    const w = k[i], prev = out.length ? out[out.length - 1] : null, pw = prev ? prev[prev.length - 1][0] : "";
    const lekat = prev && !ujungBaca(pw) && (
      LEKAT_KANAN.has(bersih(pw).toLowerCase()) ||
      LEKAT_KIRI.has(bersih(w[0]).toLowerCase()) ||
      (isAngka(pw) && isAngka(w[0])) ||
      (isNama(pw) && isNama(w[0])) ||
      majemuk(pw, w[0]));
    if (lekat && prev!.length < 4 && panjang([...prev!, w]) <= (isNama(pw) && isNama(w[0]) ? 30 : 24)) prev!.push(w);
    else if (prev && prev.length > 1 && majemuk(pw, w[0])) out.push([prev.pop()!, w]);   // majemuk tidak pernah dipisah: pindah bersama
    else out.push([w]);
  }
  return out;
};

/** unit -> halaman caption */
export const halaman = (k: Kata[], maxKata = 3, maxHuruf = 22): Kata[][] => {
  const out: Kata[][] = []; let cur: Kata[] = [];
  for (const u of unitKata(k)) {
    const gab = [...cur, ...u];
    if (cur.length && (gab.length > maxKata || panjang(gab) > maxHuruf)) { out.push(cur); cur = []; }
    cur.push(...u);
    if (ujungBaca(u[u.length - 1][0])) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  // halaman 1 kata yang bukan akhir kalimat digabung ke halaman sebelumnya bila masih muat
  for (let i = out.length - 1; i > 0; i--) {
    const prev = out[i - 1];
    if (out[i].length === 1 && !ujungBaca(prev[prev.length - 1][0]) && prev.length <= 3 && panjang([...prev, ...out[i]]) <= 24) { out[i - 1] = [...prev, ...out[i]]; out.splice(i, 1); }
    // tidak muat: pindahkan kata terakhir halaman sebelumnya supaya kata itu tidak sendirian ("lumpur | panas" -> "| lumpur panas")
    else if (out[i].length === 1 && prev.length >= 3 && !ujungBaca(prev[prev.length - 1][0]) && !(isNama(prev[prev.length - 1][0]) && isNama(prev[prev.length - 2][0]))) out[i] = [prev.pop()!, ...out[i]];
  }
  return out;
};
