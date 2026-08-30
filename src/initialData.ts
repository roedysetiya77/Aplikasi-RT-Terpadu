import { 
  Petugas, 
  Warga, 
  JadwalMingguan, 
  JimpitanRecord, 
  ArisanPeserta, 
  ArisanSetoran, 
  ArisanPemenang, 
  ArisanConfig,
  KeuanganRecord,
  TutupBukuRecord,
  DaruratRecord,
  WalkieTalkieRecord
} from './types';

export const INITIAL_PETUGAS: Petugas[] = [
  { id: 'p-admin', username: 'admin', password: 'admin123', nama: 'Administrator RT' },
  { id: 'p-bendahara', username: 'bendahara', password: 'bendahara123', nama: 'Dewi Lestari (Bendahara RT)', role: 'admin_bendahara' },
  { id: 'p-arisan', username: 'arisan', password: 'arisan123', nama: 'Siti Aminah (Pengelola Arisan)', role: 'admin_arisan' },
  { id: 'p-1', username: 'budi', password: 'petugas123', nama: 'Budi Santoso', role: 'petugas' },
  { id: 'p-2', username: 'ani', password: 'petugas123', nama: 'Ani Rahayu', role: 'petugas' },
  { id: 'p-3', username: 'joko', password: 'petugas123', nama: 'Joko Widodo', role: 'petugas' },
];

export const INITIAL_WARGA: Warga[] = [
  { id: 'w-1', namaKK: 'Ahmad Subarjo', noKK: '3301010101010001' },
  { id: 'w-2', namaKK: 'Slamet Riyadi', noKK: '3301010101010002' },
  { id: 'w-3', namaKK: 'Supardi Purwanto', noKK: '3301010101010003' },
  { id: 'w-4', namaKK: 'Kusnan Sugeng', noKK: '3301010101010004' },
  { id: 'w-5', namaKK: 'Rudi Hartono', noKK: '3301010101010005' },
  { id: 'w-6', namaKK: 'Bambang Triyono', noKK: '3301010101010006' },
  { id: 'w-7', namaKK: 'Eko Prasetyo', noKK: '3301010101010007' },
  { id: 'w-8', namaKK: 'Heri Susanto', noKK: '3301010101010008' },
  { id: 'w-9', namaKK: 'Dwi Cahyono', noKK: '3301010101010009' },
  { id: 'w-10', namaKK: 'Yudi Murtono', noKK: '3301010101010010' },
];

export const INITIAL_JADWAL: JadwalMingguan[] = [
  { id: 'j-1', hari: 'Senin', petugasId: 'p-1' },
  { id: 'j-2', hari: 'Selasa', petugasId: 'p-2' },
  { id: 'j-3', hari: 'Rabu', petugasId: 'p-3' },
  { id: 'j-4', hari: 'Kamis', petugasId: 'p-1' },
  { id: 'j-5', hari: 'Jumat', petugasId: 'p-2' },
  { id: 'j-6', hari: 'Sabtu', petugasId: 'p-3' },
  { id: 'j-7', hari: 'Minggu', petugasId: 'p-1' },
];

export const INITIAL_ARISAN_CONFIG: ArisanConfig = {
  namaArisan: 'Arisan Warga RT 01',
  nominalIuran: 50000,
  tanggalPengocokan: 'Tanggal 15 Setiap Bulan',
  periodeBerjalan: 2,
  status: 'aktif'
};

