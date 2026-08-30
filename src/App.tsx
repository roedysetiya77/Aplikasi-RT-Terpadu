import { useState, useEffect } from 'react';
import { 
  Petugas, 
  Warga, 
  JadwalMingguan, 
  JimpitanRecord, 
  CurrentUser, 
  ArisanPeserta,
  ArisanSetoran,
  ArisanPemenang,
  ArisanConfig,
  KeuanganRecord,
  TutupBukuRecord,
  DaruratRecord,
  WalkieTalkieRecord
} from './types';
import { 
  INITIAL_PETUGAS, 
  INITIAL_WARGA, 
  INITIAL_JADWAL, 
  getInitialJimpitan,
  INITIAL_ARISAN_CONFIG,
  INITIAL_ARISAN_PESERTA,
  INITIAL_ARISAN_PEMENANG,
  INITIAL_ARISAN_SETORAN,
  INITIAL_KEUANGAN,
  INITIAL_TUTUP_BUKU,
  INITIAL_DARURAT,
  INITIAL_WALKIE_TALKIE,
  recalculateSaldo,
  normalizeDateString,
  normalizeMonthString
} from './initialData';

// Components
import LoginForm from './components/LoginForm';
import WargaPanel from './components/WargaPanel';
import PetugasPanel from './components/PetugasPanel';
import JadwalPanel from './components/JadwalPanel';
import JimpitanInputForm from './components/JimpitanInputForm';
import LaporanBulanan from './components/LaporanBulanan';
import GuideModal from './components/GuideModal';
import DashboardPanel from './components/DashboardPanel';
import ArisanPanel from './components/ArisanPanel';
import KeuanganPanel from './components/KeuanganPanel';
import KeamananPanel from './components/KeamananPanel';
import EmergencyAlertModal from './components/EmergencyAlertModal';

// Icons
import { 
  LogOut, 
  Database, 
  Calendar, 
  Users, 
  ClipboardCheck, 
  FileText, 
  BookOpen, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  LayoutDashboard,
  Dices,
  Wallet,
  Siren,
  Radio,
  ShieldAlert
} from 'lucide-react';

export const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/Your ID Web DEPLOY/exec';

