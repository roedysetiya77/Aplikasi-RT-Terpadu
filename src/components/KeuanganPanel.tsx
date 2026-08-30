import React, { useState, useMemo } from 'react';
import { KeuanganRecord, TutupBukuRecord, CurrentUser } from '../types';
import { 
  KATEGORI_PEMASUKAN_DEFAULT, 
  KATEGORI_PENGELUARAN_DEFAULT,
  recalculateSaldo,
  normalizeDateString,
  normalizeMonthString,
  formatTanggalIndo,
  formatBulanIndo
} from '../initialData';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  FileSpreadsheet, 
  Clock, 
  DollarSign, 
  Layers, 
  Info,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2,
  RefreshCw,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface KeuanganPanelProps {
  keuanganList: KeuanganRecord[];
  tutupBukuList: TutupBukuRecord[];
  currentUser?: CurrentUser | null;
  webAppUrl?: string;
  isSyncing?: boolean;
  onSyncFetch?: () => void;
  onAddKeuangan: (data: Omit<KeuanganRecord, 'id' | 'saldo'>) => Promise<void>;
  onEditKeuangan: (id: string, data: Omit<KeuanganRecord, 'id' | 'saldo'>) => Promise<void>;
  onDeleteKeuangan: (id: string) => Promise<void>;
  onTutupBuku: (data: {
    tutupBukuRecord: TutupBukuRecord;
    saldoAwalRecord: Omit<KeuanganRecord, 'id' | 'saldo'>;
  }) => Promise<void>;
  onBatalTutupBuku: (tutupBukuId: string, saldoAwalId?: string) => Promise<void>;
}