export const INITIAL_ARISAN_PESERTA: ArisanPeserta[] = [
  { id: 'ap-1', wargaId: 'w-1', namaPeserta: 'Ahmad Subarjo', noKK: '3301010101010001', nomorUrut: 1, tanggalGabung: '2026-07-01', sudahMenang: true, menangPeriodeKe: 1, tanggalMenang: '2026-07-15' },
  { id: 'ap-2', wargaId: 'w-2', namaPeserta: 'Slamet Riyadi', noKK: '3301010101010002', nomorUrut: 2, tanggalGabung: '2026-07-01', sudahMenang: false },
  { id: 'ap-3', wargaId: 'w-3', namaPeserta: 'Supardi Purwanto', noKK: '3301010101010003', nomorUrut: 3, tanggalGabung: '2026-07-01', sudahMenang: false },
  { id: 'ap-4', wargaId: 'w-4', namaPeserta: 'Kusnan Sugeng', noKK: '3301010101010004', nomorUrut: 4, tanggalGabung: '2026-07-01', sudahMenang: false },
  { id: 'ap-5', wargaId: 'w-5', namaPeserta: 'Rudi Hartono', noKK: '3301010101010005', nomorUrut: 5, tanggalGabung: '2026-07-01', sudahMenang: false },
  { id: 'ap-6', wargaId: 'w-6', namaPeserta: 'Bambang Triyono', noKK: '3301010101010006', nomorUrut: 6, tanggalGabung: '2026-07-01', sudahMenang: false },
  { id: 'ap-7', wargaId: 'w-7', namaPeserta: 'Eko Prasetyo', noKK: '3301010101010007', nomorUrut: 7, tanggalGabung: '2026-07-01', sudahMenang: false },
  { id: 'ap-8', wargaId: 'w-8', namaPeserta: 'Heri Susanto', noKK: '3301010101010008', nomorUrut: 8, tanggalGabung: '2026-07-01', sudahMenang: false },
];

export const INITIAL_ARISAN_PEMENANG: ArisanPemenang[] = [
  {
    id: 'aw-1',
    periodeKe: 1,
    tanggalKocok: '2026-07-15',
    pesertaId: 'ap-1',
    namaPeserta: 'Ahmad Subarjo',
    noKK: '3301010101010001',
    totalHadiah: 400000,
    bulan: 'Juli 2026',
    catatan: 'Pengocokan putaran pertama berjalan lancar'
  }
];

