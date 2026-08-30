import React, { useMemo, useState } from 'react';
import { 
  Petugas, 
  Warga, 
  JadwalMingguan, 
  JimpitanRecord, 
  ArisanPeserta, 
  ArisanPemenang, 
  ArisanConfig, 
  KeuanganRecord,
  TutupBukuRecord,
  CurrentUser 
} from '../types';
import { formatTanggalIndo, normalizeDateString, normalizeMonthString, recalculateSaldo, formatBulanIndo } from '../initialData';
import { 
  TrendingUp, 
  Coins, 
  Calendar, 
  Users, 
  ArrowRight, 
  User, 
  History, 
  Sparkles, 
  Info, 
  Clock,
  Dices,
  Trophy,
  DollarSign,
  Lock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Building2,
  RefreshCw,
  Database
} from 'lucide-react';

interface DashboardPanelProps {
  jimpitan: JimpitanRecord[];
  jadwal: JadwalMingguan[];
  petugas: Petugas[];
  warga: Warga[];
  arisanPeserta?: ArisanPeserta[];
  arisanPemenang?: ArisanPemenang[];
  arisanConfig?: ArisanConfig;
  keuanganList?: KeuanganRecord[];
  tutupBukuList?: TutupBukuRecord[];
  currentUser?: CurrentUser | null;
  webAppUrl?: string;
  isSyncing?: boolean;
  onSyncFetch?: () => void;
  onNavigateToInput: () => void;
  onNavigateToArisan?: () => void;
  onNavigateToKeuangan?: () => void;
}

