import React, { useState, useEffect, useRef } from 'react';
import { Warga, ArisanPeserta, ArisanSetoran, ArisanPemenang, ArisanConfig, CurrentUser } from '../types';
import { formatTanggalIndo } from '../initialData';
import { 
  Dices, 
  Users, 
  DollarSign, 
  Trophy, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Share2, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Settings, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  CreditCard,
  Volume2,
  VolumeX,
  UserCheck,
  Zap,
  Info,
  Lock
} from 'lucide-react';

interface ArisanPanelProps {
  wargaList: Warga[];
  pesertaList: ArisanPeserta[];
  setoranList: ArisanSetoran[];
  pemenangList: ArisanPemenang[];
  config: ArisanConfig;
  currentUser: CurrentUser | null;
  onAddPeserta: (warga: Warga) => Promise<void>;
  onDeletePeserta: (pesertaId: string) => Promise<void>;
  onSaveSetoran: (newSetoran: Omit<ArisanSetoran, 'id'>) => Promise<void>;
  onBatchSetoranToggle: (pesertaId: string, bulan: string, periodeKe: number, isLunas: boolean) => Promise<void>;
  onKocokWinner: (winner: ArisanPeserta, totalHadiah: number, bulan: string, catatan?: string) => Promise<void>;
  onResetCycle: (newConfig?: ArisanConfig) => Promise<void>;
  onSaveConfig: (newConfig: ArisanConfig) => Promise<void>;
}

// Sound effects generator using Web Audio API (No external mp3 required)
const playSoundEffect = (type: 'tick' | 'win' | 'click') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'win') {
      // Fanfare chord
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.9);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch (e) {
    // AudioContext autoplay restrictions or disabled
  }
};