export const INITIAL_ARISAN_SETORAN: ArisanSetoran[] = [
  // Periode 1 (Juli 2026) - All paid
  { id: 'as-1', pesertaId: 'ap-1', namaPeserta: 'Ahmad Subarjo', noKK: '3301010101010001', bulan: '2026-07', periodeKe: 1, jumlah: 50000, tanggalBayar: '2026-07-10', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-2', pesertaId: 'ap-2', namaPeserta: 'Slamet Riyadi', noKK: '3301010101010002', bulan: '2026-07', periodeKe: 1, jumlah: 50000, tanggalBayar: '2026-07-11', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-3', pesertaId: 'ap-3', namaPeserta: 'Supardi Purwanto', noKK: '3301010101010003', bulan: '2026-07', periodeKe: 1, jumlah: 50000, tanggalBayar: '2026-07-12', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-4', pesertaId: 'ap-4', namaPeserta: 'Kusnan Sugeng', noKK: '3301010101010004', bulan: '2026-07', periodeKe: 1, jumlah: 50000, tanggalBayar: '2026-07-12', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-5', pesertaId: 'ap-5', namaPeserta: 'Rudi Hartono', noKK: '3301010101010005', bulan: '2026-07', periodeKe: 1, jumlah: 50000, tanggalBayar: '2026-07-14', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-6', pesertaId: 'ap-6', namaPeserta: 'Bambang Triyono', noKK: '3301010101010006', bulan: '2026-07', periodeKe: 1, jumlah: 50000, tanggalBayar: '2026-07-14', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-7', pesertaId: 'ap-7', namaPeserta: 'Eko Prasetyo', noKK: '3301010101010007', bulan: '2026-07', periodeKe: 1, jumlah: 50000, tanggalBayar: '2026-07-15', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-8', pesertaId: 'ap-8', namaPeserta: 'Heri Susanto', noKK: '3301010101010008', bulan: '2026-07', periodeKe: 1, jumlah: 50000, tanggalBayar: '2026-07-15', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  // Periode 2 (Agustus 2026)
  { id: 'as-9', pesertaId: 'ap-1', namaPeserta: 'Ahmad Subarjo', noKK: '3301010101010001', bulan: '2026-08', periodeKe: 2, jumlah: 50000, tanggalBayar: '2026-08-10', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-10', pesertaId: 'ap-2', namaPeserta: 'Slamet Riyadi', noKK: '3301010101010002', bulan: '2026-08', periodeKe: 2, jumlah: 50000, tanggalBayar: '2026-08-12', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
  { id: 'as-11', pesertaId: 'ap-3', namaPeserta: 'Supardi Purwanto', noKK: '3301010101010003', bulan: '2026-08', periodeKe: 2, jumlah: 50000, tanggalBayar: '2026-08-13', status: 'lunas', dicatatOleh: 'Dewi Lestari (Bendahara RT)' },
];

export const KATEGORI_PEMASUKAN_DEFAULT = [
  'Setoran Jimpitan',
  'Dana Bantuan',
  'Sumbangan dari Warga',
  'Iuran Sampah & Kebersihan',
  'Iuran Keamanan',
  'Saldo Awal Bulan',
  'Lain-lain'
];

export const KATEGORI_PENGELUARAN_DEFAULT = [
  'Biaya Konsumsi',
  'Dana Sosial',
  'Biaya Resepsi',
  'Biaya Lomba',
  'Pemeliharaan Fasilitas & Pos Ronda',
  'Operasional & ATK RT',
  'Lain-lain'
];

// Initial Keuangan Transactions (Buku Kas RT)
export const INITIAL_KEUANGAN: KeuanganRecord[] = [
  // Juli 2026 (Bulan Lalu)
  {
    id: 'k-1',
    tanggal: '2026-07-01',
    jenis: 'pemasukan',
    kategori: 'Saldo Awal Bulan',
    keterangan: 'Saldo Awal Kas RT Bulan Juli 2026',
    debit: 2500000,
    kredit: 0,
    saldo: 2500000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    isTutupBuku: false,
    bulanBuku: '2026-07'
  },
  {
    id: 'k-2',
    tanggal: '2026-07-10',
    jenis: 'pemasukan',
    kategori: 'Setoran Jimpitan',
    keterangan: 'Rekap Setoran Jimpitan Ronda Periode 1-10 Juli 2026',
    debit: 320000,
    kredit: 0,
    saldo: 2820000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-07'
  },
  {
    id: 'k-3',
    tanggal: '2026-07-15',
    jenis: 'pemasukan',
    kategori: 'Sumbangan dari Warga',
    keterangan: 'Donasi sukarela warga donatur untuk Kas RT',
    debit: 500000,
    kredit: 0,
    saldo: 3320000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-07'
  },
  {
    id: 'k-4',
    tanggal: '2026-07-18',
    jenis: 'pengeluaran',
    kategori: 'Biaya Konsumsi',
    keterangan: 'Snack & konsumsi rapat bulanan warga pengurus RT',
    debit: 0,
    kredit: 150000,
    saldo: 3170000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-07'
  },
  {
    id: 'k-5',
    tanggal: '2026-07-22',
    jenis: 'pengeluaran',
    kategori: 'Dana Sosial',
    keterangan: 'Santunan warga rawat inap di RSUD',
    debit: 0,
    kredit: 300000,
    saldo: 2870000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-07'
  },
  {
    id: 'k-6',
    tanggal: '2026-07-28',
    jenis: 'pemasukan',
    kategori: 'Setoran Jimpitan',
    keterangan: 'Rekap Setoran Jimpitan Ronda Periode 11-28 Juli 2026',
    debit: 320000,
    kredit: 0,
    saldo: 3190000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-07'
  },
  
  // Agustus 2026 (Bulan Berjalan) - Hasil Tutup Buku Juli masuk sebagai Saldo Awal Agustus!
  {
    id: 'k-7',
    tanggal: '2026-08-01',
    jenis: 'pemasukan',
    kategori: 'Saldo Awal Bulan',
    keterangan: 'Saldo Awal Pindahan dari Tutup Buku Juli 2026',
    debit: 3190000,
    kredit: 0,
    saldo: 3190000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    isTutupBuku: true,
    bulanBuku: '2026-08'
  },
  {
    id: 'k-8',
    tanggal: '2026-08-05',
    jenis: 'pemasukan',
    kategori: 'Dana Bantuan',
    keterangan: 'Dana Pembinaan & Hibah dari Kelurahan',
    debit: 1500000,
    kredit: 0,
    saldo: 4690000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-08'
  },
  {
    id: 'k-9',
    tanggal: '2026-08-10',
    jenis: 'pemasukan',
    kategori: 'Setoran Jimpitan',
    keterangan: 'Penyetoran Jimpitan Ronda Periode Awal Agustus',
    debit: 280000,
    kredit: 0,
    saldo: 4970000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-08'
  },
  {
    id: 'k-10',
    tanggal: '2026-08-14',
    jenis: 'pengeluaran',
    kategori: 'Biaya Lomba',
    keterangan: 'Pembelian hadiah & perlengkapan lomba anak-anak 17 Agustus',
    debit: 0,
    kredit: 850000,
    saldo: 4120000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-08'
  },
  {
    id: 'k-11',
    tanggal: '2026-08-16',
    jenis: 'pengeluaran',
    kategori: 'Biaya Resepsi',
    keterangan: 'Sewa tratak, sound system, & tumpeng Malam Tirakatan Kemerdekaan',
    debit: 0,
    kredit: 650000,
    saldo: 3470000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-08'
  },
  {
    id: 'k-12',
    tanggal: '2026-08-20',
    jenis: 'pemasukan',
    kategori: 'Sumbangan dari Warga',
    keterangan: 'Donasi warga untuk kegiatan HUT RI',
    debit: 600000,
    kredit: 0,
    saldo: 4070000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-08'
  },
  {
    id: 'k-13',
    tanggal: '2026-08-25',
    jenis: 'pengeluaran',
    kategori: 'Pemeliharaan Fasilitas & Pos Ronda',
    keterangan: 'Perbaikan lampu jalan RT dan cat pos ronda',
    debit: 0,
    kredit: 220000,
    saldo: 3850000,
    dicatatOleh: 'Dewi Lestari (Bendahara RT)',
    bulanBuku: '2026-08'
  }
];

export const INITIAL_TUTUP_BUKU: TutupBukuRecord[] = [
  {
    id: 'tb-2026-07',
    bulanBuku: '2026-07',
    tanggalTutup: '2026-07-31',
    saldoAwal: 2500000,
    totalPemasukan: 1140000, // 320k + 500k + 320k
    totalPengeluaran: 450000, // 150k + 300k
    saldoAkhir: 3190000,
    ditutupOleh: 'Dewi Lestari (Bendahara RT)',
    catatan: 'Tutup buku kas bulanan Juli 2026 selesai dan saldo dialihkan ke Saldo Awal Agustus 2026.'
  }
];

// Helper to normalize any date input (ISO string, date object, UTC timestamp) into clean 'YYYY-MM-DD'
export const normalizeDateString = (val: string | Date | undefined | null): string => {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const yr = val.getFullYear();
    const mo = String(val.getMonth() + 1).padStart(2, '0');
    const da = String(val.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }
  const str = String(val).trim();
  if (!str) return '';

  // If it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // If format YYYY/MM/DD or YYYY.MM.DD
  if (/^\d{4}[/.]\d{1,2}[/.]\d{1,2}$/.test(str)) {
    const parts = str.split(/[/.]/);
    const yr = parts[0];
    const mo = parts[1].padStart(2, '0');
    const da = parts[2].padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }

  // If it contains ISO timestamp like "2026-08-29T17:00:00.000Z" or similar
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    }
    // Fallback: take substring before T
    return str.split('T')[0];
  }

  // If format DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  if (/^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(str)) {
    const parts = str.split(/[/.-]/);
    const da = parts[0].padStart(2, '0');
    const mo = parts[1].padStart(2, '0');
    const yr = parts[2];
    return `${yr}-${mo}-${da}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }

  return str.substring(0, 10);
};

// Helper to normalize month string into clean 'YYYY-MM'
export const normalizeMonthString = (val: string | Date | undefined | null): string => {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const yr = val.getFullYear();
    const mo = String(val.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mo}`;
  }
  const str = String(val).trim();
  if (!str || str === 'all') return str;

  if (/^\d{4}-\d{2}$/.test(str)) return str;
  if (/^\d{4}[/.]\d{1,2}$/.test(str)) {
    const parts = str.split(/[/.]/);
    return `${parts[0]}-${parts[1].padStart(2, '0')}`;
  }
  if (/^\d{1,2}[/.-]\d{4}$/.test(str)) {
    const parts = str.split(/[/.-]/);
    return `${parts[1]}-${parts[0].padStart(2, '0')}`;
  }
  const cleanDate = normalizeDateString(val);
  if (cleanDate && cleanDate.length >= 7) {
    return cleanDate.substring(0, 7);
  }
  return str.substring(0, 7);
};