export default function DashboardPanel({
  jimpitan,
  jadwal,
  petugas,
  warga,
  arisanPeserta = [],
  arisanPemenang = [],
  arisanConfig = {
    namaArisan: 'Arisan Warga RT 01',
    nominalIuran: 50000,
    tanggalPengocokan: 'Tanggal 15 Setiap Bulan',
    periodeBerjalan: 1,
    status: 'aktif'
  },
  keuanganList = [],
  tutupBukuList = [],
  currentUser,
  webAppUrl,
  isSyncing,
  onSyncFetch,
  onNavigateToInput,
  onNavigateToArisan,
  onNavigateToKeuangan
}: DashboardPanelProps) {
  
  // Calculate local year and month
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearMonth = `${year}-${month}`; // e.g., "2026-08"
  const [selectedDashboardBulan, setSelectedDashboardBulan] = useState<string>(currentYearMonth);

  // 1. Calculate Monthly Jimpitan directly from state (normalized)
  const monthlyRecords = useMemo(() => {
    return jimpitan.filter(r => {
      const cleanTgl = normalizeDateString(r.tanggal);
      return cleanTgl.startsWith(currentYearMonth);
    });
  }, [jimpitan, currentYearMonth]);
  
  const totalBulanIni = useMemo(() => {
    return monthlyRecords.reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
  }, [monthlyRecords]);

  // 2. Calculate Global Jimpitan
  const totalGlobal = useMemo(() => {
    return jimpitan.reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
  }, [jimpitan]);

  // 3. Other Stats
  const totalWarga = warga.length;
  const wargaBerpartisipasi = new Set(jimpitan.map(r => r.noKK)).size;
  const participationRate = totalWarga > 0 ? Math.round((wargaBerpartisipasi / totalWarga) * 100) : 0;

  // 4. Keuangan RT Metrics (Realtime recalculated from live sheet state)
  const sortedKeuangan = useMemo(() => {
    return recalculateSaldo(keuanganList);
  }, [keuanganList]);

  // Available months for dropdown filter
  const availableKeuanganMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentYearMonth);
    sortedKeuangan.forEach(r => {
      const cleanTgl = normalizeDateString(r.tanggal);
      const m = normalizeMonthString(r.bulanBuku || cleanTgl);
      if (m && m.length === 7) months.add(m);
    });
    return Array.from(months).sort().reverse();
  }, [sortedKeuangan, currentYearMonth]);

  const totalKasRT = useMemo(() => {
    return sortedKeuangan.length > 0 ? sortedKeuangan[sortedKeuangan.length - 1].saldo : 0;
  }, [sortedKeuangan]);

  const {
    pemasukanKasBulanIni,
    pengeluaranKasBulanIni,
    countPemasukanBulanIni,
    countPengeluaranBulanIni,
    isCurrentMonthClosed,
    activeRecordsCount
  } = useMemo(() => {
    const listBulanIni = sortedKeuangan.filter(r => {
      const cleanTgl = normalizeDateString(r.tanggal);
      const rBulan = normalizeMonthString(r.bulanBuku || cleanTgl);
      if (selectedDashboardBulan === 'all') return true;
      return rBulan === selectedDashboardBulan || (cleanTgl && cleanTgl.startsWith(selectedDashboardBulan));
    });

    const pemasukans = listBulanIni.filter(r => {
      const rawJenis = String(r.jenis || '').toLowerCase().trim();
      const isPem = rawJenis === 'pemasukan' || Number(r.debit) > 0;
      const isOpening = r.isTutupBuku || r.kategori === 'Saldo Awal Bulan' || String(r.kategori || '').toLowerCase().includes('saldo awal');
      return isPem && !isOpening;
    });

    const pengeluarans = listBulanIni.filter(r => {
      const rawJenis = String(r.jenis || '').toLowerCase().trim();
      return rawJenis === 'pengeluaran' || Number(r.kredit) > 0;
    });

    const sumPemasukan = pemasukans.reduce((sum, r) => {
      const val = typeof r.debit === 'string' ? Number(String(r.debit).replace(/[^0-9.-]/g, '')) || 0 : Number(r.debit) || 0;
      return sum + val;
    }, 0);
    
    const sumPengeluaran = pengeluarans.reduce((sum, r) => {
      const val = typeof r.kredit === 'string' ? Number(String(r.kredit).replace(/[^0-9.-]/g, '')) || 0 : Number(r.kredit) || 0;
      return sum + val;
    }, 0);

    const closed = tutupBukuList.some(tb => {
      const cleanBulan = normalizeMonthString(tb.bulanBuku || tb.tanggalTutup);
      return cleanBulan === selectedDashboardBulan;
    });

    return {
      pemasukanKasBulanIni: sumPemasukan,
      pengeluaranKasBulanIni: sumPengeluaran,
      countPemasukanBulanIni: pemasukans.length,
      countPengeluaranBulanIni: pengeluarans.length,
      isCurrentMonthClosed: closed,
      activeRecordsCount: listBulanIni.length
    };
  }, [sortedKeuangan, tutupBukuList, selectedDashboardBulan]);

  // 5. Today's active officer
  const getTodayNotice = () => {
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayIndex = new Date().getDay();
    const todayName = daysIndo[todayIndex];

    const match = jadwal.find(j => j.hari.toLowerCase() === todayName.toLowerCase());
    if (match && match.petugasId) {
      const matchingPetugas = petugas.find(p => p.id === match.petugasId);
      return {
        hari: todayName,
        nama: matchingPetugas ? matchingPetugas.nama : 'Belum Ditugaskan',
        found: true
      };
    }
    return {
      hari: todayName,
      nama: 'Belum Ditugaskan',
      found: false
    };
  };

  const todayNotice = getTodayNotice();

  // Helper to map petugas name in weekly schedule
  const getPetugasName = (petugasId: string) => {
    const p = petugas.find(x => x.id === petugasId);
    return p ? p.nama : 'Belum Ditugaskan';
  };

  // Standard Indonesian Month label helper
  const getBulanIndoLabel = () => {
    return formatBulanIndo(currentYearMonth);
  };

  // Get last 5 collections
  const recentCollections = jimpitan.slice(0, 5);

  // Order days correctly Monday - Sunday
  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const orderedJadwal = daysOrder.map(dayName => {
    const found = jadwal.find(j => j.hari.toLowerCase() === dayName.toLowerCase());
    return {
      hari: dayName,
      petugasName: found ? getPetugasName(found.petugasId) : 'Belum Ditugaskan',
      isActiveToday: todayNotice.hari.toLowerCase() === dayName.toLowerCase()
    };
  });

  return (
    <div id="dashboard-public-root" className="space-y-8 animate-in fade-in duration-200">
      
      {/* Visual Header Banner */}
      <div 
        id="dashboard-banner" 
        className="relative bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 overflow-hidden shadow-sm"
      >
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <svg className="w-full h-full text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 C30,40 70,60 100,0 L100,100 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs text-blue-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Portal Informasi RT Terpadu
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Sistem Transparansi RT: Jimpitan, Kas, & Arisan</h2>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Portal keterbukaan data warga RT. Warga dapat memantau saldo tabungan jimpitan harian, buku kas keuangan RT, dan hasil undian arisan secara real-time yang terhubung ke Google Sheets.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              id="cta-input-jimpitan"
              onClick={onNavigateToInput}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-blue-800 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Input Jimpitan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {onNavigateToKeuangan && (
              <button
                id="cta-keuangan-dashboard"
                onClick={onNavigateToKeuangan}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Buku Kas & Keuangan RT</span>
              </button>
            )}
            {onNavigateToArisan && (
              <button
                id="cta-arisan-dashboard"
                onClick={onNavigateToArisan}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Dices className="w-4 h-4" />
                <span>Arisan Warga RT</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KAS & KEUANGAN RT SECTION (PUBLIC OVERVIEW) */}
      <div id="dashboard-keuangan-section" className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-2xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-white">Laporan Keuangan & Kas RT</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold rounded-full uppercase">
                    Akses Terbuka Warga
                  </span>
                  {webAppUrl ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-medium rounded-full">
                      <Database className="w-3 h-3 text-teal-400" />
                      Data Realtime Sheet
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-emerald-200/80">
                  Laporan pembukuan mutasi debit, kredit, dan tutup buku bulanan yang dikelola Bendahara RT
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <select
                  id="dashboard-periode-select"
                  value={selectedDashboardBulan}
                  onChange={(e) => setSelectedDashboardBulan(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-slate-900 text-white">Semua Periode</option>
                  {availableKeuanganMonths.map(m => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {formatBulanIndo(m)} {m === currentYearMonth ? '(Bulan Ini)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {onSyncFetch && webAppUrl && (
                <button
                  id="dashboard-sync-keuangan-btn"
                  onClick={onSyncFetch}
                  disabled={isSyncing}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/15 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Sinkronkan data dengan Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-300' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? 'Menyinkronkan...' : 'Sinkron Sheet'}</span>
                </button>
              )}
              {onNavigateToKeuangan && (
                <button
                  id="cta-open-full-keuangan"
                  onClick={onNavigateToKeuangan}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer w-fit"
                >
                  <span>Buka Rincian Buku Kas RT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Keuangan Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Saldo Kas RT Saat Ini */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center justify-between text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                <span>Saldo Kas RT Saat Ini</span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-white pt-1">
                Rp {totalKasRT.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-emerald-200/70">
                {sortedKeuangan.length > 0 ? `Saldo akumulasi dari ${sortedKeuangan.length} transaksi di sheet` : 'Belum ada transaksi di sheet'}
              </p>
            </div>

            {/* Pemasukan Kas Bulan Ini */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center justify-between text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                <span>Pemasukan ({formatBulanIndo(selectedDashboardBulan)})</span>
                <div className="p-1 bg-emerald-400/20 rounded-md">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                </div>
              </div>
              <div className="text-xl font-black text-emerald-300 pt-1">
                +Rp {pemasukanKasBulanIni.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-emerald-200/70">
                {countPemasukanBulanIni > 0 ? `${countPemasukanBulanIni} transaksi pemasukan` : 'Belum ada pemasukan'}
              </p>
            </div>

            {/* Pengeluaran Kas Bulan Ini */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center justify-between text-rose-300 text-[11px] font-bold uppercase tracking-wider">
                <span>Pengeluaran ({formatBulanIndo(selectedDashboardBulan)})</span>
                <div className="p-1 bg-rose-400/20 rounded-md">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-300" />
                </div>
              </div>
              <div className="text-xl font-black text-rose-300 pt-1">
                -Rp {pengeluaranKasBulanIni.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-rose-200/70">
                {countPengeluaranBulanIni > 0 ? `${countPengeluaranBulanIni} transaksi pengeluaran` : 'Belum ada pengeluaran'}
              </p>
            </div>

            {/* Status Tutup Buku */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center justify-between text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <span>Status Tutup Buku</span>
                <Lock className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-xs font-black text-white pt-1">
                {isCurrentMonthClosed ? (
                  <span className="text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Periode Ini Sudah Ditutup
                  </span>
                ) : (
                  <span className="text-amber-200 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {selectedDashboardBulan === 'all' ? `${tutupBukuList.length} Periode Ditutup` : 'Buku Kas Aktif'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-200/70">
                {activeRecordsCount} transaksi tercatat pada periode ini
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid for Jimpitan Cards */}
      <div id="dashboard-statistics-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Pendapatan Bulan Ini */}
        <div id="stat-card-bulan-ini" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-200">
            <TrendingUp className="w-24 h-24 text-blue-800" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Jimpitan Bulan Ini</span>
            <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-medium inline-block">
              Periode {getBulanIndoLabel()}
            </span>
            <h3 className="text-2xl font-black text-slate-900 pt-2">
              Rp {totalBulanIni.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Jumlah setoran jimpitan</span>
            <span className="font-semibold text-slate-700">{monthlyRecords.length} kali tarikan</span>
          </div>
        </div>

        {/* CARD 2: Total Global Jimpitan */}
        <div id="stat-card-global" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-200">
            <Coins className="w-24 h-24 text-blue-800" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Total Global Jimpitan</span>
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium inline-block">
              Akumulasi Keseluruhan
            </span>
            <h3 className="text-2xl font-black text-slate-900 pt-2">
              Rp {totalGlobal.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Kas Jimpitan tersimpan</span>
            <span className="font-semibold text-slate-700">{jimpitan.length} total transaksi</span>
          </div>
        </div>

        {/* CARD 3: Participation Card */}
        <div id="stat-card-participation" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Partisipasi Warga</span>
            <span className="text-[11px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md font-medium inline-block">
              Keaktifan Kepala Keluarga
            </span>
            <h3 className="text-2xl font-black text-slate-900 pt-2">
              {participationRate}%
            </h3>
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${participationRate}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>KK berpartisipasi</span>
            <span className="font-semibold text-slate-700">{wargaBerpartisipasi} dari {totalWarga} KK</span>
          </div>
        </div>

      </div>

      {/* ARISAN RT DASHBOARD HIGHLIGHT SECTION */}
      <div id="dashboard-arisan-highlight-section" className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border-2 border-amber-300/80 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 p-6 opacity-10 pointer-events-none hidden sm:block">
          <Dices className="w-48 h-48 text-amber-900" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Dices className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{arisanConfig.namaArisan || 'Arisan RT'}</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                    Info Terkini
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  Jadwal Pengocokan: <strong className="text-amber-950 font-bold">{arisanConfig.tanggalPengocokan || 'Tanggal 15 Setiap Bulan'}</strong>
                </p>
              </div>
            </div>

            {onNavigateToArisan && (
              <div className="flex items-center gap-2 flex-wrap">
                {currentUser?.role === 'admin' || currentUser?.role === 'admin_arisan' ? (
                  <button
                    id="cta-open-arisan-room"
                    onClick={onNavigateToArisan}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer w-fit"
                  >
                    <Dices className="w-4 h-4" /> Buka Ruang Arisan & Kocok ({currentUser.role === 'admin' ? 'Admin RT' : 'Admin Arisan'}) 🎲
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      id="cta-open-arisan-room-disabled"
                      disabled={true}
                      title="Tombol pengocokan arisan terkunci. Hanya Admin RT atau Admin Arisan yang telah login yang dapat mengocok arisan."
                      className="px-3.5 py-2 bg-slate-200/90 text-slate-500 border border-slate-300/80 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed opacity-75 select-none"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kocok Arisan (Khusus Admin)</span>
                    </button>
                    <button
                      id="cta-view-arisan-public"
                      onClick={onNavigateToArisan}
                      className="px-3 py-2 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat Data</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Arisan Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Tanggal Pengocokan */}
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-amber-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Pengocokan
              </div>
              <p className="text-sm font-black text-slate-900 pt-1">
                {arisanConfig.tanggalPengocokan || 'Tanggal 15 Setiap Bulan'}
              </p>
              <p className="text-[10px] text-slate-500">Putaran berkala rutin</p>
            </div>

            {/* Metric 2: Pemenang Terakhir & Total Hadiah */}
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-amber-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" /> Pemenang Terakhir
              </div>
              {arisanPemenang.length > 0 ? (
                <div>
                  <p className="text-sm font-black text-slate-900 truncate">
                    {arisanPemenang[arisanPemenang.length - 1].namaPeserta}
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600">
                    Mendapatkan: Rp {arisanPemenang[arisanPemenang.length - 1].totalHadiah.toLocaleString('id-ID')}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-600">Belum ada pengocokan</p>
                  <p className="text-[10px] text-slate-400">Siap untuk putaran ke-1</p>
                </div>
              )}
            </div>

            {/* Metric 3: Peserta Arisan */}
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-amber-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Jumlah Peserta
              </div>
              <p className="text-sm font-black text-slate-900 pt-1">
                {arisanPeserta.length} Peserta Arisan
              </p>
              <p className="text-[10px] text-slate-500">Total {arisanPeserta.length} bulan putaran</p>
            </div>

            {/* Metric 4: Iuran per Peserta & Total Pot */}
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-amber-200/70 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-purple-700 text-[11px] font-bold uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5" /> Iuran per Peserta
              </div>
              <p className="text-sm font-black text-slate-900 pt-1">
                Rp {(arisanConfig.nominalIuran || 50000).toLocaleString('id-ID')} / Bulan
              </p>
              <p className="text-[10px] text-emerald-600 font-bold">
                Total Pot: Rp {(arisanPeserta.length * (arisanConfig.nominalIuran || 50000)).toLocaleString('id-ID')}
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Row containing Weekly Schedule & Recent Stream */}
      <div id="dashboard-secondary-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Weekly Schedule (Jadwal Petugas dalam 1 minggu) */}
        <div id="dashboard-weekly-schedule-card" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-3xs">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Jadwal Petugas Jimpitan Mingguan</h3>
            </div>
            <p className="text-xs text-slate-500">
              Berikut adalah penanggung jawab penarikan uang jimpitan yang bertugas di RT dalam 1 minggu:
            </p>
          </div>

          {/* Schedule Grid */}
          <div className="space-y-2">
            {orderedJadwal.map((day) => (
              <div 
                key={day.hari}
                className={`flex items-center justify-between p-3 rounded-xl text-xs border transition-all ${
                  day.isActiveToday 
                    ? 'bg-blue-50/70 border-blue-200 shadow-2xs scale-[1.01]' 
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-20 font-bold ${day.isActiveToday ? 'text-blue-950' : 'text-slate-800'}`}>
                    {day.hari}
                  </span>
                  {day.isActiveToday && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-md uppercase tracking-wider animate-pulse">
                      Hari Ini
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <User className={`w-3.5 h-3.5 ${day.isActiveToday ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${day.isActiveToday ? 'text-blue-900' : 'text-slate-700'}`}>
                    {day.petugasName}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule info footnote */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Penjadwalan di atas berulang otomatis setiap pekan. Pengaturan atau rotasi petugas dapat disesuaikan oleh administrator melalui panel kelola jadwal.
            </p>
          </div>
        </div>

        {/* Right Side: Today Notice & Recent stream logs */}
        <div id="dashboard-activity-sidebar" className="space-y-6">
          
          {/* Active Collector Highlights */}
          <div 
            id="today-collector-highlight"
            className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden"
          >
            <div className="absolute right-0 bottom-0 p-3 opacity-15 pointer-events-none">
              <User className="w-20 h-20 text-white" />
            </div>
            <div className="relative z-10 space-y-3.5">
              <div className="flex items-center gap-2 text-blue-400">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Petugas Jimpitan Hari Ini</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{todayNotice.hari} Penarikan</p>
                <h4 className="text-base font-black text-white mt-1">{todayNotice.nama}</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {todayNotice.found 
                  ? 'Siap menarik iuran Rp 1.000 ke rumah-rumah warga RT malam ini sesuai jadwal ronda.'
                  : 'Belum ada petugas terjadwal untuk hari ini.'
                }
              </p>
            </div>
          </div>

          {/* Live Recent Stream Log */}
          <div id="recent-stream-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900">Aliran Jimpitan Terakhir</h3>
            </div>
            
            {recentCollections.length > 0 ? (
              <div className="space-y-2">
                {recentCollections.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[11px] transition-all hover:bg-slate-100/30"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block truncate max-w-[130px]">{item.namaWarga}</span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {formatTanggalIndo(item.tanggal, 'short')}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 whitespace-nowrap shrink-0">
                      +Rp {item.jumlah.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 italic text-[11px]">
                Belum ada transaksi terekam.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
