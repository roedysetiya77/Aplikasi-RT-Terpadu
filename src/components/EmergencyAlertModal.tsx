import React, { useEffect, useState } from 'react';
import { DaruratRecord, CurrentUser } from '../types';
import { 
  Siren, 
  Flame, 
  ShieldAlert, 
  HeartPulse, 
  Waves, 
  Skull, 
  Volume2, 
  VolumeX, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  User, 
  X,
  Radio
} from 'lucide-react';
import { startSirenSound, stopSirenSound, toggleMuteSiren, getIsSirenMuted } from '../utils/sirenAudio';

interface EmergencyAlertModalProps {
  activeDarurat: DaruratRecord | null;
  onResolveDarurat: (id: string, ditanganiOleh: string) => void;
  currentUser: CurrentUser | null;
}

export default function EmergencyAlertModal({ 
  activeDarurat, 
  onResolveDarurat, 
  currentUser 
}: EmergencyAlertModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [resolverName, setResolverName] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (activeDarurat && activeDarurat.status === 'AKTIF') {
      startSirenSound();
      setIsMuted(getIsSirenMuted());
    } else {
      stopSirenSound();
    }
    return () => {
      stopSirenSound();
    };
  }, [activeDarurat]);

  if (!activeDarurat || activeDarurat.status !== 'AKTIF') {
    return null;
  }

  const handleToggleAudio = () => {
    const muted = toggleMuteSiren();
    setIsMuted(muted);
  };

  const handleConfirmResolve = () => {
    const handler = resolverName.trim() || (currentUser ? currentUser.nama : 'Petugas / Warga RT');
    onResolveDarurat(activeDarurat.id, handler);
    stopSirenSound();
    setIsResolving(false);
  };

  const getKategoriBadge = () => {
    switch (activeDarurat.kategori) {
      case 'Kebakaran':
        return {
          bg: 'bg-orange-600',
          border: 'border-orange-500',
          text: 'text-orange-100',
          icon: <Flame className="w-8 h-8 text-yellow-300 animate-bounce" />,
          title: 'DARURAT KEBAKARAN'
        };
      case 'Pencurian':
        return {
          bg: 'bg-red-700',
          border: 'border-red-600',
          text: 'text-red-100',
          icon: <ShieldAlert className="w-8 h-8 text-yellow-300 animate-pulse" />,
          title: 'PERINGATAN PENCURIAN'
        };
      case 'Kematian':
        return {
          bg: 'bg-purple-800',
          border: 'border-purple-600',
          text: 'text-purple-100',
          icon: <HeartPulse className="w-8 h-8 text-pink-300 animate-pulse" />,
          title: 'DARURAT KEMATIAN / MEDIS'
        };
      case 'Bencana Alam':
        return {
          bg: 'bg-blue-800',
          border: 'border-blue-600',
          text: 'text-blue-100',
          icon: <Waves className="w-8 h-8 text-cyan-300 animate-bounce" />,
          title: 'BENCANA ALAM'
        };
      case 'Pembunuhan':
        return {
          bg: 'bg-slate-950',
          border: 'border-red-600',
          text: 'text-red-400',
          icon: <Skull className="w-8 h-8 text-red-500 animate-pulse" />,
          title: 'BAHAYA PEMBUNUHAN / KEKERASAN'
        };
      default:
        return {
          bg: 'bg-red-700',
          border: 'border-red-600',
          text: 'text-white',
          icon: <Siren className="w-8 h-8 text-yellow-300 animate-spin" />,
          title: 'PERINGATAN DARURAT RT'
        };
    }
  };

  const styleConfig = getKategoriBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      
      {/* Background Warning Flashing Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600 via-rose-900 to-black animate-pulse"></div>

      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500 rounded-3xl shadow-2xl overflow-hidden text-white z-10">
        
        {/* Flashing Top Banner */}
        <div className={`${styleConfig.bg} p-4 sm:p-5 flex items-center justify-between border-b ${styleConfig.border} relative overflow-hidden`}>
          <div className="flex items-center gap-3 z-10">
            <div className="p-2 bg-black/30 rounded-2xl backdrop-blur-xs">
              {styleConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300">
                  SIRENE AKTIF DI SELURUH RT
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white leading-tight">
                {styleConfig.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleToggleAudio}
            className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isMuted 
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                : 'bg-yellow-500 text-slate-950 border-yellow-400 hover:bg-yellow-400 shadow-lg animate-bounce'
            }`}
            title={isMuted ? 'Nyalakan Suara Sirine' : 'Matikan Suara Sirine'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="hidden sm:inline">{isMuted ? 'Mute' : 'Sirine On'}</span>
          </button>
        </div>

        {/* Content Details */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Pelapor Info */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Pelapor / Warga
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                {new Date(activeDarurat.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
            </div>
            <div className="text-base font-bold text-white flex items-center justify-between">
              <span>{activeDarurat.namaPelapor}</span>
              {activeDarurat.noKK && (
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                  No KK: {activeDarurat.noKK}
                </span>
              )}
            </div>
          </div>

          {/* Lokasi Warga */}
          <div className="bg-red-950/40 p-4 rounded-2xl border border-red-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400 animate-bounce" />
                Titik Lokasi Warga
              </span>
              {(activeDarurat.latitude || activeDarurat.mapUrl) && (
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-semibold">
                  GPS Terverifikasi
                </span>
              )}
            </div>
            
            <p className="text-sm font-semibold text-slate-200 leading-relaxed">
              {activeDarurat.lokasi}
            </p>

            {activeDarurat.keterangan && (
              <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 italic">
                "{activeDarurat.keterangan}"
              </p>
            )}

            {activeDarurat.mapUrl && (
              <a
                href={activeDarurat.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>BUKA NAVIGASI GOOGLE MAPS LOKASI</span>
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2">
            {!isResolving ? (
              <button
                onClick={() => setIsResolving(true)}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>SELESAIKAN PERINGATAN / KONDISI AMAN</span>
              </button>
            ) : (
              <div className="bg-slate-800 p-4 rounded-2xl border border-emerald-500/50 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Konfirmasi Situasi Aman
                </h4>
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">
                    Penanggung Jawab / Ditangani Oleh:
                  </label>
                  <input
                    type="text"
                    value={resolverName}
                    onChange={(e) => setResolverName(e.target.value)}
                    placeholder={currentUser ? currentUser.nama : 'Nama Anda / Petugas Ronda'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsResolving(false)}
                    className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmResolve}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Matikan Peringatan
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="bg-slate-950 p-3 text-center text-[11px] text-slate-400 border-t border-slate-800 flex items-center justify-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>Informasi Darurat disebarkan secara real-time ke seluruh aplikasi warga RT</span>
        </div>

      </div>
    </div>
  );
}