// Format date into clean Indonesian format, e.g. "30 Agustus 2026"
export const formatTanggalIndo = (val: string | Date | undefined | null, formatType: 'full' | 'short' | 'with-day' = 'full'): string => {
  if (!val) return '-';
  const cleanYMD = normalizeDateString(val);
  if (!cleanYMD || !cleanYMD.includes('-')) return String(val).split('T')[0] || '-';

  const [yearStr, monthStr, dayStr] = cleanYMD.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return cleanYMD;
  }

  const bulanIndoFull = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const bulanIndoShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const hariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const monthName = formatType === 'short' 
    ? (bulanIndoShort[month - 1] || monthStr)
    : (bulanIndoFull[month - 1] || monthStr);

  if (formatType === 'with-day') {
    const d = new Date(year, month - 1, day);
    const dayName = hariIndo[d.getDay()] || '';
    return `${dayName}, ${day} ${monthName} ${year}`;
  }

  return `${day} ${monthName} ${year}`;
};

// Format month into Indonesian format, e.g. "2026-08" -> "Agustus 2026"
export const formatBulanIndo = (bulanStr: string | undefined | null): string => {
  if (!bulanStr || bulanStr === 'all') return 'Semua Periode';
  const cleanStr = normalizeMonthString(bulanStr);
  if (!cleanStr.includes('-')) return cleanStr;
  
  const [y, m] = cleanStr.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthIndex = parseInt(m, 10) - 1;
  const monthName = months[monthIndex] || m;
  return `${monthName} ${y}`;
};