export default function App() {
  // Load configuration from localStorage or default embedded URL
  const [webAppUrl, setWebAppUrl] = useState<string>(() => {
    const saved = localStorage.getItem('jimpitan_webapp_url');
    if (!saved) {
      localStorage.setItem('jimpitan_webapp_url', DEFAULT_WEBAPP_URL);
      return DEFAULT_WEBAPP_URL;
    }
    return saved;
  });

  // Main data states
  const [petugas, setPetugas] = useState<Petugas[]>([]);
  const [warga, setWarga] = useState<Warga[]>([]);
  const [jadwal, setJadwal] = useState<JadwalMingguan[]>([]);
  const [jimpitan, setJimpitan] = useState<JimpitanRecord[]>([]);

  // Arisan RT data states
  const [arisanPeserta, setArisanPeserta] = useState<ArisanPeserta[]>([]);
  const [arisanSetoran, setArisanSetoran] = useState<ArisanSetoran[]>([]);
  const [arisanPemenang, setArisanPemenang] = useState<ArisanPemenang[]>([]);
  const [arisanConfig, setArisanConfig] = useState<ArisanConfig>(INITIAL_ARISAN_CONFIG);

  // Keuangan RT data states
  const [keuangan, setKeuangan] = useState<KeuanganRecord[]>([]);
  const [tutupBuku, setTutupBuku] = useState<TutupBukuRecord[]>([]);

  // Keamanan & Darurat & Walkie Talkie data states
  const [darurat, setDarurat] = useState<DaruratRecord[]>([]);
  const [walkieTalkie, setWalkieTalkie] = useState<WalkieTalkieRecord[]>([]);

  // UI state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // 'dashboard', 'keuangan', 'arisan', 'keamanan', 'laporan', 'input', 'warga', 'petugas', 'jadwal'
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize data from localstorage or initial dummy data
  useEffect(() => {
    const cachedPetugas = localStorage.getItem('jimpitan_local_petugas');
    const cachedWarga = localStorage.getItem('jimpitan_local_warga');
    const cachedJadwal = localStorage.getItem('jimpitan_local_jadwal');
    const cachedJimpitan = localStorage.getItem('jimpitan_local_jimpitan');
    const cachedArisanPeserta = localStorage.getItem('jimpitan_local_arisan_peserta');
    const cachedArisanSetoran = localStorage.getItem('jimpitan_local_arisan_setoran');
    const cachedArisanPemenang = localStorage.getItem('jimpitan_local_arisan_pemenang');
    const cachedArisanConfig = localStorage.getItem('jimpitan_local_arisan_config');
    const cachedKeuangan = localStorage.getItem('jimpitan_local_keuangan');
    const cachedTutupBuku = localStorage.getItem('jimpitan_local_tutup_buku');
    const cachedDarurat = localStorage.getItem('jimpitan_local_darurat');
    const cachedWalkie = localStorage.getItem('jimpitan_local_walkie_talkie');

    if (cachedPetugas) setPetugas(JSON.parse(cachedPetugas));
    else {
      setPetugas(INITIAL_PETUGAS);
      localStorage.setItem('jimpitan_local_petugas', JSON.stringify(INITIAL_PETUGAS));
    }

    if (cachedWarga) setWarga(JSON.parse(cachedWarga));
    else {
      setWarga(INITIAL_WARGA);
      localStorage.setItem('jimpitan_local_warga', JSON.stringify(INITIAL_WARGA));
    }

    if (cachedJadwal) setJadwal(JSON.parse(cachedJadwal));
    else {
      setJadwal(INITIAL_JADWAL);
      localStorage.setItem('jimpitan_local_jadwal', JSON.stringify(INITIAL_JADWAL));
    }

    if (cachedJimpitan) setJimpitan(JSON.parse(cachedJimpitan));
    else {
      const records = getInitialJimpitan();
      setJimpitan(records);
      localStorage.setItem('jimpitan_local_jimpitan', JSON.stringify(records));
    }

    if (cachedArisanPeserta) setArisanPeserta(JSON.parse(cachedArisanPeserta));
    else {
      setArisanPeserta(INITIAL_ARISAN_PESERTA);
      localStorage.setItem('jimpitan_local_arisan_peserta', JSON.stringify(INITIAL_ARISAN_PESERTA));
    }

    if (cachedArisanSetoran) setArisanSetoran(JSON.parse(cachedArisanSetoran));
    else {
      setArisanSetoran(INITIAL_ARISAN_SETORAN);
      localStorage.setItem('jimpitan_local_arisan_setoran', JSON.stringify(INITIAL_ARISAN_SETORAN));
    }

    if (cachedArisanPemenang) setArisanPemenang(JSON.parse(cachedArisanPemenang));
    else {
      setArisanPemenang(INITIAL_ARISAN_PEMENANG);
      localStorage.setItem('jimpitan_local_arisan_pemenang', JSON.stringify(INITIAL_ARISAN_PEMENANG));
    }

    if (cachedArisanConfig) setArisanConfig(JSON.parse(cachedArisanConfig));
    else {
      setArisanConfig(INITIAL_ARISAN_CONFIG);
      localStorage.setItem('jimpitan_local_arisan_config', JSON.stringify(INITIAL_ARISAN_CONFIG));
    }

    if (cachedKeuangan) {
      setKeuangan(recalculateSaldo(JSON.parse(cachedKeuangan)));
    } else {
      const calculated = recalculateSaldo(INITIAL_KEUANGAN);
      setKeuangan(calculated);
      localStorage.setItem('jimpitan_local_keuangan', JSON.stringify(calculated));
    }

    if (cachedTutupBuku) setTutupBuku(JSON.parse(cachedTutupBuku));
    else {
      setTutupBuku(INITIAL_TUTUP_BUKU);
      localStorage.setItem('jimpitan_local_tutup_buku', JSON.stringify(INITIAL_TUTUP_BUKU));
    }

    if (cachedDarurat) setDarurat(JSON.parse(cachedDarurat));
    else {
      setDarurat(INITIAL_DARURAT);
      localStorage.setItem('jimpitan_local_darurat', JSON.stringify(INITIAL_DARURAT));
    }

    if (cachedWalkie) setWalkieTalkie(JSON.parse(cachedWalkie));
    else {
      setWalkieTalkie(INITIAL_WALKIE_TALKIE);
      localStorage.setItem('jimpitan_local_walkie_talkie', JSON.stringify(INITIAL_WALKIE_TALKIE));
    }

    // BroadcastChannel & window storage real-time listener across open tabs
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('rt_darurat_channel');
      channel.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'DARURAT_ALERT') {
          setDarurat(prev => [data.payload, ...prev]);
        } else if (data.type === 'DARURAT_RESOLVE') {
          setDarurat(prev => prev.map(d => d.id === data.payload.id ? { 
            ...d, 
            status: 'SELESAI', 
            ditanganiOleh: data.payload.ditanganiOleh, 
            waktuSelesai: new Date().toISOString() 
          } : d));
        } else if (data.type === 'WALKIE_TALKIE_MESSAGE') {
          setWalkieTalkie(prev => [data.payload, ...prev]);
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jimpitan_local_darurat' && e.newValue) {
        setDarurat(JSON.parse(e.newValue));
      } else if (e.key === 'jimpitan_local_walkie_talkie' && e.newValue) {
        setWalkieTalkie(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Try auto-fetching from webApp on launch if URL exists
    if (webAppUrl) {
      handleSyncFetch(webAppUrl);
    }

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update localStorage helper whenever state changes
  const updateLocalAndState = (
    type: 'petugas' | 'warga' | 'jadwal' | 'jimpitan' | 'arisanPeserta' | 'arisanSetoran' | 'arisanPemenang' | 'arisanConfig' | 'keuangan' | 'tutupBuku' | 'darurat' | 'walkieTalkie', 
    updatedData: any
  ) => {
    if (type === 'petugas') {
      setPetugas(updatedData);
      localStorage.setItem('jimpitan_local_petugas', JSON.stringify(updatedData));
    } else if (type === 'warga') {
      setWarga(updatedData);
      localStorage.setItem('jimpitan_local_warga', JSON.stringify(updatedData));
    } else if (type === 'jadwal') {
      setJadwal(updatedData);
      localStorage.setItem('jimpitan_local_jadwal', JSON.stringify(updatedData));
    } else if (type === 'jimpitan') {
      setJimpitan(updatedData);
      localStorage.setItem('jimpitan_local_jimpitan', JSON.stringify(updatedData));
    } else if (type === 'arisanPeserta') {
      setArisanPeserta(updatedData);
      localStorage.setItem('jimpitan_local_arisan_peserta', JSON.stringify(updatedData));
    } else if (type === 'arisanSetoran') {
      setArisanSetoran(updatedData);
      localStorage.setItem('jimpitan_local_arisan_setoran', JSON.stringify(updatedData));
    } else if (type === 'arisanPemenang') {
      setArisanPemenang(updatedData);
      localStorage.setItem('jimpitan_local_arisan_pemenang', JSON.stringify(updatedData));
    } else if (type === 'arisanConfig') {
      setArisanConfig(updatedData);
      localStorage.setItem('jimpitan_local_arisan_config', JSON.stringify(updatedData));
    } else if (type === 'keuangan') {
      const recalculated = recalculateSaldo(updatedData);
      setKeuangan(recalculated);
      localStorage.setItem('jimpitan_local_keuangan', JSON.stringify(recalculated));
    } else if (type === 'tutupBuku') {
      setTutupBuku(updatedData);
      localStorage.setItem('jimpitan_local_tutup_buku', JSON.stringify(updatedData));
    } else if (type === 'darurat') {
      setDarurat(updatedData);
      localStorage.setItem('jimpitan_local_darurat', JSON.stringify(updatedData));
    } else if (type === 'walkieTalkie') {
      setWalkieTalkie(updatedData);
      localStorage.setItem('jimpitan_local_walkie_talkie', JSON.stringify(updatedData));
    }
  };

  // Helper to trigger fetch (GET)
  const handleSyncFetch = async (targetUrl = webAppUrl) => {
    if (!targetUrl) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch(targetUrl, { 
        method: 'GET',
        mode: 'cors'
      });
      const data = await response.json();
      if (data && data.status === 'success') {
        if (data.petugas) {
          const sanitizedPetugas = (data.petugas as any[]).map(p => ({
            ...p,
            role: p.role || (
              p.username && p.username.toLowerCase().includes('bendahara') 
                ? 'admin_bendahara' 
                : p.username && p.username.toLowerCase().includes('arisan') 
                ? 'admin_arisan' 
                : 'petugas'
            )
          }));
          updateLocalAndState('petugas', sanitizedPetugas);
        }
        if (data.warga) updateLocalAndState('warga', data.warga);
        if (data.jadwal) updateLocalAndState('jadwal', data.jadwal);
        if (data.jimpitan && Array.isArray(data.jimpitan)) {
          const sanitizedJimpitan = (data.jimpitan as any[]).map(j => ({
            ...j,
            tanggal: normalizeDateString(j.tanggal),
            jumlah: Number(j.jumlah) || 0
          }));
          updateLocalAndState('jimpitan', sanitizedJimpitan);
        }
        if (data.arisanPeserta && Array.isArray(data.arisanPeserta)) {
          const sanitizedPeserta = (data.arisanPeserta as any[]).map(p => ({
            ...p,
            tanggalGabung: normalizeDateString(p.tanggalGabung),
            tanggalMenang: p.tanggalMenang ? normalizeDateString(p.tanggalMenang) : undefined,
            sudahMenang: p.sudahMenang === true || String(p.sudahMenang).toLowerCase() === 'true',
            nomorUrut: Number(p.nomorUrut) || 1
          }));
          updateLocalAndState('arisanPeserta', sanitizedPeserta);
        }
        if (data.arisanSetoran && Array.isArray(data.arisanSetoran)) {
          const sanitizedSetoran = (data.arisanSetoran as any[]).map(s => {
            let bulanStr = String(s.bulan || '').trim();
            if (bulanStr.includes('T')) {
              const clean = normalizeDateString(bulanStr);
              bulanStr = clean ? clean.substring(0, 7) : bulanStr.split('T')[0].substring(0, 7);
            } else if (bulanStr.length > 7 && bulanStr.includes('-')) {
              bulanStr = bulanStr.substring(0, 7);
            }
            return {
              ...s,
              bulan: bulanStr,
              tanggalBayar: s.tanggalBayar ? normalizeDateString(s.tanggalBayar) : undefined,
              status: String(s.status || '').toLowerCase().trim() === 'lunas' ? 'lunas' : 'belum',
              jumlah: Number(s.jumlah) || 0
            };
          });
          updateLocalAndState('arisanSetoran', sanitizedSetoran);
        }
        if (data.arisanPemenang && Array.isArray(data.arisanPemenang)) {
          const sanitizedPemenang = (data.arisanPemenang as any[]).map(p => ({
            ...p,
            tanggalKocok: normalizeDateString(p.tanggalKocok),
            totalHadiah: Number(p.totalHadiah) || 0
          }));
          updateLocalAndState('arisanPemenang', sanitizedPemenang);
        }
        if (data.arisanConfig) updateLocalAndState('arisanConfig', data.arisanConfig);
        
        // Keuangan & Tutup Buku
        if (data.keuangan && Array.isArray(data.keuangan)) {
          const sanitizedKeuangan = (data.keuangan as any[]).map(k => {
            const cleanTgl = normalizeDateString(k.tanggal);
            const cleanBulan = normalizeMonthString(k.bulanBuku || cleanTgl);
            const rawDebit = typeof k.debit === 'string' ? Number(String(k.debit).replace(/[^0-9.-]/g, '')) || 0 : Number(k.debit) || 0;
            const rawKredit = typeof k.kredit === 'string' ? Number(String(k.kredit).replace(/[^0-9.-]/g, '')) || 0 : Number(k.kredit) || 0;
            const rawSaldo = typeof k.saldo === 'string' ? Number(String(k.saldo).replace(/[^0-9.-]/g, '')) || 0 : Number(k.saldo) || 0;
            
            let jenis: 'pemasukan' | 'pengeluaran' = 'pemasukan';
            const rawJenis = String(k.jenis || '').toLowerCase().trim();
            if (rawJenis === 'pengeluaran' || (rawKredit > 0 && rawDebit === 0)) {
              jenis = 'pengeluaran';
            } else {
              jenis = 'pemasukan';
            }

            return {
              ...k,
              tanggal: cleanTgl,
              jenis,
              kategori: k.kategori || (jenis === 'pemasukan' ? 'Lain-lain Pemasukan' : 'Lain-lain Pengeluaran'),
              keterangan: k.keterangan || '',
              bulanBuku: cleanBulan,
              debit: rawDebit,
              kredit: rawKredit,
              saldo: rawSaldo,
              dicatatOleh: k.dicatatOleh || 'Bendahara RT',
              isTutupBuku: k.isTutupBuku === true || String(k.isTutupBuku).toLowerCase() === 'true'
            };
          });
          const recalculated = recalculateSaldo(sanitizedKeuangan);
          updateLocalAndState('keuangan', recalculated);
        }
        if (data.tutupBuku && Array.isArray(data.tutupBuku)) {
          const sanitizedTutupBuku = (data.tutupBuku as any[]).map(tb => {
            const cleanTgl = normalizeDateString(tb.tanggalTutup);
            const cleanBulan = normalizeMonthString(tb.bulanBuku || cleanTgl);
            return {
              ...tb,
              tanggalTutup: cleanTgl,
              bulanBuku: cleanBulan,
              saldoAwal: Number(tb.saldoAwal) || 0,
              totalPemasukan: Number(tb.totalPemasukan) || 0,
              totalPengeluaran: Number(tb.totalPengeluaran) || 0,
              saldoAkhir: Number(tb.saldoAkhir) || 0
            };
          });
          updateLocalAndState('tutupBuku', sanitizedTutupBuku);
        }

        if (data.darurat && Array.isArray(data.darurat)) {
          updateLocalAndState('darurat', data.darurat);
        }
        if (data.walkieTalkie && Array.isArray(data.walkieTalkie)) {
          updateLocalAndState('walkieTalkie', data.walkieTalkie);
        }

        setSyncMessage({ type: 'success', text: 'Data berhasil disinkronkan dengan Google Sheets!' });
        setTimeout(() => setSyncMessage(null), 3500);
      } else {
        setSyncMessage({ type: 'error', text: data.message || 'Gagal memuat data dari spreadsheet.' });
      }
    } catch (err) {
      console.error('Fetch sync error:', err);
      setSyncMessage({ 
        type: 'error', 
        text: 'Gagal menyambung ke Apps Script. Menggunakan data lokal.' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // POST API generic wrapper
  const postToAppsScript = async (payload: any) => {
    if (!webAppUrl) return false;
    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // avoids preflight CORS
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data.status === 'success';
    } catch (err) {
      console.error('Apps Script POST error:', err);
      return false;
    }
  };

  // Saving webAppUrl
  const handleSaveWebAppUrl = (newUrl: string) => {
    const formatted = newUrl.trim();
    setWebAppUrl(formatted);
    localStorage.setItem('jimpitan_webapp_url', formatted);
    if (formatted) {
      handleSyncFetch(formatted);
    } else {
      setSyncMessage({ type: 'success', text: 'URL dihapus. Beralih ke Mode Offline sepenuhnya.' });
      setTimeout(() => setSyncMessage(null), 3500);
    }
  };

  // -------------------------------------------------------------
  // OPERATIONS: Petugas CRUD
  // -------------------------------------------------------------
  const handleAddPetugas = async (newPetugas: Omit<Petugas, 'id'>) => {
    const tempId = `p-${Date.now()}`;
    const item: Petugas = { id: tempId, ...newPetugas };
    const updated = [...petugas, item];
    updateLocalAndState('petugas', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'addPetugas', ...newPetugas });
      if (ok) handleSyncFetch();
    }
  };

  const handleEditPetugas = async (id: string, updatedFields: Omit<Petugas, 'id'>) => {
    const updated = petugas.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    updateLocalAndState('petugas', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'editPetugas', id, ...updatedFields });
      if (ok) handleSyncFetch();
    }
  };

  const handleDeletePetugas = async (id: string) => {
    const updated = petugas.filter(p => p.id !== id);
    updateLocalAndState('petugas', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'deletePetugas', id });
      if (ok) handleSyncFetch();
    }
  };

  // -------------------------------------------------------------
  // OPERATIONS: Warga CRUD
  // -------------------------------------------------------------
  const handleAddWarga = async (newWarga: Omit<Warga, 'id'>) => {
    const tempId = `w-${Date.now()}`;
    const item: Warga = { id: tempId, ...newWarga };
    const updated = [...warga, item];
    updateLocalAndState('warga', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'addWarga', ...newWarga });
      if (ok) handleSyncFetch();
    }
  };

  const handleEditWarga = async (id: string, updatedFields: Omit<Warga, 'id'>) => {
    const updated = warga.map(w => w.id === id ? { ...w, ...updatedFields } : w);
    updateLocalAndState('warga', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'editWarga', id, ...updatedFields });
      if (ok) handleSyncFetch();
    }
  };

  const handleDeleteWarga = async (id: string) => {
    const updated = warga.filter(w => w.id !== id);
    updateLocalAndState('warga', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'deleteWarga', id });
      if (ok) handleSyncFetch();
    }
  };

  // -------------------------------------------------------------
  // OPERATIONS: Jadwal Save
  // -------------------------------------------------------------
  const handleSaveJadwal = async (updatedJadwal: JadwalMingguan[]) => {
    updateLocalAndState('jadwal', updatedJadwal);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'saveJadwal', jadwal: updatedJadwal });
      if (ok) handleSyncFetch();
    }
  };

  // -------------------------------------------------------------
  // OPERATIONS: DARURAT & WALKIE TALKIE
  // -------------------------------------------------------------
  const handleTriggerDarurat = async (newDarurat: Omit<DaruratRecord, 'id' | 'status'>) => {
    const tempId = `d-${Date.now()}`;
    const record: DaruratRecord = {
      ...newDarurat,
      id: tempId,
      status: 'AKTIF'
    };
    const updated = [record, ...darurat];
    updateLocalAndState('darurat', updated);

    // Broadcast live across open tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('rt_darurat_channel');
        bc.postMessage({ type: 'DARURAT_ALERT', payload: record });
        bc.close();
      } catch (e) {
        console.error(e);
      }
    }

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'triggerDarurat', ...record });
      if (ok) handleSyncFetch();
    }
  };

  const handleResolveDarurat = async (id: string, ditanganiOleh: string) => {
    const updated = darurat.map(d => d.id === id ? {
      ...d,
      status: 'SELESAI' as const,
      ditanganiOleh: ditanganiOleh || (currentUser ? currentUser.nama : 'Petugas'),
      waktuSelesai: new Date().toISOString()
    } : d);
    updateLocalAndState('darurat', updated);

    // Broadcast live across open tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('rt_darurat_channel');
        bc.postMessage({ type: 'DARURAT_RESOLVE', payload: { id, ditanganiOleh } });
        bc.close();
      } catch (e) {
        console.error(e);
      }
    }

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'resolveDarurat', id, ditanganiOleh });
      if (ok) handleSyncFetch();
    }
  };

  const handleSendWalkieTalkie = async (newMsg: Omit<WalkieTalkieRecord, 'id' | 'tanggal'>) => {
    const tempId = `wt-${Date.now()}`;
    const record: WalkieTalkieRecord = {
      ...newMsg,
      id: tempId,
      tanggal: new Date().toISOString()
    };
    const updated = [record, ...walkieTalkie];
    updateLocalAndState('walkieTalkie', updated);

    // Broadcast live across open tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('rt_darurat_channel');
        bc.postMessage({ type: 'WALKIE_TALKIE_MESSAGE', payload: record });
        bc.close();
      } catch (e) {
        console.error(e);
      }
    }

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'addWalkieTalkie', ...record });
      if (ok) handleSyncFetch();
    }
  };

  // -------------------------------------------------------------
  // OPERATIONS: Jimpitan record addition
  // -------------------------------------------------------------
  const handleAddJimpitan = async (newRecord: Omit<JimpitanRecord, 'id'>) => {
    const tempId = `t-${Date.now()}`;
    const item: JimpitanRecord = { id: tempId, ...newRecord };
    const updated = [item, ...jimpitan];
    updateLocalAndState('jimpitan', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'addJimpitan', ...newRecord });
      if (ok) handleSyncFetch();
    }
  };

  // -------------------------------------------------------------
  // OPERATIONS: KEUANGAN RT & TUTUP BUKU
  // -------------------------------------------------------------
  const handleAddKeuangan = async (newRecord: Omit<KeuanganRecord, 'id' | 'saldo'>) => {
    const tempId = `k-${Date.now()}`;
    const cleanTanggal = normalizeDateString(newRecord.tanggal);
    const debit = Number(newRecord.debit) || 0;
    const kredit = Number(newRecord.kredit) || 0;
    const bulanBuku = normalizeMonthString(newRecord.bulanBuku || cleanTanggal);
    
    let jenis: 'pemasukan' | 'pengeluaran' = 'pemasukan';
    const rawJenis = String(newRecord.jenis || '').toLowerCase().trim();
    if (rawJenis === 'pengeluaran' || (kredit > 0 && debit === 0)) {
      jenis = 'pengeluaran';
    } else {
      jenis = 'pemasukan';
    }

    const item: KeuanganRecord = { 
      id: tempId, 
      saldo: 0, 
      ...newRecord,
      jenis,
      tanggal: cleanTanggal,
      bulanBuku,
      debit,
      kredit
    };
    
    const rawUpdated = [...keuangan, item];
    const updated = recalculateSaldo(rawUpdated);
    updateLocalAndState('keuangan', updated);

    const calculatedItem = updated.find(k => k.id === tempId);
    const calculatedSaldo = calculatedItem ? calculatedItem.saldo : (debit - kredit);

    if (webAppUrl) {
      const ok = await postToAppsScript({ 
        action: 'addKeuangan', 
        id: tempId,
        saldo: calculatedSaldo,
        ...newRecord,
        jenis,
        tanggal: cleanTanggal,
        bulanBuku,
        debit,
        kredit
      });
      if (ok) handleSyncFetch();
    }
  };

  const handleEditKeuangan = async (id: string, updatedFields: Omit<KeuanganRecord, 'id' | 'saldo'>) => {
    const cleanTanggal = normalizeDateString(updatedFields.tanggal);
    const debit = Number(updatedFields.debit) || 0;
    const kredit = Number(updatedFields.kredit) || 0;
    const bulanBuku = normalizeMonthString(updatedFields.bulanBuku || cleanTanggal);

    let jenis: 'pemasukan' | 'pengeluaran' = 'pemasukan';
    const rawJenis = String(updatedFields.jenis || '').toLowerCase().trim();
    if (rawJenis === 'pengeluaran' || (kredit > 0 && debit === 0)) {
      jenis = 'pengeluaran';
    } else {
      jenis = 'pemasukan';
    }

    const rawUpdated = keuangan.map(k => k.id === id ? { 
      ...k, 
      ...updatedFields,
      jenis,
      tanggal: cleanTanggal,
      bulanBuku,
      debit,
      kredit
    } : k);

    const updated = recalculateSaldo(rawUpdated);
    updateLocalAndState('keuangan', updated);

    const calculatedItem = updated.find(k => k.id === id);
    const calculatedSaldo = calculatedItem ? calculatedItem.saldo : 0;

    if (webAppUrl) {
      const ok = await postToAppsScript({ 
        action: 'editKeuangan', 
        id, 
        saldo: calculatedSaldo,
        ...updatedFields,
        jenis,
        tanggal: cleanTanggal,
        bulanBuku,
        debit,
        kredit
      });
      if (ok) handleSyncFetch();
    }
  };

  const handleDeleteKeuangan = async (id: string) => {
    const rawUpdated = keuangan.filter(k => k.id !== id);
    const updated = recalculateSaldo(rawUpdated);
    updateLocalAndState('keuangan', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'deleteKeuangan', id });
      if (ok) handleSyncFetch();
    }
  };

  const handleTutupBuku = async (data: {
    tutupBukuRecord: TutupBukuRecord;
    saldoAwalRecord: Omit<KeuanganRecord, 'id' | 'saldo'>;
  }) => {
    // 1. Add Tutup Buku entry
    const updatedTutupBuku = [data.tutupBukuRecord, ...tutupBuku];
    updateLocalAndState('tutupBuku', updatedTutupBuku);

    // 2. Add next month's opening balance record in Keuangan
    const openingKeuanganItem: KeuanganRecord = {
      id: `sa-${data.tutupBukuRecord.bulanBuku}`,
      saldo: Number(data.saldoAwalRecord.debit) || 0,
      ...data.saldoAwalRecord
    };
    const rawUpdatedKeuangan = [...keuangan, openingKeuanganItem];
    const updatedKeuangan = recalculateSaldo(rawUpdatedKeuangan);
    updateLocalAndState('keuangan', updatedKeuangan);

    const calculatedOpening = updatedKeuangan.find(k => k.id === openingKeuanganItem.id);
    const calculatedSaldo = calculatedOpening ? calculatedOpening.saldo : (Number(data.saldoAwalRecord.debit) || 0);

    if (webAppUrl) {
      const ok = await postToAppsScript({
        action: 'tutupBukuKeuangan',
        tutupBukuRecord: data.tutupBukuRecord,
        saldoAwalRecord: {
          ...data.saldoAwalRecord,
          saldo: calculatedSaldo
        }
      });
      if (ok) handleSyncFetch();
    }
  };

  const handleBatalTutupBuku = async (tutupBukuId: string, saldoAwalId?: string) => {
    const updatedTutupBuku = tutupBuku.filter(tb => tb.id !== tutupBukuId);
    updateLocalAndState('tutupBuku', updatedTutupBuku);

    if (saldoAwalId) {
      const rawUpdated = keuangan.filter(k => k.id !== saldoAwalId);
      const updatedKeuangan = recalculateSaldo(rawUpdated);
      updateLocalAndState('keuangan', updatedKeuangan);
    }

    if (webAppUrl) {
      const ok = await postToAppsScript({
        action: 'batalTutupBuku',
        id: tutupBukuId,
        saldoAwalId
      });
      if (ok) handleSyncFetch();
    }
  };

  // -------------------------------------------------------------
  // OPERATIONS: ARISAN RT
  // -------------------------------------------------------------
  const handleAddArisanPeserta = async (w: Warga) => {
    const tempId = `ap-${Date.now()}`;
    const newPeserta: ArisanPeserta = {
      id: tempId,
      wargaId: w.id,
      namaPeserta: w.namaKK,
      noKK: w.noKK,
      nomorUrut: arisanPeserta.length + 1,
      tanggalGabung: new Date().toISOString().split('T')[0],
      sudahMenang: false
    };
    const updated = [...arisanPeserta, newPeserta];
    updateLocalAndState('arisanPeserta', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'addArisanPeserta', ...newPeserta });
      if (ok) handleSyncFetch();
    }
  };

  const handleDeleteArisanPeserta = async (pesertaId: string) => {
    const updated = arisanPeserta.filter(p => p.id !== pesertaId);
    updateLocalAndState('arisanPeserta', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'deleteArisanPeserta', id: pesertaId });
      if (ok) handleSyncFetch();
    }
  };

  const handleSaveArisanSetoran = async (newSetoran: Omit<ArisanSetoran, 'id'>) => {
    const tempId = `as-${Date.now()}`;
    const item: ArisanSetoran = { id: tempId, ...newSetoran };
    const updated = [...arisanSetoran, item];
    updateLocalAndState('arisanSetoran', updated);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'saveArisanSetoran', ...newSetoran });
      if (ok) handleSyncFetch();
    }
  };

  const handleBatchSetoranToggle = async (pesertaId: string, bulan: string, periodeKe: number, isLunas: boolean) => {
    const targetPeserta = arisanPeserta.find(p => p.id === pesertaId);
    if (!targetPeserta) return;

    const normBulan = bulan.length > 7 ? bulan.substring(0, 7) : bulan;
    let updatedSetoran = [...arisanSetoran];
    const existingIndex = updatedSetoran.findIndex(
      s => String(s.pesertaId).trim() === String(pesertaId).trim() && (s.bulan === normBulan || s.bulan.startsWith(normBulan))
    );

    if (existingIndex >= 0) {
      if (isLunas) {
        updatedSetoran[existingIndex] = {
          ...updatedSetoran[existingIndex],
          bulan: normBulan,
          status: 'lunas',
          tanggalBayar: new Date().toISOString().split('T')[0]
        };
      } else {
        updatedSetoran[existingIndex] = {
          ...updatedSetoran[existingIndex],
          bulan: normBulan,
          status: 'belum'
        };
      }
    } else if (isLunas) {
      const newItem: ArisanSetoran = {
        id: `as-${Date.now()}`,
        pesertaId,
        namaPeserta: targetPeserta.namaPeserta,
        noKK: targetPeserta.noKK,
        bulan: normBulan,
        periodeKe,
        jumlah: arisanConfig.nominalIuran || 50000,
        tanggalBayar: new Date().toISOString().split('T')[0],
        status: 'lunas',
        dicatatOleh: currentUser ? currentUser.nama : 'Petugas'
      };
      updatedSetoran.push(newItem);
    }

    updateLocalAndState('arisanSetoran', updatedSetoran);

    if (webAppUrl) {
      const ok = await postToAppsScript({ 
        action: 'toggleArisanSetoran', 
        pesertaId, 
        bulan: normBulan, 
        periodeKe, 
        isLunas,
        nominal: arisanConfig.nominalIuran || 50000,
        namaPeserta: targetPeserta.namaPeserta,
        noKK: targetPeserta.noKK,
        dicatatOleh: currentUser ? currentUser.nama : 'Petugas'
      });
      if (ok) handleSyncFetch();
    }
  };

  const handleKocokArisanWinner = async (winner: ArisanPeserta, totalHadiah: number, bulan: string, catatan?: string) => {
    const putaran = arisanPemenang.length + 1;
    const nowStr = new Date().toISOString().split('T')[0];

    // 1. Update winner participant record to marked as won
    const updatedPeserta = arisanPeserta.map(p => 
      p.id === winner.id 
        ? { ...p, sudahMenang: true, menangPeriodeKe: putaran, tanggalMenang: nowStr }
        : p
    );
    updateLocalAndState('arisanPeserta', updatedPeserta);

    // 2. Add to pemenang records
    const newWinnerRecord: ArisanPemenang = {
      id: `aw-${Date.now()}`,
      periodeKe: putaran,
      tanggalKocok: nowStr,
      pesertaId: winner.id,
      namaPeserta: winner.namaPeserta,
      noKK: winner.noKK,
      totalHadiah,
      bulan,
      catatan
    };
    const updatedPemenang = [...arisanPemenang, newWinnerRecord];
    updateLocalAndState('arisanPemenang', updatedPemenang);

    // 3. Update config current period
    const updatedConfig: ArisanConfig = {
      ...arisanConfig,
      periodeBerjalan: putaran + 1
    };
    updateLocalAndState('arisanConfig', updatedConfig);

    if (webAppUrl) {
      const ok = await postToAppsScript({ 
        action: 'kocokArisanWinner', 
        winnerRecord: newWinnerRecord,
        pesertaId: winner.id
      });
      if (ok) handleSyncFetch();
    }
  };

  const handleResetArisanCycle = async (newConfig?: ArisanConfig) => {
    const updatedPeserta: ArisanPeserta[] = [];
    updateLocalAndState('arisanPeserta', updatedPeserta);

    const updatedConfig: ArisanConfig = newConfig ? {
      ...newConfig,
      periodeBerjalan: 1,
      status: 'aktif'
    } : {
      ...arisanConfig,
      periodeBerjalan: 1,
      status: 'aktif'
    };
    updateLocalAndState('arisanConfig', updatedConfig);

    if (webAppUrl) {
      const ok = await postToAppsScript({ 
        action: 'resetArisanCycle',
        config: updatedConfig 
      });
      if (ok) handleSyncFetch();
    }
  };

  const handleSaveArisanConfig = async (newConfig: ArisanConfig) => {
    updateLocalAndState('arisanConfig', newConfig);

    if (webAppUrl) {
      const ok = await postToAppsScript({ action: 'saveArisanConfig', config: newConfig });
      if (ok) handleSyncFetch();
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Calculate today's petugas notice based on Indonesian day name
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

  const activeDarurat = darurat.find(d => d.status === 'AKTIF') || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none antialiased">
      
      {/* Emergency Global Siren Popup Alert Modal */}
      <EmergencyAlertModal
        activeDarurat={activeDarurat}
        onResolveDarurat={handleResolveDarurat}
        currentUser={currentUser}
      />
      
      {/* Upper bar containing connection info and guides */}
      <div id="connection-bar" className="bg-slate-900 text-slate-300 text-xs py-2 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 shrink-0 ${webAppUrl ? 'text-emerald-400' : 'text-slate-400'}`} />
          {webAppUrl ? (
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <span>Terkoneksi ke database :</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            </div>
          ) : (
            <span className="text-amber-300 font-medium">Mode Offline (Penyimpanan Lokal Browser)</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {webAppUrl && (
            <button 
              id="sync-now-btn"
              onClick={() => handleSyncFetch()} 
              disabled={isSyncing}
              className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors text-xs cursor-pointer"
              title="Sinkronkan data sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}</span>
            </button>
          )}

          <button
            id="open-guide-btn"
            onClick={() => setIsGuideOpen(true)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors text-xs underline font-medium cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan & Integrasi</span>
          </button>
        </div>
      </div>

      {/* Sync Flash Message Alert */}
      {syncMessage && (
        <div 
          id="sync-message-alert" 
          className={`py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            syncMessage.type === 'success' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-rose-600 text-white'
          }`}
        >
          {syncMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Header section */}
      <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-emerald-600 text-white flex items-center justify-center shadow-xs font-black text-xl">
              RT
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                SISTEM RT TERPADU
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Jimpitan, Buku Kas Keuangan RT, & Arisan Warga
              </p>
            </div>
          </div>

          {/* User state and schedule pill */}
          <div className="flex items-center gap-3">
            {/* Today's on-duty pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100/90 border border-slate-200 px-3 py-1.5 rounded-full text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Petugas Jimpitan Hari Ini ({todayNotice.hari}):</span>
              <strong className="text-slate-900 font-bold">{todayNotice.nama}</strong>
            </div>

            {/* Current user pill / Login CTA */}
            {currentUser ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
                currentUser.role === 'admin_bendahara'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : currentUser.role === 'admin_arisan'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : currentUser.role === 'admin'
                  ? 'bg-purple-50 border-purple-200 text-purple-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <span className="font-bold">
                  {currentUser.nama} ({
                    currentUser.role === 'admin' 
                      ? 'Admin RT' 
                      : currentUser.role === 'admin_bendahara'
                      ? 'Bendahara RT'
                      : currentUser.role === 'admin_arisan' 
                      ? 'Admin Arisan' 
                      : 'Petugas'
                  })
                </span>
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  className="p-1 hover:opacity-80 rounded-full transition-colors cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => setActiveTab('input')}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Login Akun</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Workspace View Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        
        {/* Unified tabs navigation for all users */}
        <div id="tabs-navigation" className="w-full flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 mb-6">
          
          {/* 1. Dashboard Tab */}
          <button
            id="tab-btn-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Statistik</span>
          </button>

          {/* 2. Keuangan RT Tab */}
          <button
            id="tab-btn-keuangan"
            onClick={() => setActiveTab('keuangan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'keuangan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>Keuangan RT</span>
            {currentUser?.role === 'admin_bendahara' && (
              <span className="bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-md ml-1">
                Bendahara
              </span>
            )}
          </button>

          {/* 3. Arisan RT Tab */}
          <button
            id="tab-btn-arisan"
            onClick={() => setActiveTab('arisan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'arisan'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Dices className="w-4 h-4 text-amber-500" />
            <span>Arisan RT</span>
            {currentUser?.role === 'admin_arisan' && (
              <span className="bg-amber-800 text-amber-100 text-[10px] px-1.5 py-0.2 rounded-md ml-1">
                Admin Arisan
              </span>
            )}
          </button>

          {/* 4. Keamanan & Walkie Talkie Tab */}
          <button
            id="tab-btn-keamanan"
            onClick={() => setActiveTab('keamanan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'keamanan'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <Siren className={`w-4 h-4 ${activeDarurat ? 'text-yellow-300 animate-spin' : 'text-red-600'}`} />
            <span>Keamanan & Walkie Talkie</span>
            {activeDarurat && (
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping absolute -top-1 -right-1"></span>
            )}
          </button>

          {/* 4. Laporan Jimpitan Tab */}
          <button
            id="tab-btn-laporan"
            onClick={() => setActiveTab('laporan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'laporan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Laporan Jimpitan</span>
          </button>

          {/* 5. Input Jimpitan Tab */}
          <button
            id="tab-btn-input"
            onClick={() => setActiveTab('input')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'input'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{currentUser ? 'Input Jimpitan' : 'Input Jimpitan (Login)'}</span>
          </button>

          {/* Admin RT Specific Tabs */}
          {currentUser && currentUser.role === 'admin' && (
            <>
              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block"></div>
              
              <button
                id="tab-btn-warga"
                onClick={() => setActiveTab('warga')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'warga'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Kelola Warga</span>
              </button>

              <button
                id="tab-btn-petugas"
                onClick={() => setActiveTab('petugas')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'petugas'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Kelola Petugas</span>
              </button>

              <button
                id="tab-btn-jadwal"
                onClick={() => setActiveTab('jadwal')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'jadwal'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Jadwal Mingguan</span>
              </button>
            </>
          )}
        </div>

        {/* Tab view bodies */}
        <div id="tab-body" className="w-full min-h-[400px]">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <DashboardPanel
              jimpitan={jimpitan}
              jadwal={jadwal}
              petugas={petugas}
              warga={warga}
              arisanPeserta={arisanPeserta}
              arisanPemenang={arisanPemenang}
              arisanConfig={arisanConfig}
              keuanganList={keuangan}
              tutupBukuList={tutupBuku}
              currentUser={currentUser}
              webAppUrl={webAppUrl}
              isSyncing={isSyncing}
              onSyncFetch={handleSyncFetch}
              onNavigateToInput={() => {
                if (currentUser?.role === 'admin_bendahara') {
                  setActiveTab('keuangan');
                } else if (currentUser?.role === 'admin_arisan') {
                  setActiveTab('arisan');
                } else {
                  setActiveTab('input');
                }
              }}
              onNavigateToArisan={() => setActiveTab('arisan')}
              onNavigateToKeuangan={() => setActiveTab('keuangan')}
            />
          )}

          {/* KEUANGAN RT TAB */}
          {activeTab === 'keuangan' && (
            <KeuanganPanel
              keuanganList={keuangan}
              tutupBukuList={tutupBuku}
              currentUser={currentUser}
              webAppUrl={webAppUrl}
              isSyncing={isSyncing}
              onSyncFetch={handleSyncFetch}
              onAddKeuangan={handleAddKeuangan}
              onEditKeuangan={handleEditKeuangan}
              onDeleteKeuangan={handleDeleteKeuangan}
              onTutupBuku={handleTutupBuku}
              onBatalTutupBuku={handleBatalTutupBuku}
            />
          )}

          {/* ARISAN RT TAB */}
          {activeTab === 'arisan' && (
            <ArisanPanel
              wargaList={warga}
              pesertaList={arisanPeserta}
              setoranList={arisanSetoran}
              pemenangList={arisanPemenang}
              config={arisanConfig}
              currentUser={currentUser}
              onAddPeserta={handleAddArisanPeserta}
              onDeletePeserta={handleDeleteArisanPeserta}
              onSaveSetoran={handleSaveArisanSetoran}
              onBatchSetoranToggle={handleBatchSetoranToggle}
              onKocokWinner={handleKocokArisanWinner}
              onResetCycle={handleResetArisanCycle}
              onSaveConfig={handleSaveArisanConfig}
            />
          )}

          {/* KEAMANAN & WALKIE TALKIE TAB */}
          {activeTab === 'keamanan' && (
            <KeamananPanel
              daruratList={darurat}
              walkieTalkieList={walkieTalkie}
              wargaList={warga}
              currentUser={currentUser}
              onTriggerDarurat={handleTriggerDarurat}
              onResolveDarurat={handleResolveDarurat}
              onSendWalkieTalkie={handleSendWalkieTalkie}
            />
          )}

          {/* LAPORAN JIMPITAN TAB */}
          {activeTab === 'laporan' && (
            <LaporanBulanan
              jimpitanList={jimpitan}
              petugasList={petugas}
            />
          )}

          {/* INPUT JIMPITAN TAB */}
          {activeTab === 'input' && (
            !currentUser ? (
              <div className="w-full flex items-center justify-center py-6">
                <LoginForm 
                  petugasList={petugas} 
                  onLoginSuccess={(user) => {
                    setCurrentUser(user);
                    if (user.role === 'admin_bendahara') {
                      setActiveTab('keuangan');
                    } else if (user.role === 'admin_arisan') {
                      setActiveTab('arisan');
                    } else {
                      setActiveTab('input');
                    }
                  }}
                  webAppUrl={webAppUrl}
                />
              </div>
            ) : currentUser.role === 'admin_bendahara' ? (
              <div className="w-full flex items-center justify-center py-12">
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center max-w-md w-full space-y-4 shadow-sm">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Wallet className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-emerald-950">Akses Bendahara RT</h3>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Akun Anda memiliki hak akses pengelolaan <strong>Kas & Keuangan RT</strong> (Input Transaksi, Mutasi Kas, dan Tutup Buku Bulanan). Penarikan iuran Jimpitan harian dicatat oleh Petugas Ronda.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('keuangan')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" /> Buka Menu Keuangan RT
                  </button>
                </div>
              </div>
            ) : currentUser.role === 'admin_arisan' ? (
              <div className="w-full flex items-center justify-center py-12">
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center max-w-md w-full space-y-4 shadow-sm">
                  <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Dices className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-amber-950">Akses Admin Arisan RT</h3>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Akun Anda memiliki hak akses eksklusif untuk mengelola <strong>Arisan RT</strong> (Kocok Pemenang, Setoran Iuran & Peserta). Penarikan iuran Jimpitan harian dicatat oleh Petugas Ronda.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('arisan')}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Dices className="w-4 h-4" /> Buka Menu Arisan RT 🎲
                  </button>
                </div>
              </div>
            ) : (
              <JimpitanInputForm
                wargaList={warga}
                petugasList={petugas}
                currentUser={currentUser}
                onAddJimpitan={handleAddJimpitan}
                recentJimpitan={jimpitan}
              />
            )
          )}

          {/* KELOLA WARGA TAB */}
          {activeTab === 'warga' && currentUser?.role === 'admin' && (
            <WargaPanel
              wargaList={warga}
              onAdd={handleAddWarga}
              onEdit={handleEditWarga}
              onDelete={handleDeleteWarga}
            />
          )}

          {/* KELOLA PETUGAS TAB */}
          {activeTab === 'petugas' && currentUser?.role === 'admin' && (
            <PetugasPanel
              petugasList={petugas}
              onAdd={handleAddPetugas}
              onEdit={handleEditPetugas}
              onDelete={handleDeletePetugas}
            />
          )}

          {/* JADWAL MINGGUAN TAB */}
          {activeTab === 'jadwal' && currentUser?.role === 'admin' && (
            <JadwalPanel
              jadwalList={jadwal}
              petugasList={petugas}
              onSave={handleSaveJadwal}
            />
          )}
        </div>

      </div>

      {/* Guide & Configuration Modal popup */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        webAppUrl={webAppUrl}
        onSaveUrl={handleSaveWebAppUrl}
      />

      {/* Footer copyright */}
      <footer className="py-8 bg-slate-900 border-t border-slate-800 text-slate-500 text-center text-xs mt-12 space-y-2">
        <p className="flex items-center justify-center gap-1 text-slate-400 font-semibold">
          Aplikasi Jimpitan, Keuangan & Arisan RT Created By : Rudi Setiyawan
        </p>
        <p className="text-[12px]">Developer Aplikasi dan Games.</p>
        <div className="flex justify-center gap-2 text-[10px] text-slate-600">
          <span>Google Sheets Backend</span>
          <span>•</span>
          <span>Mode Offline didukung</span>
          <span>•</span>
          <span>@2026</span>
        </div>
      </footer>

    </div>
  );
}
