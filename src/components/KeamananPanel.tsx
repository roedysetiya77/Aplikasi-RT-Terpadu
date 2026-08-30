import React, { useState, useEffect, useRef } from 'react';
import { 
  DaruratRecord, 
  WalkieTalkieRecord, 
  Warga, 
  CurrentUser 
} from '../types';
import { 
  Siren, 
  Flame, 
  ShieldAlert, 
  HeartPulse, 
  Waves, 
  Skull, 
  Radio, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  User, 
  Play, 
  Pause, 
  AlertTriangle, 
  Send, 
  History, 
  Sparkles,
  Wifi,
  Navigation
} from 'lucide-react';
import { formatTanggalIndo } from '../initialData';

interface KeamananPanelProps {
  daruratList: DaruratRecord[];
  walkieTalkieList: WalkieTalkieRecord[];
  wargaList: Warga[];
  currentUser: CurrentUser | null;
  onTriggerDarurat: (newDarurat: Omit<DaruratRecord, 'id' | 'status'>) => void;
  onResolveDarurat: (id: string, ditanganiOleh: string) => void;
  onSendWalkieTalkie: (newMsg: Omit<WalkieTalkieRecord, 'id' | 'tanggal'>) => void;
}

export default function KeamananPanel({
  daruratList,
  walkieTalkieList,
  wargaList,
  currentUser,
  onTriggerDarurat,
  onResolveDarurat,
  onSendWalkieTalkie
}: KeamananPanelProps) {
  const [activeTab, setActiveTab] = useState<'darurat' | 'walkie' | 'riwayat'>('darurat');

  // Trigger modal state
  const [selectedKategori, setSelectedKategori] = useState<DaruratRecord['kategori'] | null>(null);
  const [namaPelapor, setNamaPelapor] = useState(currentUser ? currentUser.nama : '');
  const [noKK, setNoKK] = useState('');
  const [lokasiManual, setLokasiManual] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  // Walkie talkie state
  const [namaPTT, setNamaPTT] = useState(currentUser ? currentUser.nama : '');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [autoPlayIncoming, setAutoPlayIncoming] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [pttMode, setPttMode] = useState<'hold' | 'toggle'>('hold');
  const [micStatus, setMicStatus] = useState<'ready' | 'active' | 'denied'>('ready');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const isRecordingRef = useRef<boolean>(false);
  const shouldStopRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const processedMsgIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  // Play realistic walkie-talkie radio beep / chirp sound effect
  const playRadioChirp = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.error('Radio chirp error:', e);
    }
  };

  // Auto detect current location when emergency modal is selected
  const handleSelectKategori = (kat: DaruratRecord['kategori']) => {
    setSelectedKategori(kat);
    // Prefill name if logged in or selected from list
    if (currentUser) {
      setNamaPelapor(currentUser.nama);
    } else if (wargaList.length > 0 && !namaPelapor) {
      setNamaPelapor(wargaList[0].namaKK);
      setNoKK(wargaList[0].noKK);
    }
    
    // Acquire geolocation
    fetchGeolocation();
  };

  const handleUseDefaultRTLocation = () => {
    // Default coordinates for RT 04 Lingkungan
    const defaultLat = -6.175392;
    const defaultLng = 106.827153;
    setCoords({ lat: defaultLat, lng: defaultLng });
    setLokasiManual('Pos Kamling / Lingkungan RT 04');
    setLocationStatus('📍 Menggunakan Titik Acuan Pos RT 04');
  };

  const fetchGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('GPS tidak didukung browser ini. Menggunakan lokasi Pos RT 04.');
      handleUseDefaultRTLocation();
      return;
    }
    setIsLocating(true);
    setLocationStatus('Mencari sinyal GPS akurat...');

    const handleSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });
      setIsLocating(false);
      setLocationStatus(`✓ GPS Berhasil (Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)})`);
    };

    const handleLowAccuracyFallback = () => {
      setLocationStatus('Mencoba GPS standar...');
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (err) => {
          setIsLocating(false);
          setLocationStatus('⚠️ Sinyal GPS lambat/ditolak browser. Menggunakan Titik Pos RT 04.');
          handleUseDefaultRTLocation();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        // Fallback if high accuracy fails
        handleLowAccuracyFallback();
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSendEmergencyAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKategori) return;

    const pelaporFinal = namaPelapor.trim() || 'Warga RT (Anonim)';
    let mapUrl = '';
    let finalLokasi = lokasiManual.trim();

    if (coords) {
      mapUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
      if (!finalLokasi) {
        finalLokasi = `Lokasi GPS Warga: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      } else {
        finalLokasi += ` (GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
      }
    } else if (!finalLokasi) {
      finalLokasi = 'Wilayah Lingkungan RT 04';
    }

    onTriggerDarurat({
      tanggal: new Date().toISOString(),
      kategori: selectedKategori,
      namaPelapor: pelaporFinal,
      noKK: noKK,
      lokasi: finalLokasi,
      latitude: coords?.lat,
      longitude: coords?.lng,
      mapUrl: mapUrl || undefined,
      keterangan: keterangan.trim() || undefined
    });

    // Reset
    setSelectedKategori(null);
    setKeterangan('');
    setLokasiManual('');
    setCoords(null);
  };

  // Helper function to create synthetic radio beep sound if microphone is denied/unavailable
  const createSyntheticRadioAudio = (durasiDetik: number): string => {
    try {
      const sampleRate = 8000;
      const numSamples = sampleRate * Math.max(1, durasiDetik);
      const buffer = new Uint8Array(44 + numSamples);
      
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
      };
      const writeUint32 = (offset: number, val: number) => {
        buffer[offset] = val & 0xff;
        buffer[offset + 1] = (val >> 8) & 0xff;
        buffer[offset + 2] = (val >> 16) & 0xff;
        buffer[offset + 3] = (val >> 24) & 0xff;
      };
      const writeUint16 = (offset: number, val: number) => {
        buffer[offset] = val & 0xff;
        buffer[offset + 1] = (val >> 8) & 0xff;
      };

      writeString(0, 'RIFF');
      writeUint32(4, 36 + numSamples);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      writeUint32(16, 16);
      writeUint16(20, 1);
      writeUint16(22, 1);
      writeUint32(24, sampleRate);
      writeUint32(28, sampleRate);
      writeUint16(32, 1);
      writeUint16(34, 8);
      writeString(36, 'data');
      writeUint32(40, numSamples);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let val = 128;
        if (t < 0.2 || t > durasiDetik - 0.2) {
          val = Math.floor(128 + 60 * Math.sin(2 * Math.PI * 880 * t));
        } else {
          val = Math.floor(128 + 40 * Math.sin(2 * Math.PI * 440 * t) + (Math.random() * 20 - 10));
        }
        buffer[44 + i] = Math.min(255, Math.max(0, val));
      }

      let binary = '';
      for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      return `data:audio/wav;base64,${btoa(binary)}`;
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  // --- WALKIE TALKIE FUNCTIONS ---
  const startRecording = async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    shouldStopRef.current = false;
    setIsRecording(true);
    setRecordingSeconds(0);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    try {
      let stream: MediaStream | null = null;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      }

      if (!stream) {
        setMicStatus('denied');
        console.warn('Microphone access denied or unavailable, using synthetic voice transmitter');
        return;
      }

      setMicStatus('active');
      streamRef.current = stream;

      // Check if user released button while waiting for mic prompt
      if (shouldStopRef.current) {
        stream.getTracks().forEach(t => t.stop());
        cleanupRecording();
        return;
      }

      audioChunksRef.current = [];
      let options: MediaRecorderOptions | undefined = undefined;
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          let base64Audio = reader.result as string;
          // If blob is empty or corrupted, fallback to synthetic audio
          const durasi = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          if (!base64Audio || base64Audio.length < 100) {
            base64Audio = createSyntheticRadioAudio(durasi);
          }

          const sender = namaPTT.trim() || (currentUser ? currentUser.nama : 'Warga RT');
          
          onSendWalkieTalkie({
            namaPengirim: sender,
            rolePengirim: currentUser ? currentUser.role || 'Warga' : 'Warga RT',
            audioData: base64Audio,
            durasiDetik: durasi
          });
        };

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(200);

      if (shouldStopRef.current) {
        mediaRecorder.stop();
      }

    } catch (err) {
      console.error('Error starting audio recorder:', err);
      setMicStatus('denied');
    }
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    shouldStopRef.current = true;

    const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    } else if (micStatus === 'denied' || !mediaRecorderRef.current) {
      // Fallback synthetic transmission
      const syntheticAudio = createSyntheticRadioAudio(elapsed);
      const sender = namaPTT.trim() || (currentUser ? currentUser.nama : 'Warga RT');
      onSendWalkieTalkie({
        namaPengirim: sender,
        rolePengirim: currentUser ? currentUser.role || 'Warga' : 'Warga RT',
        audioData: syntheticAudio,
        durasiDetik: elapsed
      });
    }

    cleanupRecording();
  };

  const cleanupRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (pttMode === 'hold') {
      e.preventDefault();
      startRecording();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pttMode === 'hold' && isRecording) {
      e.preventDefault();
      stopRecording();
    }
  };

  const handleToggleClick = () => {
    if (pttMode === 'toggle') {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const playAudioClip = (id: string, base64Audio: string) => {
    if (!base64Audio) return;
    if (playingAudioId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    // Play radio chirp sound effect before playing audio
    playRadioChirp();

    setTimeout(() => {
      const audio = new Audio(base64Audio);
      audioPlayerRef.current = audio;
      setPlayingAudioId(id);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setAutoplayBlocked(false);
        }).catch((err) => {
          console.warn('Auto-play prevented by browser policy:', err);
          setAutoplayBlocked(true);
        });
      }

      audio.onended = () => {
        setPlayingAudioId(null);
      };
    }, 100);
  };

  // AUTO-PLAY LISTENER: Automatically play new incoming voice messages when autoPlayIncoming is ON
  useEffect(() => {
    if (isInitialMountRef.current) {
      // Record all existing message IDs on initial render so historical messages don't auto-play
      walkieTalkieList.forEach(item => {
        processedMsgIdsRef.current.add(item.id);
      });
      isInitialMountRef.current = false;
      return;
    }

    // Detect newly arrived messages
    const newMessages = walkieTalkieList.filter(item => !processedMsgIdsRef.current.has(item.id));

    if (newMessages.length > 0) {
      // Mark as processed
      newMessages.forEach(item => processedMsgIdsRef.current.add(item.id));

      const latestMsg = newMessages[0];
      if (autoPlayIncoming && latestMsg && latestMsg.audioData) {
        setTimeout(() => {
          playAudioClip(latestMsg.id, latestMsg.audioData);
        }, 150);
      }
    }
  }, [walkieTalkieList, autoPlayIncoming]);

  const activeDarurat = daruratList.find(d => d.status === 'AKTIF');

  return (
    <div className="w-full space-y-6 animate-fade-in">
      
      {/* Top Banner & Alert Warning Bar */}
      <div className="bg-gradient-to-r from-red-900 via-slate-900 to-slate-950 p-6 rounded-3xl text-white shadow-xl border border-red-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-red-600/10 pointer-events-none blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-600/30 rounded-2xl border border-red-500/40 text-red-400 backdrop-blur-md">
              <Siren className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                  Sistem Keamanan RT 24 Jam
                </span>
                {activeDarurat && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-slate-950 animate-bounce">
                    🚨 SIRINE AKTIF
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                Peringatan Darurat & Walkie Talkie RT
              </h2>
              <p className="text-xs text-slate-300">
                Pemicu sirine darurat instan untuk warga & saluran komunikasi radio suara Push-To-Talk
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('darurat')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'darurat'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Siren className="w-4 h-4" />
              <span>Tombol Darurat</span>
            </button>

            <button
              onClick={() => setActiveTab('walkie')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'walkie'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Walkie Talkie</span>
            </button>

            <button
              onClick={() => setActiveTab('riwayat')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'riwayat'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Log Riwayat</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: TOMBOL PERINGATAN DARURAT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'darurat' && (
        <div className="space-y-6">
          
          {/* Active Siren Banner if any */}
          {activeDarurat && (
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg border-2 border-yellow-300 flex items-center justify-between gap-4 animate-bounce">
              <div className="flex items-center gap-3">
                <Siren className="w-7 h-7 text-yellow-300 animate-spin" />
                <div>
                  <div className="text-xs font-black tracking-wider uppercase text-yellow-200">
                    PERINGATAN AKTIF: {activeDarurat.kategori.toUpperCase()}
                  </div>
                  <div className="text-sm font-bold">
                    Pelapor: {activeDarurat.namaPelapor} ({activeDarurat.lokasi})
                  </div>
                </div>
              </div>
              <button
                onClick={() => onResolveDarurat(activeDarurat.id, currentUser ? currentUser.nama : 'Petugas')}
                className="px-4 py-2 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl border border-white/20 shadow-md cursor-pointer"
              >
                Matikan Sirine / Aman
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Pilih Kategori Bahaya / Darurat
                </h3>
                <p className="text-xs text-slate-500">
                  Klik salah satu tombol di bawah untuk memicu sirine alarm di seluruh aplikasi perangkat warga.
                </p>
              </div>
            </div>

            {/* 5 Emergency Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-2">
              
              {/* 1. Pencurian */}
              <button
                onClick={() => handleSelectKategori('Pencurian')}
                className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 hover:from-red-600 hover:to-red-700 text-red-900 hover:text-white border-2 border-red-200 hover:border-red-600 shadow-xs hover:shadow-xl transition-all group flex flex-col items-center text-center gap-3 cursor-pointer"
              >
                <div className="p-4 bg-red-600 text-white rounded-2xl group-hover:bg-white group-hover:text-red-600 transition-colors shadow-md">
                  <ShieldAlert className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-black text-base group-hover:text-white">1. PENCURIAN</div>
                  <div className="text-[11px] opacity-80 group-hover:text-red-100 mt-0.5">Maling, Pembobolan, Maling Kendaraan</div>
                </div>
              </button>

              {/* 2. Kebakaran */}
              <button
                onClick={() => handleSelectKategori('Kebakaran')}
                className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-600 hover:to-orange-700 text-orange-900 hover:text-white border-2 border-orange-200 hover:border-orange-600 shadow-xs hover:shadow-xl transition-all group flex flex-col items-center text-center gap-3 cursor-pointer"
              >
                <div className="p-4 bg-orange-600 text-white rounded-2xl group-hover:bg-white group-hover:text-orange-600 transition-colors shadow-md">
                  <Flame className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-black text-base group-hover:text-white">2. KEBAKARAN</div>
                  <div className="text-[11px] opacity-80 group-hover:text-orange-100 mt-0.5">Api, Korsleting Listrik, Tabung Gas</div>
                </div>
              </button>

              {/* 3. Kematian */}
              <button
                onClick={() => handleSelectKategori('Kematian')}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-700 hover:to-purple-900 text-purple-900 hover:text-white border-2 border-purple-200 hover:border-purple-600 shadow-xs hover:shadow-xl transition-all group flex flex-col items-center text-center gap-3 cursor-pointer"
              >
                <div className="p-4 bg-purple-700 text-white rounded-2xl group-hover:bg-white group-hover:text-purple-700 transition-colors shadow-md">
                  <HeartPulse className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-black text-base group-hover:text-white">3. KEMATIAN / MEDIS</div>
                  <div className="text-[11px] opacity-80 group-hover:text-purple-100 mt-0.5">Kematian Warga, Darurat Medis / Ambulance</div>
                </div>
              </button>

              {/* 4. Bencana Alam */}
              <button
                onClick={() => handleSelectKategori('Bencana Alam')}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-100 hover:from-blue-600 hover:to-cyan-700 text-blue-900 hover:text-white border-2 border-blue-200 hover:border-blue-600 shadow-xs hover:shadow-xl transition-all group flex flex-col items-center text-center gap-3 cursor-pointer"
              >
                <div className="p-4 bg-blue-600 text-white rounded-2xl group-hover:bg-white group-hover:text-blue-600 transition-colors shadow-md">
                  <Waves className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-black text-base group-hover:text-white">4. BENCANA ALAM</div>
                  <div className="text-[11px] opacity-80 group-hover:text-blue-100 mt-0.5">Banjir, Gempa, Pohon Tumbang, Angin</div>
                </div>
              </button>

              {/* 5. Pembunuhan */}
              <button
                onClick={() => handleSelectKategori('Pembunuhan')}
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-900 hover:to-slate-950 text-slate-900 hover:text-white border-2 border-slate-300 hover:border-red-600 shadow-xs hover:shadow-xl transition-all group flex flex-col items-center text-center gap-3 cursor-pointer"
              >
                <div className="p-4 bg-slate-900 text-white rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors shadow-md">
                  <Skull className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-black text-base group-hover:text-white">5. PEMBUNUHAN</div>
                  <div className="text-[11px] opacity-80 group-hover:text-slate-300 mt-0.5">Penganiayaan, Kekerasan Fisik, Keributan</div>
                </div>
              </button>

            </div>
          </div>

          {/* Trigger Emergency Confirmation Dialog Modal */}
          {selectedKategori && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-red-500 animate-scale-up">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl font-bold text-xs">
                      🚨 {selectedKategori.toUpperCase()}
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      Konfirmasi Kirim Peringatan
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedKategori(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSendEmergencyAlert} className="space-y-4">
                  
                  {/* Pelapor */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nama Pelapor / Warga *
                    </label>
                    {wargaList.length > 0 ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          value={namaPelapor}
                          onChange={(e) => setNamaPelapor(e.target.value)}
                          placeholder="Ketik nama Anda / Warga"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-red-500"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        value={namaPelapor}
                        onChange={(e) => setNamaPelapor(e.target.value)}
                        placeholder="Nama Lengkap Anda"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-red-500"
                      />
                    )}
                  </div>

                  {/* Lokasi GPS & Manual */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-red-600" />
                        Titik Lokasi Kejadian *
                      </label>
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={fetchGeolocation}
                          disabled={isLocating}
                          className="text-[11px] bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                          <span>{isLocating ? 'Cari GPS...' : 'Ambil GPS'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleUseDefaultRTLocation}
                          className="text-[11px] bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>📍 Titik Pos RT 04</span>
                        </button>
                      </div>
                    </div>

                    {locationStatus && (
                      <div className="text-[11px] font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
                        <span>{locationStatus}</span>
                        {coords && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-bold">
                            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                          </span>
                        )}
                      </div>
                    )}

                    <input
                      type="text"
                      value={lokasiManual}
                      onChange={(e) => setLokasiManual(e.target.value)}
                      placeholder="Contoh: Depan Pos Kamling RT 04 / Rumah No. 12"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Catatan / Keterangan */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Keterangan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      placeholder="Jelaskan secara singkat kronologi atau bantuan yang dibutuhkan..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-red-500"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedKategori(null)}
                      className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-500"
                    >
                      <Siren className="w-4 h-4 text-yellow-300 animate-spin" />
                      <span>SEBARKAN PERINGATAN DARURAT</span>
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: WALKIE TALKIE (PUSH TO TALK) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'walkie' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Tactical Walkie Talkie Device Graphic (Left side) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 rounded-3xl text-white shadow-2xl border-4 border-slate-800 flex flex-col items-center justify-between min-h-[480px] relative overflow-hidden">
            
            {/* Antenna decoration */}
            <div className="absolute top-0 right-10 w-4 h-12 bg-slate-800 rounded-t-md border-t border-slate-700"></div>

            {/* Radio LCD Screen Display Header */}
            <div className="w-full bg-emerald-950/80 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-inner text-emerald-300 font-mono space-y-2">
              <div className="flex items-center justify-between text-[11px] border-b border-emerald-500/30 pb-2">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  CH-04: UTAMA RT
                </span>
                <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  {isRecording ? '🎙️ TRANSMITTING' : playingAudioId ? '🔊 RECEIVING' : 'STANDBY'}
                </span>
              </div>

              <div className="text-center py-2">
                <div className="text-xs text-emerald-400/80 uppercase tracking-widest">
                  {isRecording ? 'MEREKAM SUARA...' : playingAudioId ? 'MEMUTAR SIARAN...' : 'TEKAN DAN TAHAN PTT'}
                </div>
                <div className="text-3xl font-black text-emerald-200 tracking-wider mt-1">
                  {isRecording ? `00:0${recordingSeconds}` : '446.050 MHz'}
                </div>
              </div>

              {/* Audio visualizer spectrum simulation */}
              <div className="flex items-center justify-center gap-1 h-6">
                {[40, 70, 30, 90, 60, 100, 50, 80, 40, 70, 90, 50].map((h, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isRecording || playingAudioId 
                        ? 'bg-emerald-400 animate-pulse' 
                        : 'bg-emerald-900/60 h-2'
                    }`}
                    style={{ height: isRecording || playingAudioId ? `${Math.max(20, (h * (recordingSeconds % 3 + 1)) % 100)}%` : '20%' }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Speaker Grille Detail */}
            <div className="w-full py-4 flex flex-col gap-1 items-center opacity-40">
              <div className="w-3/4 h-1 bg-slate-700 rounded-full"></div>
              <div className="w-3/4 h-1 bg-slate-700 rounded-full"></div>
              <div className="w-3/4 h-1 bg-slate-700 rounded-full"></div>
            </div>

            {/* PTT Mode Switcher & Mic Status */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-[11px] bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-bold flex items-center gap-1">
                  <span>Mode PTT:</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPttMode('hold')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      pttMode === 'hold' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tekan & Tahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setPttMode('toggle')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      pttMode === 'toggle' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Klik ON / OFF
                  </button>
                </div>
              </div>

              {micStatus === 'denied' && (
                <div className="text-[10px] text-yellow-300 bg-yellow-950/40 p-2 rounded-xl border border-yellow-700/50 text-center">
                  ⚠️ Mikrofon browser tidak aktif — Menggunakan Pemancar Suara Radio Terpadu (Simulasi Suara)
                </div>
              )}
            </div>

            {/* Giant Circular PTT (Push To Talk) Button */}
            <div className="my-5 relative flex flex-col items-center">
              
              {/* Outer Glowing Metallic Ring */}
              <div className={`p-4 rounded-full transition-all ${
                isRecording 
                  ? 'bg-red-600/30 ring-8 ring-red-500/50 animate-pulse scale-105' 
                  : 'bg-slate-800/80 ring-4 ring-slate-700 hover:ring-emerald-500/50'
              }`}>
                <button
                  id="ptt-walkie-btn"
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onClick={handleToggleClick}
                  className={`w-40 h-40 rounded-full border-4 shadow-2xl flex flex-col items-center justify-center text-center p-3 transition-all cursor-pointer select-none touch-none ${
                    isRecording
                      ? 'bg-gradient-to-tr from-red-600 to-rose-500 border-white text-white shadow-red-500/50 scale-95'
                      : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 border-emerald-300 text-white hover:scale-105 shadow-emerald-500/30'
                  }`}
                >
                  <Radio className={`w-10 h-10 mb-1 ${isRecording ? 'animate-bounce text-yellow-300' : 'text-white'}`} />
                  <span className="font-black text-sm tracking-widest leading-none uppercase drop-shadow-md">
                    {isRecording ? 'STOP & KIRIM' : 'PUSH TO TALK'}
                  </span>
                  <span className="text-[9px] opacity-90 mt-1 font-semibold">
                    {isRecording 
                      ? (pttMode === 'hold' ? 'LEPAS UNTUK KIRIM' : 'KLIK UNTUK KIRIM')
                      : (pttMode === 'hold' ? 'TEKAN & TAHAN' : 'KLIK UNTUK BICARA')
                    }
                  </span>
                </button>
              </div>

            </div>

            {/* User Identity Input */}
            <div className="w-full space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Nama Pengirim Voice Note:
              </label>
              <input
                type="text"
                value={namaPTT}
                onChange={(e) => setNamaPTT(e.target.value)}
                placeholder="Nama Anda (contoh: Bpk Budi)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 text-center font-bold"
              />
            </div>

          </div>

          {/* Transmissions Feed (Right Side) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-xs border border-slate-200 flex flex-col justify-between space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                  Saluran Suara RT Live
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar siaran voice note teratas yang dikirimkan warga secara langsung
                </p>
              </div>

              {/* Auto play toggle */}
              <button
                onClick={() => setAutoPlayIncoming(!autoPlayIncoming)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  autoPlayIncoming
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Play: {autoPlayIncoming ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Autoplay blocked by browser notice */}
            {autoplayBlocked && (
              <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-2xl text-amber-900 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs animate-pulse">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>🔊 Pesan suara baru masuk! Klik tombol di kanan untuk mengaktifkan pemutaran otomatis:</span>
                </div>
                <button
                  onClick={() => {
                    setAutoplayBlocked(false);
                    if (walkieTalkieList.length > 0) {
                      playAudioClip(walkieTalkieList[0].id, walkieTalkieList[0].audioData);
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-xs whitespace-nowrap self-end sm:self-auto"
                >
                  ▶ Putar Suara Sekarang
                </button>
              </div>
            )}

            {/* Messages Feed */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {walkieTalkieList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Radio className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Belum ada rekaman suara walkie talkie.</p>
                  <p className="text-[11px] text-slate-400">Tekan tombol PUSH TO TALK di sebelah kiri untuk mengirim suara pertama Anda!</p>
                </div>
              ) : (
                walkieTalkieList.map((item) => {
                  const isPlaying = playingAudioId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isPlaying
                          ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => playAudioClip(item.id, item.audioData)}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                            isPlaying
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : 'bg-slate-900 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{item.namaPengirim}</span>
                            {item.rolePengirim && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded-md">
                                {item.rolePengirim}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(item.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                            <span>•</span>
                            <span className="font-mono">{item.durasiDetik} detik</span>
                          </div>
                        </div>
                      </div>

                      {/* Playing Indicator */}
                      {isPlaying && (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="w-1.5 h-6 bg-emerald-600 rounded-full animate-pulse"></span>
                          <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              💡 Suara Walkie Talkie disinkronkan secara otomatis dan dapat didengarkan oleh seluruh warga yang sedang membuka sistem RT.
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: LOG RIWAYAT PERINGATAN */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'riwayat' && (
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                Catatan & Riwayat Keamanan RT
              </h3>
              <p className="text-xs text-slate-500">
                Riwayat seluruh peringatan darurat yang pernah dipicu warga
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Waktu & Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Pelapor</th>
                  <th className="px-4 py-3">Titik Lokasi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Penanggung Jawab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {daruratList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Belum ada catatan kejadian darurat.
                    </td>
                  </tr>
                ) : (
                  daruratList.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {new Date(rec.tanggal).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          rec.kategori === 'Kebakaran' ? 'bg-orange-100 text-orange-800' :
                          rec.kategori === 'Pencurian' ? 'bg-red-100 text-red-800' :
                          rec.kategori === 'Kematian' ? 'bg-purple-100 text-purple-800' :
                          rec.kategori === 'Bencana Alam' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-200 text-slate-900'
                        }`}>
                          {rec.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {rec.namaPelapor}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span>{rec.lokasi}</span>
                          {rec.mapUrl && (
                            <a
                              href={rec.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-bold"
                            >
                              Maps ↗
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {rec.status === 'AKTIF' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                            🚨 MASIH AKTIF
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ AMAN / SELESAI
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {rec.ditanganiOleh || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