// Helper to recalculate running balance across all records sorted by date
export const recalculateSaldo = (records: KeuanganRecord[]): KeuanganRecord[] => {
  const sorted = [...records].sort((a, b) => {
    const dateA = normalizeDateString(a.tanggal);
    const dateB = normalizeDateString(b.tanggal);
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    // If same date, opening balance comes first
    if (a.isTutupBuku || a.kategori === 'Saldo Awal Bulan' || a.kategori?.toLowerCase().includes('saldo awal')) return -1;
    if (b.isTutupBuku || b.kategori === 'Saldo Awal Bulan' || b.kategori?.toLowerCase().includes('saldo awal')) return 1;
    return a.id.localeCompare(b.id);
  });

  let currentSaldo = 0;
  return sorted.map((rec) => {
    const cleanTanggal = normalizeDateString(rec.tanggal);
    const cleanBulan = normalizeMonthString(rec.bulanBuku || cleanTanggal);
    const debit = typeof rec.debit === 'string' ? Number(String(rec.debit).replace(/[^0-9.-]/g, '')) || 0 : Number(rec.debit) || 0;
    const kredit = typeof rec.kredit === 'string' ? Number(String(rec.kredit).replace(/[^0-9.-]/g, '')) || 0 : Number(rec.kredit) || 0;
    
    let jenis: 'pemasukan' | 'pengeluaran' = 'pemasukan';
    const rawJenis = String(rec.jenis || '').toLowerCase().trim();
    if (rawJenis === 'pengeluaran' || (kredit > 0 && debit === 0)) {
      jenis = 'pengeluaran';
    } else {
      jenis = 'pemasukan';
    }

    const isOpening = rec.isTutupBuku || rec.kategori === 'Saldo Awal Bulan' || String(rec.kategori || '').toLowerCase().includes('saldo awal');

    if (isOpening) {
      currentSaldo = debit - kredit;
    } else {
      currentSaldo = currentSaldo + debit - kredit;
    }

    return {
      ...rec,
      tanggal: cleanTanggal,
      bulanBuku: cleanBulan,
      jenis,
      kategori: rec.kategori || (jenis === 'pemasukan' ? 'Lain-lain Pemasukan' : 'Lain-lain Pengeluaran'),
      debit,
      kredit,
      saldo: currentSaldo
    };
  });
};