export default function ArisanPanel({
  wargaList,
  pesertaList,
  setoranList,
  pemenangList,
  config,
  currentUser,
  onAddPeserta,
  onDeletePeserta,
  onSaveSetoran,
  onBatchSetoranToggle,
  onKocokWinner,
  onResetCycle,
  onSaveConfig
}: ArisanPanelProps) {
  // Navigation tabs inside Arisan
  const [subTab, setSubTab] = useState<'kocok' | 'peserta' | 'setoran' | 'pemenang' | 'settings'>('kocok');

  // Warga search for adding participants
  const [searchWarga, setSearchWarga] = useState('');
  const [selectedWargaId, setSelectedWargaId] = useState('');
  const [addPesertaMsg, setAddPesertaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Setoran management state
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedBulan, setSelectedBulan] = useState(currentYearMonth);
  const [setoranMsg, setSetoranMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Kocok state
  const [isRolling, setIsRolling] = useState(false);
  const [currentRollingName, setCurrentRollingName] = useState<string>('Siap Mengocok');
  const [currentWinner, setCurrentWinner] = useState<ArisanPeserta | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const rollIntervalRef = useRef<any>(null);

  // Settings form state
  const [editConfig, setEditConfig] = useState<ArisanConfig>(config);
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Cycle Modal state
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);
  const [newCycleForm, setNewCycleForm] = useState({
    namaArisan: config.namaArisan || 'Arisan Warga RT 01',
    nominalIuran: config.nominalIuran || 50000,
    tanggalPengocokan: config.tanggalPengocokan || 'Tanggal 15 Setiap Bulan'
  });
  const [newCycleNotice, setNewCycleNotice] = useState<string | null>(null);

  useEffect(() => {
    setEditConfig(config);
    setNewCycleForm({
      namaArisan: config.namaArisan || 'Arisan Warga RT 01',
      nominalIuran: config.nominalIuran || 50000,
      tanggalPengocokan: config.tanggalPengocokan || 'Tanggal 15 Setiap Bulan'
    });
  }, [config]);

  // Handle Starting a New Arisan Cycle
  const handleExecuteNewCycle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isArisanAdmin) {
      alert('Hanya Admin RT atau Admin Arisan yang dapat memulai siklus arisan baru.');
      return;
    }
    if (!newCycleForm.nominalIuran || newCycleForm.nominalIuran <= 0) {
      alert('Silakan masukkan nominal iuran yang valid (lebih besar dari 0).');
      return;
    }

    try {
      if (soundEnabled) playSoundEffect('win');
      const updatedConfig: ArisanConfig = {
        ...config,
        namaArisan: newCycleForm.namaArisan || 'Arisan Warga RT 01',
        nominalIuran: Number(newCycleForm.nominalIuran),
        tanggalPengocokan: newCycleForm.tanggalPengocokan || 'Tanggal 15 Setiap Bulan',
        periodeBerjalan: 1,
        status: 'aktif'
      };

      await onResetCycle(updatedConfig);
      setIsNewCycleModalOpen(false);
      setSubTab('peserta');
      setNewCycleNotice(`Siklus arisan baru berhasil dimulai dengan iuran Rp ${Number(newCycleForm.nominalIuran).toLocaleString('id-ID')} / bulan! Data peserta lama telah dikosongkan. Silakan daftarkan warga yang mengikuti siklus baru ini pada panel di bawah.`);
    } catch (err) {
      alert('Terjadi kesalahan saat memulai siklus baru.');
    }
  };

  // Filter eligible participants (Belum Pernah Menang pada putaran saat ini)
  const isArisanAdmin = currentUser?.role === 'admin' || currentUser?.role === 'admin_arisan';
  const eligiblePeserta = pesertaList.filter(p => !p.sudahMenang);
  const sudahMenangPeserta = pesertaList.filter(p => p.sudahMenang);

  // Calculated values
  const totalPeserta = pesertaList.length;
  const nominalPerPeserta = config.nominalIuran || 50000;
  const totalHadiahPot = totalPeserta * nominalPerPeserta;
  const totalPutaran = totalPeserta;
  const putaranSaatIni = Math.min(pemenangList.length + 1, Math.max(totalPutaran, 1));
  const isCycleCompleted = totalPeserta > 0 && eligiblePeserta.length === 0;

  // Filtered warga that are not yet participants
  const existingWargaIds = new Set(pesertaList.map(p => p.wargaId));
  const availableWarga = wargaList.filter(w => !existingWargaIds.has(w.id));
  const filteredAvailableWarga = availableWarga.filter(w => 
    w.namaKK.toLowerCase().includes(searchWarga.toLowerCase()) || 
    w.noKK.includes(searchWarga)
  );

  // Handle Add Participant
  const handleAddPesertaClick = async (warga: Warga) => {
    if (!isArisanAdmin) {
      alert('Hanya Admin RT atau Admin Arisan yang dapat menambahkan peserta arisan. Silakan login sebagai Admin terlebih dahulu.');
      return;
    }

    try {
      if (soundEnabled) playSoundEffect('click');
      await onAddPeserta(warga);
      setAddPesertaMsg({ type: 'success', text: `Berhasil menambahkan ${warga.namaKK} ke daftar peserta arisan!` });
      setSelectedWargaId('');
      setTimeout(() => setAddPesertaMsg(null), 3000);
    } catch (err) {
      setAddPesertaMsg({ type: 'error', text: 'Gagal menambahkan peserta.' });
    }
  };

  // KOCOK ARISAN ENGINE
  const handleStartKocok = () => {
    if (!isArisanAdmin) {
      alert('Hanya Admin RT atau Admin Arisan yang memiliki hak akses untuk mengocok arisan. Silakan login sebagai Admin terlebih dahulu.');
      return;
    }

    if (eligiblePeserta.length === 0) {
      alert('Semua peserta sudah mendapatkan arisan pada siklus ini! Silakan reset siklus baru.');
      return;
    }

    if (totalPeserta < 2) {
      alert('Peserta arisan minimal harus ada 2 orang untuk dapat mengocok arisan.');
      return;
    }

    setIsRolling(true);
    setCurrentWinner(null);
    setShowWinnerModal(false);

    let speed = 50; // ms
    let counter = 0;
    const maxTicks = 45; // total cycles before stopping (~3-4 seconds)

    const candidatePool = [...eligiblePeserta];

    const runRoll = () => {
      counter++;
      const randomIndex = Math.floor(Math.random() * candidatePool.length);
      const chosenCandidate = candidatePool[randomIndex];
      setCurrentRollingName(chosenCandidate.namaPeserta);

      if (soundEnabled) playSoundEffect('tick');

      if (counter < maxTicks) {
        // Slow down gradually towards the end
        if (counter > maxTicks - 15) {
          speed += 20;
        } else if (counter > maxTicks - 8) {
          speed += 45;
        }
        rollIntervalRef.current = setTimeout(runRoll, speed);
      } else {
        // Final Pick!
        const finalWinner = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        setCurrentRollingName(finalWinner.namaPeserta);
        setCurrentWinner(finalWinner);
        setIsRolling(false);
        setShowWinnerModal(true);
        if (soundEnabled) playSoundEffect('win');

        // Save Winner automatically
        const bulanLabel = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        onKocokWinner(finalWinner, totalHadiahPot, bulanLabel, `Pemenang Putaran ke-${putaranSaatIni}`);
      }
    };

    runRoll();
  };

  // Stop / cleanup timer
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearTimeout(rollIntervalRef.current);
    };
  }, []);

  // Normalize month helper (e.g. 2026-08, 2026-08-01, or ISO date string -> 2026-08)
  const normalizeMonthKey = (mStr?: string) => {
    if (!mStr) return '';
    const str = String(mStr).trim();
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        return `${yr}-${mo}`;
      }
    }
    if (str.length >= 7) return str.substring(0, 7);
    return str;
  };

  // Format month helpers
  const getBulanLabel = (ym: string) => {
    if (!ym) return '-';
    const norm = normalizeMonthKey(ym);
    const [y, m] = norm.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIndex = parseInt(m, 10) - 1;
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return ym;
    return `${monthNames[monthIndex]} ${y}`;
  };

  // Setoran calculations for selected month
  const currentMonthNorm = normalizeMonthKey(selectedBulan);
  const setoranBulanTerpilih = setoranList.filter(s => normalizeMonthKey(s.bulan) === currentMonthNorm);
  const paidPesertaIds = new Set(
    setoranBulanTerpilih
      .filter(s => String(s.status || '').toLowerCase().trim() === 'lunas')
      .map(s => String(s.pesertaId).trim())
  );
  const totalTerkumpulBulanIni = setoranBulanTerpilih
    .filter(s => String(s.status || '').toLowerCase().trim() === 'lunas')
    .reduce((sum, s) => sum + (Number(s.jumlah) || 0), 0);

  // Share Winner to WhatsApp
  const handleShareWinnerWA = (winner: ArisanPeserta) => {
    const text = `🎉 *PENGUMUMAN PEMENANG ARISAN RT* 🎉
----------------------------------------
🏆 *Nama Pemenang:* ${winner.namaPeserta}
📋 *No. KK:* ${winner.noKK}
📅 *Putaran ke:* ${putaranSaatIni} dari ${totalPutaran} Putaran
💰 *Total Uang Arisan:* Rp ${totalHadiahPot.toLocaleString('id-ID')}
🗓️ *Tanggal:* ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
----------------------------------------
_Selamat kepada pemenang arisan bulan ini!_
_${config.namaArisan || 'Arisan Warga RT 01'}_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div id="arisan-panel-root" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner Card */}
      <div 
        id="arisan-banner" 
        className="relative bg-linear-to-r from-amber-600 via-orange-600 to-rose-600 text-white rounded-3xl p-6 sm:p-8 overflow-hidden shadow-sm"
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <Dices className="w-full h-full text-white" />
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs text-amber-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> {config.namaArisan || 'Arisan Warga RT 01'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Sistem Pengocokan & Setoran Arisan RT</h2>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
            Transparansi penuh arisan warga: Pengocokan acak otomatis dengan sistem eliminasi pemenang hingga seluruh peserta mendapatkan giliran.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-amber-100">
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Jadwal Kocok: <strong>{config.tanggalPengocokan || 'Tanggal 15 Setiap Bulan'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl">
              <DollarSign className="w-4 h-4 text-amber-300" />
              <span>Iuran: <strong>Rp {nominalPerPeserta.toLocaleString('id-ID')} / Peserta</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Arisan KPI Metric Cards */}
      <div id="arisan-metrics-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Total Peserta</span>
          <div className="flex items-baseline justify-between">
            <h4 className="text-xl font-black text-slate-900">{totalPeserta} <span className="text-xs font-normal text-slate-500">Warga</span></h4>
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[10px] text-slate-400">Total {totalPutaran} bulan putaran</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Total Hadiah (Pot)</span>
          <div className="flex items-baseline justify-between">
            <h4 className="text-xl font-black text-emerald-600">Rp {totalHadiahPot.toLocaleString('id-ID')}</h4>
            <Trophy className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[10px] text-slate-400">{totalPeserta} x Rp {nominalPerPeserta.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Status Putaran</span>
          <div className="flex items-baseline justify-between">
            <h4 className="text-xl font-black text-blue-600">{sudahMenangPeserta.length} / {totalPeserta}</h4>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[10px] text-slate-400">
            {isCycleCompleted ? 'Siklus Selesai!' : `Sisa ${eligiblePeserta.length} belum dapat`}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Pemenang Terakhir</span>
          <div className="flex items-baseline justify-between truncate">
            <h4 className="text-sm font-black text-slate-900 truncate">
              {pemenangList.length > 0 ? pemenangList[pemenangList.length - 1].namaPeserta : 'Belum Ada'}
            </h4>
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
          </div>
          <p className="text-[10px] text-slate-400">
            {pemenangList.length > 0 ? `Rp ${pemenangList[pemenangList.length - 1].totalHadiah.toLocaleString('id-ID')}` : 'Siap dikocok'}
          </p>
        </div>

      </div>

      {/* Internal Arisan Navigation Subtabs */}
      <div id="arisan-subtabs" className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          
          <button
            id="subtab-kocok-btn"
            onClick={() => setSubTab('kocok')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'kocok'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Dices className="w-4 h-4" />
            Kocok Arisan 🎲
          </button>

          <button
            id="subtab-peserta-btn"
            onClick={() => setSubTab('peserta')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'peserta'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Peserta Arisan ({totalPeserta})
          </button>

          <button
            id="subtab-setoran-btn"
            onClick={() => setSubTab('setoran')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'setoran'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Setoran Bulanan
          </button>

          <button
            id="subtab-pemenang-btn"
            onClick={() => setSubTab('pemenang')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'pemenang'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Riwayat Pemenang ({pemenangList.length})
          </button>

          {isArisanAdmin && (
            <button
              id="subtab-settings-btn"
              onClick={() => setSubTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'settings'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              Pengaturan Arisan
            </button>
          )}

        </div>

        {/* Audio Toggle Button */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
          title={soundEnabled ? 'Matikan Suara Pengocokan' : 'Aktifkan Suara Pengocokan'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-[11px] font-medium">{soundEnabled ? 'Suara ON' : 'Suara OFF'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. TAB: KOCOK ARISAN (LIVE DRAW ROOM) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'kocok' && (
        <div id="kocok-arisan-room" className="space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-3xs flex flex-col items-center justify-center text-center relative overflow-hidden">
            
            {/* Background decoration circles */}
            <div className="absolute w-96 h-96 bg-amber-50 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
            <div className="absolute w-96 h-96 bg-orange-50 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

            <div className="relative z-10 max-w-xl w-full flex flex-col items-center space-y-6">
              
              <div className="space-y-1">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  Pengocokan Putaran ke-{putaranSaatIni} dari {totalPutaran}
                </span>
                <h3 className="text-lg font-black text-slate-900 pt-2">
                  Undian Pemenang Arisan Bulan Ini
                </h3>
                <p className="text-xs text-slate-500">
                  Total Hadiah: <strong className="text-emerald-600 font-black text-sm">Rp {totalHadiahPot.toLocaleString('id-ID')}</strong> ({totalPeserta} peserta x Rp {nominalPerPeserta.toLocaleString('id-ID')})
                </p>
              </div>

              {/* Dynamic Name Box */}
              <div className="w-full bg-slate-900 text-white rounded-2xl p-6 border-2 border-amber-500 shadow-lg flex flex-col items-center justify-center min-h-[110px] space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                  {isRolling ? '⚡ Mengacak Peserta...' : 'Nama Terpilih'}
                </span>
                <h2 className={`text-xl sm:text-2xl font-black transition-all ${isRolling ? 'text-amber-300 scale-105 animate-pulse' : 'text-white'}`}>
                  {currentRollingName}
                </h2>
              </div>

              {/* BIG CIRCULAR BUTTON KOCOK ARISAN */}
              {isCycleCompleted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl w-full space-y-3.5 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
                    <Trophy className="w-5 h-5 text-emerald-600 animate-bounce" />
                    <span>🎉 Seluruh Peserta Telah Mendapatkan Arisan!</span>
                  </div>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                    Siklus arisan periode ini telah selesai dengan sukses ({pemenangList.length} putaran). Seluruh peserta terdaftar telah memenangkan arisan.
                  </p>
                  {isArisanAdmin ? (
                    <div className="pt-1">
                      <button
                        id="reset-cycle-btn"
                        onClick={() => {
                          setNewCycleForm({
                            namaArisan: config.namaArisan || 'Arisan Warga RT 01',
                            nominalIuran: config.nominalIuran || 50000,
                            tanggalPengocokan: config.tanggalPengocokan || 'Tanggal 15 Setiap Bulan'
                          });
                          setIsNewCycleModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" /> Mulai Siklus Arisan Baru (Input Peserta Baru)
                      </button>
                      <p className="text-[11px] text-emerald-600/90 mt-2">
                        *Data peserta lama akan dikosongkan untuk persiapan pendaftaran peserta & iuran siklus baru.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/80 border border-emerald-200 rounded-xl text-xs text-slate-600">
                      Menunggu Administrator RT / Admin Arisan untuk membuka siklus arisan periode berikutnya.
                    </div>
                  )}
                </div>
              ) : isArisanAdmin ? (
                <div className="flex flex-col items-center space-y-3">
                  <button
                    id="btn-kocok-arisan-main"
                    onClick={handleStartKocok}
                    disabled={isRolling || eligiblePeserta.length === 0}
                    className={`w-44 h-44 sm:w-48 sm:h-48 rounded-full border-4 border-amber-300 shadow-xl flex flex-col items-center justify-center transition-all cursor-pointer transform active:scale-95 ${
                      isRolling 
                        ? 'bg-amber-700 text-white animate-spin cursor-not-allowed' 
                        : 'bg-linear-to-br from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white hover:scale-105 shadow-amber-500/30'
                    }`}
                  >
                    <Dices className={`w-10 h-10 mb-1 ${isRolling ? 'animate-bounce' : ''}`} />
                    <span className="text-base sm:text-lg font-black uppercase tracking-wider">
                      {isRolling ? 'Mengacak...' : 'Kocok Arisan'}
                    </span>
                    <span className="text-[10px] text-amber-100 mt-1 font-semibold">
                      {eligiblePeserta.length} Calon Peserta
                    </span>
                  </button>

                  <p className="text-[11px] text-slate-400">
                    *Klik tombol lingkaran besar di atas untuk memulai undian acak ({currentUser?.role === 'admin_arisan' ? 'Admin Arisan' : 'Admin RT'}).
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <button
                    id="btn-kocok-arisan-main-disabled"
                    disabled={true}
                    title="Tombol pengocokan arisan hanya dapat diklik oleh Admin yang sudah login"
                    className="w-44 h-44 sm:w-48 sm:h-48 rounded-full border-4 border-slate-300 bg-slate-100 text-slate-400 shadow-xs flex flex-col items-center justify-center cursor-not-allowed select-none opacity-80"
                  >
                    <Lock className="w-10 h-10 mb-1 text-slate-400" />
                    <span className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-500">
                      Kocok Arisan
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 font-semibold bg-slate-200 px-2 py-0.5 rounded-full">
                      Terkunci (Khusus Admin)
                    </span>
                  </button>

                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5 max-w-md shadow-2xs">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="leading-snug">
                      <strong>Hak Akses Terbatas:</strong> Tombol kocok hanya aktif untuk <strong>Admin RT / Admin Arisan</strong> yang telah login. Pengunjung umum dapat memantau daftar peserta dan riwayat pemenang.
                    </span>
                  </div>
                </div>
              )}

              {/* Pool Candidates Grid Preview */}
              <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Daftar Calon Yang Diikutkan Pengocokan ({eligiblePeserta.length}):</span>
                  <span className="text-slate-400 text-[10px]">{sudahMenangPeserta.length} sudah menang</span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded-xl">
                  {eligiblePeserta.length > 0 ? (
                    eligiblePeserta.map((p, idx) => (
                      <span 
                        key={p.id} 
                        className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1 shadow-3xs"
                      >
                        <span className="w-4 h-4 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {idx + 1}
                        </span>
                        {p.namaPeserta}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic p-2">Semua peserta telah menang pada periode ini.</span>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* WINNER POPUP CELEBRATION MODAL */}
          {showWinnerModal && currentWinner && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Confetti effect header */}
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-8 h-8 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    🎉 Selamat Kepada Pemenang! 🎉
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 pt-2">{currentWinner.namaPeserta}</h3>
                  <p className="text-xs text-slate-500 font-mono">No. KK: {currentWinner.noKK}</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Total Uang Yang Diterima</span>
                  <h2 className="text-2xl font-black text-emerald-700">Rp {totalHadiahPot.toLocaleString('id-ID')}</h2>
                  <p className="text-[10px] text-emerald-600">Putaran ke-{putaranSaatIni} dari {totalPutaran} Putaran</p>
                </div>

                <p className="text-xs text-slate-500">
                  Data pemenang telah otomatis disimpan ke riwayat dan dieleminasi dari pengocokan selanjutnya hingga seluruh peserta menang.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleShareWinnerWA(currentWinner)}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> Kirim Pengumuman ke WA
                  </button>
                  <button
                    onClick={() => setShowWinnerModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TAB: PESERTA ARISAN */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'peserta' && (
        <div id="peserta-arisan-panel" className="space-y-6">
          
          {newCycleNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-emerald-950 text-xs">Siklus Arisan Baru Aktif!</h5>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">{newCycleNotice}</p>
                </div>
              </div>
              <button 
                onClick={() => setNewCycleNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>
          )}

          {addPesertaMsg && (
            <div className={`p-4 border rounded-2xl text-xs flex items-center gap-2.5 ${
              addPesertaMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{addPesertaMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Tambah Peserta dari Warga (Left) */}
            {isArisanAdmin ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs h-fit space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" /> Tambah Peserta dari Data Warga
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pilih warga RT yang akan didaftarkan mengikuti arisan.
                  </p>
                </div>

                {/* Search bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="search-warga-arisan-input"
                    type="text"
                    placeholder="Cari nama Kepala Keluarga / No KK..."
                    value={searchWarga}
                    onChange={(e) => setSearchWarga(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Available Warga List */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {filteredAvailableWarga.length > 0 ? (
                    filteredAvailableWarga.map((w) => (
                      <div 
                        key={w.id}
                        className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 rounded-xl flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="space-y-0.5 truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{w.namaKK}</p>
                          <p className="text-[10px] text-slate-400 font-mono">KK: {w.noKK}</p>
                        </div>
                        <button
                          onClick={() => handleAddPesertaClick(w)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Pilih
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      {availableWarga.length === 0 ? 'Seluruh warga telah terdaftar di arisan.' : 'Tidak ada warga yang cocok dengan pencarian.'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs h-fit space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Tambah Peserta Arisan
                    </h4>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      Khusus Admin RT / Admin Arisan
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    Pendaftaran warga RT menjadi peserta arisan hanya dapat dilakukan oleh <strong>Admin RT / Admin Arisan</strong> yang telah login.
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Sebagai Warga / Tamu:</p>
                    <p className="text-slate-500">Anda dapat melihat daftar seluruh peserta terdaftar, status keikutsertaan, dan nomor putaran di tabel sebelah kanan.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Peserta Table (Right) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Daftar Peserta Arisan Terdaftar ({totalPeserta})
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Iuran per peserta: Rp {nominalPerPeserta.toLocaleString('id-ID')} / bulan
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                    {sudahMenangPeserta.length} Sudah Menang • {eligiblePeserta.length} Belum
                  </span>
                  {isArisanAdmin && (
                    <button
                      type="button"
                      id="btn-peserta-new-cycle"
                      onClick={() => {
                        setNewCycleForm({
                          namaArisan: config.namaArisan || 'Arisan Warga RT 01',
                          nominalIuran: config.nominalIuran || 50000,
                          tanggalPengocokan: config.tanggalPengocokan || 'Tanggal 15 Setiap Bulan'
                        });
                        setIsNewCycleModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-amber-100/80 hover:bg-amber-200/80 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Mulai siklus baru dan kosongkan peserta saat ini"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-700" />
                      <span>Mulai Siklus Baru</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-3">Nama Peserta</th>
                      <th className="py-2.5 px-3">No. KK</th>
                      <th className="py-2.5 px-3">Status Undian</th>
                      {isArisanAdmin && <th className="py-2.5 px-3 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {pesertaList.length > 0 ? (
                      pesertaList.map((peserta, idx) => (
                        <tr key={peserta.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{peserta.namaPeserta}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{peserta.noKK}</td>
                          <td className="py-2.5 px-3">
                            {peserta.sudahMenang ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                                <Trophy className="w-3 h-3" /> Sudah Dapat (Putaran {peserta.menangPeriodeKe || 1})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">
                                <Clock className="w-3 h-3 text-amber-500" /> Belum Dapat
                              </span>
                            )}
                          </td>
                          {isArisanAdmin && (
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus "${peserta.namaPeserta}" dari peserta arisan?`)) {
                                    onDeletePeserta(peserta.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Peserta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          Belum ada peserta arisan terdaftar. Silakan pilih dari daftar warga sebelah kiri.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TAB: SETORAN ARISAN BULANAN */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'setoran' && (
        <div id="setoran-arisan-panel" className="space-y-6">
          
          {setoranMsg && (
            <div className={`p-4 border rounded-2xl text-xs flex items-center gap-2.5 ${
              setoranMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{setoranMsg.text}</span>
            </div>
          )}

          {/* Month selector & quick stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pilih Bulan Setoran</h4>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="select-bulan-setoran-input"
                    type="month"
                    value={selectedBulan}
                    onChange={(e) => setSelectedBulan(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-xs font-bold text-amber-700">{getBulanLabel(selectedBulan)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Terkumpul Bulan Ini</span>
                <span className="text-base font-black text-emerald-600">
                  Rp {totalTerkumpulBulanIni.toLocaleString('id-ID')} / Rp {totalHadiahPot.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Lunas</span>
                <span className="text-base font-black text-blue-600">
                  {paidPesertaIds.size} / {totalPeserta} Peserta
                </span>
              </div>
            </div>
          </div>

          {/* Setoran Checklist Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs space-y-4">
            {!isArisanAdmin && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Mode Hanya Lihat:</strong> Rekapitulasi pembayaran iuran arisan. Pencatatan dan perubahan status <strong>Lunas</strong> hanya dapat dilakukan oleh <strong>Admin RT / Admin Arisan</strong> yang telah login.</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold shrink-0">Khusus Admin</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matriks Pembayaran Iuran Bulan {getBulanLabel(selectedBulan)}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isArisanAdmin 
                    ? 'Klik tombol "Tandai Lunas" untuk mencatat setoran warga secara instan.' 
                    : 'Daftar status setoran warga RT untuk periode bulan terpilih.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">Nama Peserta</th>
                    <th className="py-2.5 px-3">No. KK</th>
                    <th className="py-2.5 px-3">Nominal</th>
                    <th className="py-2.5 px-3">Status Setoran</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pesertaList.length > 0 ? (
                    pesertaList.map((peserta, idx) => {
                      const isLunas = paidPesertaIds.has(peserta.id);
                      return (
                        <tr key={peserta.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{peserta.namaPeserta}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{peserta.noKK}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            Rp {nominalPerPeserta.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3">
                            {isLunas ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> LUNAS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-rose-500" /> BELUM BAYAR
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isArisanAdmin ? (
                              <button
                                id={`toggle-setoran-${peserta.id}`}
                                onClick={async () => {
                                  if (soundEnabled) playSoundEffect('click');
                                  await onBatchSetoranToggle(peserta.id, selectedBulan, putaranSaatIni, !isLunas);
                                  setSetoranMsg({ 
                                    type: 'success', 
                                    text: `Status pembayaran ${peserta.namaPeserta} diubah menjadi ${!isLunas ? 'LUNAS' : 'BELUM BAYAR'}.` 
                                  });
                                  setTimeout(() => setSetoranMsg(null), 2500);
                                }}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  isLunas 
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                }`}
                              >
                                {isLunas ? 'Batalkan Lunas' : 'Tandai Lunas ✓'}
                              </button>
                            ) : (
                              <button
                                disabled={true}
                                title="Hanya Admin RT / Admin Arisan yang dapat mengubah status pembayaran"
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1 ml-auto select-none"
                              >
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Khusus Admin</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Belum ada peserta arisan terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. TAB: RIWAYAT PEMENANG */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'pemenang' && (
        <div id="riwayat-pemenang-panel" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Daftar Riwayat Pemenang Arisan
              </h4>
              <p className="text-[10px] text-slate-400">
                Pemenang pada putaran-putaran yang telah selesai dikocok.
              </p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {pemenangList.length} Putaran Selesai
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-center w-16">Putaran</th>
                  <th className="py-2.5 px-3">Tanggal Kocok</th>
                  <th className="py-2.5 px-3">Nama Pemenang</th>
                  <th className="py-2.5 px-3">No. KK</th>
                  <th className="py-2.5 px-3">Total Hadiah (Pot)</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pemenangList.length > 0 ? (
                  pemenangList.map((winner) => (
                    <tr key={winner.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black">
                          Ke-{winner.periodeKe}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[11px] text-slate-700 whitespace-nowrap">
                        {formatTanggalIndo(winner.tanggalKocok, 'full')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{winner.namaPeserta}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{winner.noKK}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-600">
                        Rp {winner.totalHadiah.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            const p = pesertaList.find(x => x.id === winner.pesertaId) || {
                              id: winner.pesertaId,
                              wargaId: '',
                              namaPeserta: winner.namaPeserta,
                              noKK: winner.noKK,
                              tanggalGabung: '',
                              sudahMenang: true
                            };
                            handleShareWinnerWA(p);
                          }}
                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                          title="Bagikan ke WhatsApp"
                        >
                          <Share2 className="w-3 h-3" /> Bagikan WA
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Belum ada pemenang yang diundi. Silakan buka tab "Kocok Arisan" untuk mengundi pemenang pertama.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. TAB: PENGATURAN ARISAN */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'settings' && isArisanAdmin && (
        <div id="pengaturan-arisan-panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs space-y-6 max-w-2xl">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-amber-600" /> Konfigurasi Parameter Arisan RT
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Atur nama grup arisan, nominal iuran bulanan per warga, dan tanggal pengocokan rutin.
            </p>
          </div>

          {configMsg && (
            <div className={`p-3.5 border rounded-xl text-xs flex items-center gap-2 ${
              configMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{configMsg.text}</span>
            </div>
          )}

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              await onSaveConfig(editConfig);
              setConfigMsg({ type: 'success', text: 'Pengaturan arisan berhasil disimpan!' });
              setTimeout(() => setConfigMsg(null), 3000);
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nama Grup Arisan</label>
              <input
                type="text"
                value={editConfig.namaArisan}
                onChange={(e) => setEditConfig({ ...editConfig, namaArisan: e.target.value })}
                placeholder="Contoh: Arisan Warga RT 01"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nominal Iuran per Peserta (Rp / Bulan)</label>
              <input
                type="number"
                min="5000"
                step="5000"
                value={editConfig.nominalIuran}
                onChange={(e) => setEditConfig({ ...editConfig, nominalIuran: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400">Total hadiah per putaran: {totalPeserta} peserta x Rp {editConfig.nominalIuran.toLocaleString('id-ID')} = Rp {(totalPeserta * editConfig.nominalIuran).toLocaleString('id-ID')}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Jadwal / Tanggal Pengocokan Rutin</label>
              <input
                type="text"
                value={editConfig.tanggalPengocokan}
                onChange={(e) => setEditConfig({ ...editConfig, tanggalPengocokan: e.target.value })}
                placeholder="Contoh: Tanggal 15 Setiap Bulan"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Simpan Konfigurasi Arisan
              </button>
            </div>
          </form>

          {/* Section Mulai Siklus Baru */}
          <div className="pt-5 border-t border-slate-200">
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <h5 className="text-xs font-bold text-slate-900">Mulai Siklus Arisan Baru</h5>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Gunakan fitur ini ketika satu siklus arisan telah selesai (semua peserta menang) atau jika ingin membuka periode siklus baru. Memulai siklus baru akan <strong>mengosongkan daftar peserta lama</strong> untuk persiapan pendaftaran peserta baru (peserta dapat bertambah/berkurang dan nominal iuran dapat disesuaikan). Riwayat pemenang siklus sebelumnya tetap aman tersimpan.
              </p>
              <button
                type="button"
                id="btn-open-new-cycle-settings"
                onClick={() => {
                  setNewCycleForm({
                    namaArisan: editConfig.namaArisan || config.namaArisan || 'Arisan Warga RT 01',
                    nominalIuran: editConfig.nominalIuran || config.nominalIuran || 50000,
                    tanggalPengocokan: editConfig.tanggalPengocokan || config.tanggalPengocokan || 'Tanggal 15 Setiap Bulan'
                  });
                  setIsNewCycleModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Buka Modal Mulai Siklus Baru
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. MODAL: MULAI SIKLUS ARISAN BARU */}
      {/* ------------------------------------------------------------- */}
      {isNewCycleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Mulai Siklus Arisan Baru</h3>
                  <p className="text-[11px] text-slate-500">Persiapan Peserta & Nominal Iuran Siklus Baru</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewCycleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl text-xs text-amber-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                Informasi & Ketentuan Siklus Baru:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800 leading-relaxed">
                <li><strong>Data Peserta Lama Dikosongkan:</strong> Daftar peserta saat ini akan dibersihkan agar Anda dapat menginput peserta yang baru (fleksibel jika ada penambahan atau pengurangan warga).</li>
                <li><strong>Riwayat Pemenang Tetap Tersimpan:</strong> Seluruh riwayat pemenang putaran sebelumnya tetap tercatat di tab Riwayat Pemenang untuk transparansi.</li>
                <li><strong>Penyesuaian Nominal:</strong> Anda dapat mengubah besaran nominal iuran bulanan per warga untuk siklus baru ini.</li>
              </ul>
            </div>

            <form onSubmit={handleExecuteNewCycle} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Grup / Siklus Arisan</label>
                <input
                  type="text"
                  required
                  value={newCycleForm.namaArisan}
                  onChange={(e) => setNewCycleForm({ ...newCycleForm, namaArisan: e.target.value })}
                  placeholder="Contoh: Arisan Warga RT 01"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nominal Iuran Baru per Peserta (Rp / Bulan)
                </label>
                <input
                  type="number"
                  required
                  min="5000"
                  step="5000"
                  value={newCycleForm.nominalIuran}
                  onChange={(e) => setNewCycleForm({ ...newCycleForm, nominalIuran: parseInt(e.target.value, 10) || 0 })}
                  placeholder="50000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400">
                  Besaran iuran baru: <strong>Rp {Number(newCycleForm.nominalIuran || 0).toLocaleString('id-ID')}</strong> per orang / bulan
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Jadwal / Tanggal Pengocokan Rutin</label>
                <input
                  type="text"
                  value={newCycleForm.tanggalPengocokan}
                  onChange={(e) => setNewCycleForm({ ...newCycleForm, tanggalPengocokan: e.target.value })}
                  placeholder="Contoh: Tanggal 15 Setiap Bulan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewCycleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  id="btn-confirm-start-new-cycle"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Mulai Siklus Baru & Input Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