export default function KeuanganPanel({
  keuanganList,
  tutupBukuList,
  currentUser,
  webAppUrl,
  isSyncing,
  onSyncFetch,
  onAddKeuangan,
  onEditKeuangan,
  onDeleteKeuangan,
  onTutupBuku,
  onBatalTutupBuku
}: KeuanganPanelProps) {
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'admin_bendahara';
  
  // Navigation active subtab
  const [activeTab, setActiveTab] = useState<'buku_kas' | 'input' | 'tutup_buku' | 'rekap'>('buku_kas');

  // Month & Year Filter
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedBulan, setSelectedBulan] = useState<string>(currentMonthStr);
  const [filterJenis, setFilterJenis] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for Add / Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTanggal, setFormTanggal] = useState(normalizeDateString(now));
  const [formJenis, setFormJenis] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [formKategori, setFormKategori] = useState<string>(KATEGORI_PEMASUKAN_DEFAULT[0]);
  const [customKategori, setCustomKategori] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formNominal, setFormNominal] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tutup Buku Modal / States
  const [tutupBulanTarget, setTutupBulanTarget] = useState<string>(currentMonthStr);
  const [tutupCatatan, setTutupCatatan] = useState('');
  const [isTutupBukuModalOpen, setIsTutupBukuModalOpen] = useState(false);

  // Available months from records
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthStr);
    keuanganList.forEach(k => {
      const cleanTgl = normalizeDateString(k.tanggal);
      const cleanBulan = normalizeMonthString(k.bulanBuku || cleanTgl);
      if (cleanBulan && cleanBulan.length === 7) monthsSet.add(cleanBulan);
    });
    tutupBukuList.forEach(tb => {
      const cleanBulan = normalizeMonthString(tb.bulanBuku || tb.tanggalTutup);
      if (cleanBulan && cleanBulan.length === 7) monthsSet.add(cleanBulan);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [keuanganList, tutupBukuList, currentMonthStr]);

  // Recalculate sorted records with running balance
  const sortedRecords = useMemo(() => {
    return recalculateSaldo(keuanganList);
  }, [keuanganList]);

  // Filtered records for Table View
  const filteredRecords = useMemo(() => {
    return sortedRecords.filter(r => {
      const cleanTgl = normalizeDateString(r.tanggal);
      const recordMonth = normalizeMonthString(r.bulanBuku || cleanTgl);
      const matchMonth = selectedBulan === 'all' || recordMonth === selectedBulan;
      const matchJenis = filterJenis === 'all' || r.jenis === filterJenis;
      const matchKategori = filterKategori === 'all' || r.kategori === filterKategori;
      const matchSearch = searchTerm === '' || 
        r.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.dicatatOleh && r.dicatatOleh.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchMonth && matchJenis && matchKategori && matchSearch;
    });
  }, [sortedRecords, selectedBulan, filterJenis, filterKategori, searchTerm]);

  // Summary Metrics for the Selected Month (or overall if 'all')
  const metrics = useMemo(() => {
    const totalKasGlobal = sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1].saldo : 0;
    
    const targetRecords = selectedBulan === 'all' 
      ? sortedRecords 
      : sortedRecords.filter(r => {
          const cleanTgl = normalizeDateString(r.tanggal);
          const rBulan = normalizeMonthString(r.bulanBuku || cleanTgl);
          return rBulan === selectedBulan || (cleanTgl && cleanTgl.startsWith(selectedBulan));
        });
    
    // Find Saldo Awal for the selected month
    let saldoAwalBulan = 0;
    if (selectedBulan !== 'all') {
      // Look for explicit opening record or previous month's closing
      const openingRecord = sortedRecords.find(r => {
        const cleanTgl = normalizeDateString(r.tanggal);
        const rBulan = normalizeMonthString(r.bulanBuku || cleanTgl);
        const isOpening = r.isTutupBuku || r.kategori === 'Saldo Awal Bulan' || String(r.kategori || '').toLowerCase().includes('saldo awal');
        return (rBulan === selectedBulan || cleanTgl.startsWith(selectedBulan)) && isOpening;
      });

      if (openingRecord) {
        saldoAwalBulan = typeof openingRecord.debit === 'string' ? Number(String(openingRecord.debit).replace(/[^0-9.-]/g, '')) || 0 : Number(openingRecord.debit) || 0;
      } else {
        // Compute ending balance prior to this month
        const priorRecords = sortedRecords.filter(r => {
          const cleanTgl = normalizeDateString(r.tanggal);
          const rBulan = normalizeMonthString(r.bulanBuku || cleanTgl);
          return rBulan < selectedBulan;
        });
        saldoAwalBulan = priorRecords.length > 0 ? priorRecords[priorRecords.length - 1].saldo : 0;
      }
    } else {
      const firstOpening = sortedRecords.find(r => r.isTutupBuku || r.kategori === 'Saldo Awal Bulan' || String(r.kategori || '').toLowerCase().includes('saldo awal'));
      saldoAwalBulan = firstOpening ? (typeof firstOpening.debit === 'string' ? Number(String(firstOpening.debit).replace(/[^0-9.-]/g, '')) || 0 : Number(firstOpening.debit) || 0) : 0;
    }

    const pemasukanList = targetRecords.filter(r => {
      const isPem = r.jenis === 'pemasukan' || Number(r.debit) > 0;
      const isOpening = r.isTutupBuku || r.kategori === 'Saldo Awal Bulan' || String(r.kategori || '').toLowerCase().includes('saldo awal');
      return isPem && !isOpening;
    });
    const totalPemasukan = pemasukanList.reduce((sum, r) => {
      const val = typeof r.debit === 'string' ? Number(String(r.debit).replace(/[^0-9.-]/g, '')) || 0 : Number(r.debit) || 0;
      return sum + val;
    }, 0);

    const pengeluaranList = targetRecords.filter(r => r.jenis === 'pengeluaran' || Number(r.kredit) > 0);
    const totalPengeluaran = pengeluaranList.reduce((sum, r) => {
      const val = typeof r.kredit === 'string' ? Number(String(r.kredit).replace(/[^0-9.-]/g, '')) || 0 : Number(r.kredit) || 0;
      return sum + val;
    }, 0);

    const saldoAkhirBulan = selectedBulan === 'all' 
      ? totalKasGlobal 
      : saldoAwalBulan + totalPemasukan - totalPengeluaran;

    const isMonthClosed = tutupBukuList.some(tb => {
      const cleanBulan = normalizeMonthString(tb.bulanBuku || tb.tanggalTutup);
      return cleanBulan === selectedBulan;
    });

    return {
      totalKasGlobal,
      saldoAwalBulan,
      totalPemasukan,
      totalPengeluaran,
      saldoAkhirBulan,
      isMonthClosed,
      totalTransaksi: targetRecords.length,
      countPemasukan: pemasukanList.length,
      countPengeluaran: pengeluaranList.length
    };
  }, [sortedRecords, selectedBulan, tutupBukuList]);

  // Categories breakdown for Rekapitulasi
  const kategoriBreakdown = useMemo(() => {
    const targetRecords = selectedBulan === 'all' 
      ? sortedRecords 
      : sortedRecords.filter(r => {
          const cleanTgl = normalizeDateString(r.tanggal);
          const rBulan = r.bulanBuku ? (r.bulanBuku.includes('T') ? r.bulanBuku.split('T')[0].substring(0, 7) : r.bulanBuku.substring(0, 7)) : (cleanTgl ? cleanTgl.substring(0, 7) : '');
          return rBulan === selectedBulan;
        });

    const pemasukanMap: Record<string, number> = {};
    const pengeluaranMap: Record<string, number> = {};

    targetRecords.forEach(r => {
      if (r.jenis === 'pemasukan' && !r.isTutupBuku && r.kategori !== 'Saldo Awal Bulan') {
        pemasukanMap[r.kategori] = (pemasukanMap[r.kategori] || 0) + (Number(r.debit) || 0);
      } else if (r.jenis === 'pengeluaran') {
        pengeluaranMap[r.kategori] = (pengeluaranMap[r.kategori] || 0) + (Number(r.kredit) || 0);
      }
    });

    return {
      pemasukan: Object.entries(pemasukanMap).sort((a, b) => b[1] - a[1]),
      pengeluaran: Object.entries(pengeluaranMap).sort((a, b) => b[1] - a[1])
    };
  }, [sortedRecords, selectedBulan]);

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormTanggal(normalizeDateString(now));
    setFormJenis('pemasukan');
    setFormKategori(KATEGORI_PEMASUKAN_DEFAULT[0]);
    setCustomKategori('');
    setFormKeterangan('');
    setFormNominal('');
    setFormError('');
    setFormSuccess('');
  };

  // Helper to format number with Indonesian thousand separators (e.g. 1000000 -> 1.000.000)
  const formatNominalInput = (val: string | number): string => {
    const raw = String(val).replace(/\D/g, '');
    if (!raw) return '';
    return new Intl.NumberFormat('id-ID').format(Number(raw));
  };

  // Handle Nominal Input typing
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNominalInput(e.target.value);
    setFormNominal(formatted);
  };

  // Quick set nominal
  const handleSetQuickNominal = (amount: number) => {
    setFormNominal(new Intl.NumberFormat('id-ID').format(amount));
  };

  // Handle Form Submit (Add / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!isAuthorized) {
      setFormError('Anda tidak memiliki wewenang untuk menambah atau mengubah data keuangan.');
      return;
    }

    // Convert display nominal back to pure raw integer (e.g. "1.500.000" -> 1500000)
    const nominalNum = Number(formNominal.replace(/\D/g, ''));
    if (!nominalNum || nominalNum <= 0) {
      setFormError('Nominal transaksi harus lebih besar dari Rp 0!');
      return;
    }

    if (!formKeterangan.trim()) {
      setFormError('Keterangan transaksi harus diisi dengan jelas.');
      return;
    }

    const finalKategori = formKategori === 'Lain-lain' && customKategori.trim() 
      ? customKategori.trim() 
      : formKategori;

    const debitVal = formJenis === 'pemasukan' ? nominalNum : 0;
    const kreditVal = formJenis === 'pengeluaran' ? nominalNum : 0;
    const cleanTanggal = normalizeDateString(formTanggal) || normalizeDateString(now);
    const bulanBuku = cleanTanggal.substring(0, 7);

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onEditKeuangan(editingId, {
          tanggal: cleanTanggal,
          jenis: formJenis,
          kategori: finalKategori,
          keterangan: formKeterangan.trim(),
          debit: debitVal,
          kredit: kreditVal,
          dicatatOleh: currentUser ? currentUser.nama : 'Bendahara RT',
          bulanBuku
        });
        setFormSuccess('Transaksi keuangan berhasil diperbarui!');
      } else {
        await onAddKeuangan({
          tanggal: cleanTanggal,
          jenis: formJenis,
          kategori: finalKategori,
          keterangan: formKeterangan.trim(),
          debit: debitVal,
          kredit: kreditVal,
          dicatatOleh: currentUser ? currentUser.nama : 'Bendahara RT',
          bulanBuku
        });
        setFormSuccess('Transaksi keuangan berhasil dicatat ke Buku Kas RT!');
      }
      setTimeout(() => {
        resetForm();
        setActiveTab('buku_kas');
      }, 1000);
    } catch (err) {
      setFormError('Terjadi kesalahan saat menyimpan data ke server/spreadsheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Edit
  const handleEditClick = (rec: KeuanganRecord) => {
    if (!isAuthorized) return;
    setEditingId(rec.id);
    setFormTanggal(normalizeDateString(rec.tanggal) || normalizeDateString(now));
    setFormJenis(rec.jenis);
    
    const isDefaultKat = rec.jenis === 'pemasukan' 
      ? KATEGORI_PEMASUKAN_DEFAULT.includes(rec.kategori)
      : KATEGORI_PENGELUARAN_DEFAULT.includes(rec.kategori);

    if (isDefaultKat) {
      setFormKategori(rec.kategori);
      setCustomKategori('');
    } else {
      setFormKategori('Lain-lain');
      setCustomKategori(rec.kategori);
    }

    setFormKeterangan(rec.keterangan);
    const nominal = rec.jenis === 'pemasukan' ? rec.debit : rec.kredit;
    setFormNominal(nominal ? new Intl.NumberFormat('id-ID').format(nominal) : '');
    setActiveTab('input');
    setFormError('');
    setFormSuccess('');
  };

  // Trigger Delete
  const handleDeleteClick = async (rec: KeuanganRecord) => {
    if (!isAuthorized) return;
    if (rec.isTutupBuku) {
      alert('Entri Saldo Awal hasil Tutup Buku tidak dapat dihapus manual dari sini. Silakan gunakan tombol "Batal Tutup Buku" di tab Tutup Buku.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus transaksi "${rec.keterangan}" (${formatRupiah(rec.debit || rec.kredit)})?`)) {
      try {
        await onDeleteKeuangan(rec.id);
      } catch (err) {
        alert('Gagal menghapus transaksi keuangan.');
      }
    }
  };

  // Calculate calculations for Tutup Buku Preview
  const tutupBukuCalculation = useMemo(() => {
    const targetMonth = tutupBulanTarget;
    
    // Find opening balance of target month
    const openingRecord = sortedRecords.find(r => 
      (r.bulanBuku === targetMonth || r.tanggal.startsWith(targetMonth)) && 
      (r.isTutupBuku || r.kategori === 'Saldo Awal Bulan')
    );

    let saldoAwal = 0;
    if (openingRecord) {
      saldoAwal = openingRecord.debit;
    } else {
      const priorRecords = sortedRecords.filter(r => (r.bulanBuku || r.tanggal.substring(0, 7)) < targetMonth);
      saldoAwal = priorRecords.length > 0 ? priorRecords[priorRecords.length - 1].saldo : 0;
    }

    const monthRecords = sortedRecords.filter(r => (r.bulanBuku || r.tanggal.substring(0, 7)) === targetMonth);
    const totalPemasukan = monthRecords
      .filter(r => r.jenis === 'pemasukan' && !r.isTutupBuku && r.kategori !== 'Saldo Awal Bulan')
      .reduce((sum, r) => sum + (Number(r.debit) || 0), 0);

    const totalPengeluaran = monthRecords
      .filter(r => r.jenis === 'pengeluaran')
      .reduce((sum, r) => sum + (Number(r.kredit) || 0), 0);

    const saldoAkhir = saldoAwal + totalPemasukan - totalPengeluaran;

    // Next Month string (e.g. 2026-08 -> 2026-09)
    const [tYear, tMonth] = targetMonth.split('-').map(Number);
    const nextDate = new Date(tYear, tMonth, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    const nextMonth1stDate = `${nextMonthStr}-01`;

    const isAlreadyClosed = tutupBukuList.some(tb => tb.bulanBuku === targetMonth);

    return {
      targetMonth,
      saldoAwal,
      totalPemasukan,
      totalPengeluaran,
      saldoAkhir,
      nextMonthStr,
      nextMonth1stDate,
      isAlreadyClosed,
      totalTransactions: monthRecords.length
    };
  }, [tutupBulanTarget, sortedRecords, tutupBukuList]);

  // Execute Tutup Buku
  const handleExecuteTutupBuku = async () => {
    if (!isAuthorized) {
      alert('Hanya Bendahara RT atau Admin RT yang dapat melakukan Tutup Buku.');
      return;
    }

    const calc = tutupBukuCalculation;
    if (calc.isAlreadyClosed) {
      alert(`Bulan ${formatBulanIndo(calc.targetMonth)} sudah pernah ditutup buku sebelumnya.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const tutupBukuRecord: TutupBukuRecord = {
        id: `tb-${calc.targetMonth}`,
        bulanBuku: calc.targetMonth,
        tanggalTutup: now.toISOString().split('T')[0],
        saldoAwal: calc.saldoAwal,
        totalPemasukan: calc.totalPemasukan,
        totalPengeluaran: calc.totalPengeluaran,
        saldoAkhir: calc.saldoAkhir,
        ditutupOleh: currentUser ? currentUser.nama : 'Dewi Lestari (Bendahara RT)',
        catatan: tutupCatatan.trim() || `Tutup buku kas bulanan ${formatBulanIndo(calc.targetMonth)} selesai dengan saldo akhir ${formatRupiah(calc.saldoAkhir)}.`
      };

      const saldoAwalRecord: Omit<KeuanganRecord, 'id' | 'saldo'> = {
        tanggal: calc.nextMonth1stDate,
        jenis: 'pemasukan',
        kategori: 'Saldo Awal Bulan',
        keterangan: `Saldo Awal Pindahan dari Tutup Buku ${formatBulanIndo(calc.targetMonth)}`,
        debit: calc.saldoAkhir,
        kredit: 0,
        dicatatOleh: currentUser ? currentUser.nama : 'Sistem (Tutup Buku)',
        isTutupBuku: true,
        bulanBuku: calc.nextMonthStr
      };

      await onTutupBuku({
        tutupBukuRecord,
        saldoAwalRecord
      });

      setIsTutupBukuModalOpen(false);
      setTutupCatatan('');
      alert(`Tutup Buku ${formatBulanIndo(calc.targetMonth)} berhasil! Saldo Akhir ${formatRupiah(calc.saldoAkhir)} otomatis masuk menjadi Saldo Awal ${formatBulanIndo(calc.nextMonthStr)}.`);
    } catch (err) {
      alert('Gagal memproses Tutup Buku. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel (.xlsx)
  const exportToExcel = () => {
    const reportTitle = selectedBulan === 'all' 
      ? 'Laporan Kas & Keuangan RT - Seluruh Periode'
      : `Laporan Kas & Keuangan RT - Bulan ${formatBulanIndo(selectedBulan)}`;

    const dataRows = filteredRecords.map((r, index) => ({
      'No': index + 1,
      'Tanggal': formatTanggalIndo(r.tanggal, 'full'),
      'Jenis': r.jenis === 'pemasukan' ? 'Pemasukan (Debit)' : 'Pengeluaran (Kredit)',
      'Kategori': r.kategori,
      'Keterangan': r.keterangan,
      'Pemasukan (Debit)': r.debit > 0 ? r.debit : 0,
      'Pengeluaran (Kredit)': r.kredit > 0 ? r.kredit : 0,
      'Saldo Kumulatif': r.saldo,
      'Dicatat Oleh': r.dicatatOleh || '-'
    }));

    const summaryRows = [
      {},
      { 'Keterangan': 'RINGKASAN KEUANGAN RT' },
      { 'Keterangan': 'Saldo Awal Bulan', 'Saldo Kumulatif': metrics.saldoAwalBulan },
      { 'Keterangan': 'Total Pemasukan (Debit)', 'Pemasukan (Debit)': metrics.totalPemasukan },
      { 'Keterangan': 'Total Pengeluaran (Kredit)', 'Pengeluaran (Kredit)': metrics.totalPengeluaran },
      { 'Keterangan': 'Saldo Akhir Kas RT', 'Saldo Kumulatif': metrics.saldoAkhirBulan }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([...dataRows, ...summaryRows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Buku Kas RT');
    XLSX.writeFile(wb, `Laporan_Keuangan_RT_${selectedBulan}.xlsx`);
  };

  // Helper Format Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div id="keuangan-panel-root" className="space-y-6">
      
      {/* Header Banner */}
      <div id="keuangan-header" className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <Wallet className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-white">Kas & Keuangan RT</h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  Buku Kas Terpadu
                </span>
                {webAppUrl ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-medium rounded-full">
                    <Database className="w-3 h-3 text-teal-400" />
                    Realtime Sheet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-medium rounded-full">
                    Mode Offline
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Pengelolaan mutasi pemasukan, pengeluaran kas RT, dan tutup buku bulanan otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSyncFetch && webAppUrl && (
              <button
                id="keuangan-sync-btn"
                onClick={onSyncFetch}
                disabled={isSyncing}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/15 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sinkronkan data sekarang dari Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-300' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Sheet'}</span>
              </button>
            )}
            {isAuthorized && (
              <>
                <button
                  id="keuangan-quick-add-btn"
                  onClick={() => {
                    resetForm();
                    setActiveTab('input');
                  }}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Input Keuangan</span>
                </button>
                <button
                  id="keuangan-quick-tutup-btn"
                  onClick={() => {
                    setTutupBulanTarget(selectedBulan === 'all' ? currentMonthStr : selectedBulan);
                    setIsTutupBukuModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tutup Buku Bulan</span>
                </button>
              </>
            )}
            <button
              id="keuangan-export-excel-btn"
              onClick={exportToExcel}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Unduh Laporan Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ekspor Excel</span>
            </button>
            <button
              id="keuangan-print-btn"
              onClick={() => window.print()}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Cetak Laporan"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div id="keuangan-subtabs" className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          id="tab-buku-kas"
          onClick={() => setActiveTab('buku_kas')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'buku_kas'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Buku Kas & Mutasi</span>
        </button>

        <button
          id="tab-input-keuangan"
          onClick={() => setActiveTab('input')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'input'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingId ? 'Edit Transaksi' : 'Form Input Keuangan'}</span>
          {!isAuthorized && (
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-normal">
              Bendahara
            </span>
          )}
        </button>

        <button
          id="tab-tutup-buku"
          onClick={() => setActiveTab('tutup_buku')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tutup_buku'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Tutup Buku Akhir Bulan</span>
          {tutupBukuList.length > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-700 text-[10px] font-bold rounded-full">
              {tutupBukuList.length}
            </span>
          )}
        </button>

        <button
          id="tab-rekap-keuangan"
          onClick={() => setActiveTab('rekap')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'rekap'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekap Kategori & Grafik</span>
        </button>
      </div>

      {/* Month Filter & Metrics Header Row */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" /> Periode Buku:
            </span>
            <select
              id="filter-periode-bulan"
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Periode (Keseluruhan)</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  Bulan {formatBulanIndo(m)} {m === currentMonthStr ? '(Bulan Ini)' : ''}
                </option>
              ))}
            </select>

            {selectedBulan !== 'all' && (
              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border flex items-center gap-1 ${
                metrics.isMonthClosed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {metrics.isMonthClosed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sudah Ditutup Buku</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Buku Kas Aktif / Belum Ditutup</span>
                  </>
                )}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Total Transaksi: <strong className="text-slate-800 font-bold">{metrics.totalTransaksi}</strong> catatan
          </div>
        </div>

        {/* 4 Core Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Saldo Awal */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {selectedBulan === 'all' ? 'Saldo Awal Pembukuan' : 'Saldo Awal Bulan'}
              </span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-black text-slate-900">
              {formatRupiah(metrics.saldoAwalBulan)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {selectedBulan === 'all' 
                ? 'Saldo awal mula pencatatan kas RT' 
                : (metrics.saldoAwalBulan > 0 ? 'Pindahan dari saldo akhir bulan lalu' : 'Belum ada saldo awal tercatat')}
            </p>
          </div>

          {/* Card 2: Total Pemasukan (Debit) */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Pemasukan (Debit)</span>
              <div className="p-1 bg-emerald-200/60 rounded-md">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
              </div>
            </div>
            <div className="text-lg font-black text-emerald-800">
              {formatRupiah(metrics.totalPemasukan)}
            </div>
            <p className="text-[10px] text-emerald-600/80 mt-1">
              {metrics.countPemasukan > 0 
                ? `${metrics.countPemasukan} transaksi pemasukan terdata di sheet` 
                : 'Belum ada pemasukan terdata'}
            </p>
          </div>

          {/* Card 3: Total Pengeluaran (Kredit) */}
          <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Pengeluaran (Kredit)</span>
              <div className="p-1 bg-rose-200/60 rounded-md">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-700" />
              </div>
            </div>
            <div className="text-lg font-black text-rose-800">
              {formatRupiah(metrics.totalPengeluaran)}
            </div>
            <p className="text-[10px] text-rose-600/80 mt-1">
              {metrics.countPengeluaran > 0 
                ? `${metrics.countPengeluaran} transaksi pengeluaran terdata di sheet` 
                : 'Belum ada pengeluaran terdata'}
            </p>
          </div>

          {/* Card 4: Saldo Akhir / Saldo Kas Berjalan */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {selectedBulan === 'all' ? 'Saldo Kas RT Saat Ini' : `Saldo Akhir (${formatBulanIndo(selectedBulan)})`}
              </span>
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-black text-blue-950">
              {formatRupiah(metrics.saldoAkhirBulan)}
            </div>
            <p className="text-[10px] text-blue-600/80 mt-1">
              {selectedBulan === 'all' 
                ? `Akumulasi total dari ${sortedRecords.length} transaksi di sheet` 
                : `Saldo Awal + Pemasukan - Pengeluaran (${metrics.totalTransaksi} transaksi)`}
            </p>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: BUKU KAS & MUTASI TABEL */}
      {activeTab === 'buku_kas' && (
        <div id="buku-kas-view" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          
          {/* Controls: Search, Type Filter, Category Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  id="search-transaksi"
                  type="text"
                  placeholder="Cari keterangan, kategori, atau pencatat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Filter Jenis */}
              <select
                id="filter-jenis"
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Jenis (Debit & Kredit)</option>
                <option value="pemasukan">Hanya Pemasukan (Debit)</option>
                <option value="pengeluaran">Hanya Pengeluaran (Kredit)</option>
              </select>

              {/* Filter Kategori */}
              <select
                id="filter-kategori"
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <optgroup label="Kategori Pemasukan">
                  {KATEGORI_PEMASUKAN_DEFAULT.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </optgroup>
                <optgroup label="Kategori Pengeluaran">
                  {KATEGORI_PENGELUARAN_DEFAULT.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {isAuthorized && (
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('input');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Transaksi</span>
              </button>
            )}
          </div>

          {/* Mutasi Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3.5">Tanggal</th>
                  <th className="py-3 px-3.5">Kategori</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Keterangan</th>
                  <th className="py-3 px-3.5 text-right text-emerald-800">Pemasukan (Debit)</th>
                  <th className="py-3 px-3.5 text-right text-rose-800">Pengeluaran (Kredit)</th>
                  <th className="py-3 px-3.5 text-right text-blue-900 font-black">Saldo Kas</th>
                  {isAuthorized && <th className="py-3 px-3.5 text-right w-20">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r, index) => {
                    const isOpeningOrClosing = r.isTutupBuku || r.kategori === 'Saldo Awal Bulan';

                    return (
                      <tr 
                        key={r.id} 
                        className={`transition-colors ${
                          isOpeningOrClosing 
                            ? 'bg-amber-50/50 hover:bg-amber-50/80 font-medium' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3.5 font-medium whitespace-nowrap text-slate-800">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{formatTanggalIndo(r.tanggal, 'full')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${
                            isOpeningOrClosing
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : r.jenis === 'pemasukan'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {r.kategori}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-medium text-slate-900 leading-snug">{r.keterangan}</div>
                          {r.dicatatOleh && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Dicatat oleh: {r.dicatatOleh}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                          {r.debit > 0 ? formatRupiah(r.debit) : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold text-rose-700 whitespace-nowrap">
                          {r.kredit > 0 ? formatRupiah(r.kredit) : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-black text-blue-950 whitespace-nowrap bg-blue-50/30">
                          {formatRupiah(r.saldo)}
                        </td>
                        {isAuthorized && (
                          <td className="py-3 px-3.5 text-right">
                            {!r.isTutupBuku ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  id={`edit-keuangan-${r.id}`}
                                  onClick={() => handleEditClick(r)}
                                  className="p-1 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-800 rounded-md transition-colors cursor-pointer"
                                  title="Edit Transaksi"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`delete-keuangan-${r.id}`}
                                  onClick={() => handleDeleteClick(r)}
                                  className="p-1 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-md transition-colors cursor-pointer"
                                  title="Hapus Transaksi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-700 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded">
                                Auto
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAuthorized ? 8 : 7} className="py-12 text-center text-slate-400 italic text-xs">
                      Tidak ada catatan transaksi keuangan pada filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUBTAB 2: FORM INPUT KEUANGAN */}
      {activeTab === 'input' && (
        <div id="form-input-keuangan-view" className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-md p-7">
          <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                {editingId ? (
                  <span className="flex items-center gap-2 text-blue-700">
                    <Edit2 className="w-5 h-5" /> Edit Transaksi Kas RT
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-800">
                    <Plus className="w-5 h-5" /> Form Input Keuangan Kas RT
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Catat mutasi pemasukan atau pengeluaran dana kas RT dengan teliti dan transparan.
              </p>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          {!isAuthorized && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 mb-5 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-amber-950">Akses Terbatas:</strong>
                Hanya <strong>Bendahara RT</strong> dan <strong>Admin RT</strong> yang memiliki wewenang untuk mencatat atau mengubah transaksi kas keuangan. Anda saat ini dalam mode peninjauan.
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4">
            
            {/* 1. Pilih Jenis Input: Pemasukan vs Pengeluaran */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                1. Jenis Transaksi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="select-jenis-pemasukan"
                  disabled={!isAuthorized}
                  onClick={() => {
                    setFormJenis('pemasukan');
                    setFormKategori(KATEGORI_PEMASUKAN_DEFAULT[0]);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    formJenis === 'pemasukan'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${
                    formJenis === 'pemasukan' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Pemasukan (Debit)</div>
                    <div className="text-[10px] text-slate-500">Menambah saldo kas RT</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="select-jenis-pengeluaran"
                  disabled={!isAuthorized}
                  onClick={() => {
                    setFormJenis('pengeluaran');
                    setFormKategori(KATEGORI_PENGELUARAN_DEFAULT[0]);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    formJenis === 'pengeluaran'
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${
                    formJenis === 'pengeluaran' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Pengeluaran (Kredit)</div>
                    <div className="text-[10px] text-slate-500">Mengurangi saldo kas RT</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Tanggal Transaksi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                2. Tanggal Transaksi
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="form-tanggal"
                  type="date"
                  required
                  disabled={!isAuthorized}
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 3. Kategori Transaksi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                3. Kategori {formJenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
              </label>
              <select
                id="form-kategori"
                disabled={!isAuthorized}
                value={formKategori}
                onChange={(e) => setFormKategori(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-medium"
              >
                {formJenis === 'pemasukan' ? (
                  KATEGORI_PEMASUKAN_DEFAULT.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))
                ) : (
                  KATEGORI_PENGELUARAN_DEFAULT.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))
                )}
              </select>

              {formKategori === 'Lain-lain' && (
                <div className="pt-1.5">
                  <input
                    id="form-custom-kategori"
                    type="text"
                    placeholder="Tuliskan nama kategori khusus..."
                    value={customKategori}
                    onChange={(e) => setCustomKategori(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  />
                </div>
              )}
            </div>

            {/* 4. Keterangan / Deskripsi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                4. Keterangan Rinci
              </label>
              <textarea
                id="form-keterangan"
                rows={2}
                required
                disabled={!isAuthorized}
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder={formJenis === 'pemasukan' 
                  ? 'Contoh: Rekap penyerahan jimpitan ronda pekan ke-2 / Donasi warga No. 12' 
                  : 'Contoh: Pembelian snack rapat warga / Santunan warga sakit'
                }
                className="w-full p-3 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* 5. Nominal (Rp) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  5. Jumlah Nominal (Rp)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Format otomatis (cth: 100.000)
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-xs text-slate-400 pointer-events-none">Rp</span>
                <input
                  id="form-nominal"
                  type="text"
                  inputMode="numeric"
                  required
                  disabled={!isAuthorized}
                  value={formNominal}
                  onChange={handleNominalChange}
                  placeholder="0"
                  className="w-full pl-11 pr-3 py-2 text-sm font-mono font-bold bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                />
              </div>

              {/* Quick Nominal Buttons for ease of use */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400 mr-1 font-medium">Pilihan cepat:</span>
                {[50000, 100000, 200000, 500000, 1000000, 2500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    disabled={!isAuthorized}
                    onClick={() => handleSetQuickNominal(amt)}
                    className="px-2 py-1 text-[10px] font-mono font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    +{new Intl.NumberFormat('id-ID').format(amt)}
                  </button>
                ))}
              </div>

              {formNominal && Number(formNominal.replace(/\D/g, '')) > 0 && (
                <div className="flex items-center justify-between text-[11px] p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                  <span className="text-emerald-800 font-bold font-mono">
                    {formatRupiah(Number(formNominal.replace(/\D/g, '')))}
                  </span>
                  <span className="text-emerald-600 font-semibold text-[10px]">
                    (Nilai input siap disimpan)
                  </span>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="pt-3">
              <button
                id="submit-keuangan-btn"
                type="submit"
                disabled={!isAuthorized || isSubmitting}
                className={`w-full py-3 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  formJenis === 'pemasukan'
                    ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300'
                    : 'bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300'
                }`}
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : editingId ? (
                  <>
                    <Edit2 className="w-4 h-4" />
                    <span>Simpan Perubahan Transaksi</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Simpan {formJenis === 'pemasukan' ? 'Pemasukan (Debit)' : 'Pengeluaran (Kredit)'} ke Buku Kas</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* SUBTAB 3: TUTUP BUKU AKHIR BULAN */}
      {activeTab === 'tutup_buku' && (
        <div id="tutup-buku-view" className="space-y-6">
          
          {/* Action Box */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 rounded-3xl border border-amber-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Lock className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-black text-amber-950">Fitur Tutup Buku Akhir Bulan</h3>
                </div>
                <p className="text-xs text-amber-900/80 mt-1 max-w-xl">
                  Tutup buku mengunci rekapitulasi keuangan bulan bersangkutan, menghasilkan <strong>Saldo Akhir Bulan</strong>, dan secara otomatis memindahkannya menjadi <strong>Saldo Awal Bulan Berikutnya</strong>.
                </p>
              </div>

              {isAuthorized ? (
                <button
                  id="btn-open-tutup-buku-modal"
                  onClick={() => setIsTutupBukuModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proses Tutup Buku Sekarang</span>
                </button>
              ) : (
                <div className="text-[11px] text-amber-800 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200">
                  🔒 Khusus wewenang Bendahara RT & Admin RT
                </div>
              )}
            </div>
          </div>

          {/* History of Closed Months */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Tutup Buku Bulanan RT</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Bulan Buku</th>
                    <th className="py-3 px-4">Tanggal Tutup</th>
                    <th className="py-3 px-4 text-right">Saldo Awal</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Total Pemasukan</th>
                    <th className="py-3 px-4 text-right text-rose-700">Total Pengeluaran</th>
                    <th className="py-3 px-4 text-right text-blue-900 font-black">Saldo Akhir</th>
                    <th className="py-3 px-4">Ditutup Oleh</th>
                    {isAuthorized && <th className="py-3 px-4 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {tutupBukuList.length > 0 ? (
                    tutupBukuList.map((tb) => (
                      <tr key={tb.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                            {formatBulanIndo(tb.bulanBuku)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{formatTanggalIndo(tb.tanggalTutup, 'full')}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          {formatRupiah(tb.saldoAwal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                          +{formatRupiah(tb.totalPemasukan)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-rose-700 font-semibold">
                          -{formatRupiah(tb.totalPengeluaran)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-blue-950 bg-blue-50/40">
                          {formatRupiah(tb.saldoAkhir)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="font-medium">{tb.ditutupOleh}</div>
                          {tb.catatan && <div className="text-[10px] text-slate-400 italic">{tb.catatan}</div>}
                        </td>
                        {isAuthorized && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={async () => {
                                if (confirm(`Apakah Anda yakin ingin membatalkan Tutup Buku bulan ${formatBulanIndo(tb.bulanBuku)}?`)) {
                                  // Find the next month's opening balance record to also delete
                                  const [y, m] = tb.bulanBuku.split('-').map(Number);
                                  const nextDate = new Date(y, m, 1);
                                  const nextM = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
                                  const saRecord = sortedRecords.find(r => r.bulanBuku === nextM && r.isTutupBuku);

                                  await onBatalTutupBuku(tb.id, saRecord?.id);
                                }
                              }}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title="Batalkan Tutup Buku"
                            >
                              Batal Tutup
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAuthorized ? 8 : 7} className="py-8 text-center text-slate-400 italic text-xs">
                        Belum ada riwayat tutup buku. Anda dapat melakukan tutup buku pada akhir setiap bulan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 4: REKAPITULASI KATEGORI & GRAFIK */}
      {activeTab === 'rekap' && (
        <div id="rekap-keuangan-view" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Pemasukan Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Rincian Kategori Pemasukan</span>
              </h3>
              <span className="text-xs font-black text-emerald-800 font-mono">
                {formatRupiah(metrics.totalPemasukan)}
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {kategoriBreakdown.pemasukan.length > 0 ? (
                kategoriBreakdown.pemasukan.map(([kat, amount]) => {
                  const percent = metrics.totalPemasukan > 0 
                    ? Math.round((amount / metrics.totalPemasukan) * 100) 
                    : 0;

                  return (
                    <div key={kat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>{kat}</span>
                        <span className="font-mono font-bold text-slate-900">{formatRupiah(amount)} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 italic py-4 text-center">
                  Belum ada transaksi pemasukan pada periode ini.
                </div>
              )}
            </div>
          </div>

          {/* Pengeluaran Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Rincian Kategori Pengeluaran</span>
              </h3>
              <span className="text-xs font-black text-rose-800 font-mono">
                {formatRupiah(metrics.totalPengeluaran)}
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {kategoriBreakdown.pengeluaran.length > 0 ? (
                kategoriBreakdown.pengeluaran.map(([kat, amount]) => {
                  const percent = metrics.totalPengeluaran > 0 
                    ? Math.round((amount / metrics.totalPengeluaran) * 100) 
                    : 0;

                  return (
                    <div key={kat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>{kat}</span>
                        <span className="font-mono font-bold text-slate-900">{formatRupiah(amount)} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 italic py-4 text-center">
                  Belum ada transaksi pengeluaran pada periode ini.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* MODAL TUTUP BUKU */}
      {isTutupBukuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Konfirmasi Tutup Buku Kas RT</h3>
                  <p className="text-[11px] text-slate-500">Perhitungan saldo akhir & pengalihan saldo awal otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setIsTutupBukuModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Select Month to Close */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Pilih Bulan Buku yang Ditutup:</label>
              <select
                value={tutupBulanTarget}
                onChange={(e) => setTutupBulanTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {availableMonths.filter(m => m !== 'all').map(m => (
                  <option key={m} value={m}>
                    Bulan {formatBulanIndo(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Calculations Breakdown Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Saldo Awal Bulan:</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(tutupBukuCalculation.saldoAwal)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span>(+) Total Pemasukan:</span>
                <span className="font-mono font-bold text-emerald-800">+{formatRupiah(tutupBukuCalculation.totalPemasukan)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-700">
                <span>(-) Total Pengeluaran:</span>
                <span className="font-mono font-bold text-rose-800">-{formatRupiah(tutupBukuCalculation.totalPengeluaran)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-bold text-sm text-blue-950">
                <span>(=) Saldo Akhir Bulan:</span>
                <span className="font-mono font-black">{formatRupiah(tutupBukuCalculation.saldoAkhir)}</span>
              </div>
            </div>

            {/* Info rollover */}
            <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                Saldo Akhir <strong>{formatRupiah(tutupBukuCalculation.saldoAkhir)}</strong> akan otomatis dicatat sebagai <strong>Saldo Awal Bulan {formatBulanIndo(tutupBukuCalculation.nextMonthStr)}</strong> pada tanggal 01.
              </div>
            </div>

            {tutupBukuCalculation.isAlreadyClosed && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Bulan {formatBulanIndo(tutupBukuCalculation.targetMonth)} sudah pernah ditutup buku sebelumnya.</span>
              </div>
            )}

            {/* Notes input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Catatan Tutup Buku (Opsional):</label>
              <input
                type="text"
                value={tutupCatatan}
                onChange={(e) => setTutupCatatan(e.target.value)}
                placeholder="Contoh: Pembukuan bulan Agustus berjalan tertib dan seimbang."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTutupBukuModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="confirm-tutup-buku-btn"
                disabled={tutupBukuCalculation.isAlreadyClosed || isSubmitting}
                onClick={handleExecuteTutupBuku}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Konfirmasi & Kunci Tutup Buku</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