// Generate some sample jimpitan records for the last couple of months
export const getInitialJimpitan = (): JimpitanRecord[] => {
  const list: JimpitanRecord[] = [];
  const currentDate = new Date();
  
  // Create transactions for this month and last month
  const monthsOffset = [0, -1]; 
  let recordId = 1;

  monthsOffset.forEach(offset => {
    const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 15);
    const year = targetMonth.getFullYear();
    const month = String(targetMonth.getMonth() + 1).padStart(2, '0');
    
    // Pick weekly collection days for each warga
    INITIAL_WARGA.forEach((warga, wIdx) => {
      const days = [5, 12, 19, 26];
      days.forEach((day, dIdx) => {
        const dayStr = String(day).padStart(2, '0');
        const tanggal = `${year}-${month}-${dayStr}`;
        
        const petugasList = [INITIAL_PETUGAS[3], INITIAL_PETUGAS[4], INITIAL_PETUGAS[5]];
        const petugas = petugasList[(wIdx + dIdx) % petugasList.length] || INITIAL_PETUGAS[0];
        
        list.push({
          id: `t-${recordId++}`,
          tanggal,
          namaWarga: warga.namaKK,
          noKK: warga.noKK,
          jumlah: 2000, // Standard Rp 2.000 jimpitan
          namaPetugas: petugas.nama
        });
      });
    });
  });

  return list;
};

export const INITIAL_DARURAT: DaruratRecord[] = [
  {
    id: 'd-1',
    tanggal: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    kategori: 'Pencurian',
    namaPelapor: 'Ahmad Subarjo',
    noKK: '3301010101010001',
    lokasi: 'Rumah Bpk Ahmad Subarjo (RT 04 / RW 02)',
    latitude: -6.175392,
    longitude: 106.827153,
    mapUrl: 'https://maps.google.com/?q=-6.175392,106.827153',
    keterangan: 'Mencurigakan ada sepeda motor hilang di depan pagar pukul 02:00 WIB',
    status: 'SELESAI',
    ditanganiOleh: 'Budi Santoso (Petugas Ronda)',
    waktuSelesai: new Date(Date.now() - 3600000 * 24 * 3 + 1800000).toISOString()
  }
];

export const INITIAL_WALKIE_TALKIE: WalkieTalkieRecord[] = [
  {
    id: 'wt-1',
    tanggal: new Date(Date.now() - 3600000 * 2).toISOString(),
    namaPengirim: 'Budi Santoso (Petugas)',
    rolePengirim: 'Petugas Ronda',
    audioData: '', // empty or sample placeholder
    durasiDetik: 4
  }
];

