export interface Petugas {
  id: string;
  username: string;
  password: string; // password stored plainly or simply for this spreadsheet app
  nama: string;
  role?: 'petugas' | 'admin_arisan' | 'admin_bendahara'; // 'petugas' (Petugas Jimpitan), 'admin_arisan' (Admin Arisan RT), 'admin_bendahara' (Bendahara RT)
}

export interface Warga {
  id: string;
  namaKK: string;
  noKK: string;
}

export interface JadwalMingguan {
  id: string;
  hari: string; // 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  petugasId: string; // ID of Petugas assigned
  namaPetugas?: string; // Cache the name for convenience
}

export interface JimpitanRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  namaWarga: string;
  noKK: string;
  jumlah: number;
  namaPetugas: string;
}

export interface ArisanPeserta {
  id: string;
  wargaId: string;
  namaPeserta: string;
  noKK: string;
  nomorUrut?: number;
  tanggalGabung: string;
  sudahMenang: boolean;
  menangPeriodeKe?: number;
  tanggalMenang?: string;
}

export interface ArisanSetoran {
  id: string;
  pesertaId: string;
  namaPeserta: string;
  noKK: string;
  bulan: string; // e.g. "2026-08"
  periodeKe: number;
  jumlah: number;
  tanggalBayar: string;
  status: 'lunas' | 'belum';
  dicatatOleh: string;
}

export interface ArisanPemenang {
  id: string;
  periodeKe: number;
  tanggalKocok: string;
  pesertaId: string;
  namaPeserta: string;
  noKK: string;
  totalHadiah: number; // nominalIuran * totalPeserta
  bulan: string;
  catatan?: string;
}

export interface ArisanConfig {
  namaArisan: string;
  nominalIuran: number;
  tanggalPengocokan: string; // e.g. "Tanggal 15 Setiap Bulan" or specific date
  periodeBerjalan: number;
  status: 'aktif' | 'selesai';
}

export interface KeuanganRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jenis: 'pemasukan' | 'pengeluaran';
  kategori: string;
  keterangan: string;
  debit: number; // Pemasukan
  kredit: number; // Pengeluaran
  saldo: number; // Saldo kumulatif setelah transaksi
  dicatatOleh?: string;
  isTutupBuku?: boolean; // True if this is an auto-generated opening balance or closing snapshot
  bulanBuku?: string; // YYYY-MM
}

export interface TutupBukuRecord {
  id: string;
  bulanBuku: string; // e.g. "2026-07"
  tanggalTutup: string;
  saldoAwal: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhir: number;
  ditutupOleh: string;
  catatan?: string;
}

export interface DaruratRecord {
  id: string;
  tanggal: string; // ISO format or YYYY-MM-DD HH:mm
  kategori: 'Pencurian' | 'Kebakaran' | 'Kematian' | 'Bencana Alam' | 'Pembunuhan';
  namaPelapor: string;
  noKK?: string;
  lokasi: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  keterangan?: string;
  status: 'AKTIF' | 'SELESAI';
  ditanganiOleh?: string;
  waktuSelesai?: string;
}

export interface WalkieTalkieRecord {
  id: string;
  tanggal: string;
  namaPengirim: string;
  rolePengirim?: string;
  audioData: string; // Base64 audio data URL
  durasiDetik: number;
}

export interface AppData {
  petugas: Petugas[];
  warga: Warga[];
  jadwal: JadwalMingguan[];
  jimpitan: JimpitanRecord[];
  arisanPeserta?: ArisanPeserta[];
  arisanSetoran?: ArisanSetoran[];
  arisanPemenang?: ArisanPemenang[];
  arisanConfig?: ArisanConfig;
  keuangan?: KeuanganRecord[];
  tutupBuku?: TutupBukuRecord[];
  darurat?: DaruratRecord[];
  walkieTalkie?: WalkieTalkieRecord[];
}

export type UserRole = 'admin' | 'admin_bendahara' | 'admin_arisan' | 'petugas' | null;

export interface CurrentUser {
  username: string;
  nama: string;
  role: UserRole;
}


