import React, { useState } from 'react';
import { Petugas, CurrentUser } from '../types';
import { LogIn, Shield, Users, User, Lock, AlertCircle, Dices, ArrowRight, Wallet } from 'lucide-react';

interface LoginFormProps {
  petugasList: Petugas[];
  onLoginSuccess: (user: CurrentUser) => void;
  webAppUrl: string;
}

export default function LoginForm({ petugasList, onLoginSuccess, webAppUrl }: LoginFormProps) {
  const [role, setRole] = useState<'petugas' | 'admin_bendahara' | 'admin_arisan' | 'admin'>('petugas');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();

    setTimeout(() => {
      if (role === 'admin') {
        // System Admin RT (Root)
        if (cleanUsername === 'admin' && password === 'admin123') {
          onLoginSuccess({
            username: 'admin',
            nama: 'Administrator RT Pusat',
            role: 'admin',
          });
        } else {
          // Check if registered as admin in petugasList
          const found = petugasList.find(
            (p) => p.username.toLowerCase() === cleanUsername && p.password === password
          );
          if (found && (found.id === 'p-admin' || found.username.toLowerCase() === 'admin')) {
            onLoginSuccess({
              username: found.username,
              nama: found.nama || 'Administrator RT Pusat',
              role: 'admin',
            });
          } else {
            setError('Username atau Password Admin RT salah! (Kredensial bawaan: admin / admin123)');
          }
        }
      } else if (role === 'admin_bendahara') {
        // Search in petugasList for accounts with role 'admin_bendahara'
        const found = petugasList.find(
          (p) => p.username.toLowerCase() === cleanUsername && p.password === password
        );

        if (found) {
          const isBendaharaRole = found.role === 'admin_bendahara' || (!found.role && found.username.toLowerCase().includes('bendahara'));
          
          if (isBendaharaRole) {
            onLoginSuccess({
              username: found.username,
              nama: found.nama,
              role: 'admin_bendahara',
            });
          } else {
            setError(`Akun "${found.nama}" memiliki hak akses ${found.role === 'admin_arisan' ? 'Admin Arisan' : 'Petugas Jimpitan'}. Silakan pilih tab yang sesuai.`);
          }
        } else if (cleanUsername === 'bendahara' && password === 'bendahara123') {
          // Fallback initial account
          onLoginSuccess({
            username: 'bendahara',
            nama: 'Dewi Lestari (Bendahara RT)',
            role: 'admin_bendahara',
          });
        } else {
          setError('Username atau Password Bendahara RT tidak ditemukan. Pastikan akun telah didaftarkan oleh Admin RT di menu Kelola Petugas dengan Hak Akses Admin Bendahara.');
        }
      } else if (role === 'admin_arisan') {
        // Search in petugasList for accounts with role 'admin_arisan'
        const found = petugasList.find(
          (p) => p.username.toLowerCase() === cleanUsername && p.password === password
        );

        if (found) {
          const isArisanRole = found.role === 'admin_arisan' || (!found.role && found.username.toLowerCase().includes('arisan'));
          
          if (isArisanRole) {
            onLoginSuccess({
              username: found.username,
              nama: found.nama,
              role: 'admin_arisan',
            });
          } else {
            setError(`Akun "${found.nama}" terdaftar sebagai ${found.role === 'admin_bendahara' ? 'Admin Bendahara' : 'Petugas Jimpitan'}. Silakan pilih tab yang sesuai.`);
          }
        } else if (cleanUsername === 'arisan' && password === 'arisan123') {
          // Fallback initial account if not yet created in sheet
          onLoginSuccess({
            username: 'arisan',
            nama: 'Siti Aminah (Pengelola Arisan)',
            role: 'admin_arisan',
          });
        } else {
          setError('Username atau Password Admin Arisan tidak ditemukan. Pastikan akun telah didaftarkan oleh Admin RT di menu Kelola Petugas dengan Hak Akses Admin Arisan.');
        }
      } else {
        // Petugas Jimpitan
        const found = petugasList.find(
          (p) => p.username.toLowerCase() === cleanUsername && p.password === password
        );

        if (found) {
          if (found.role === 'admin_arisan') {
            setError(`Akun "${found.nama}" terdaftar sebagai "Admin Arisan". Silakan pilih tab "Admin Arisan" untuk masuk.`);
          } else if (found.role === 'admin_bendahara') {
            setError(`Akun "${found.nama}" terdaftar sebagai "Bendahara RT". Silakan pilih tab "Bendahara" untuk masuk.`);
          } else {
            onLoginSuccess({
              username: found.username,
              nama: found.nama,
              role: 'petugas',
            });
          }
        } else {
          setError('Username atau Password Petugas Jimpitan tidak ditemukan. Hubungi Admin RT jika belum terdaftar.');
        }
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div id="login-container" className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
      <div id="login-header" className="p-7 text-center bg-slate-50 border-b border-slate-100">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100/70 text-blue-700 rounded-2xl mb-3 shadow-2xs">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Sistem RT Terpadu</h2>
        <p className="text-xs text-slate-500 mt-1">Jimpitan, Keuangan RT, & Arisan Warga</p>
      </div>

      {/* Role Selection Tabs */}
      <div id="login-tabs" className="grid grid-cols-4 border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1">
        <button
          id="login-tab-petugas"
          type="button"
          onClick={() => {
            setRole('petugas');
            setError('');
          }}
          className={`py-2 px-1 text-[11px] font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            role === 'petugas'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span className="truncate">Petugas</span>
        </button>

        <button
          id="login-tab-bendahara"
          type="button"
          onClick={() => {
            setRole('admin_bendahara');
            setError('');
          }}
          className={`py-2 px-1 text-[11px] font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            role === 'admin_bendahara'
              ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          <span className="truncate">Bendahara</span>
        </button>

        <button
          id="login-tab-admin-arisan"
          type="button"
          onClick={() => {
            setRole('admin_arisan');
            setError('');
          }}
          className={`py-2 px-1 text-[11px] font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            role === 'admin_arisan'
              ? 'bg-white text-amber-900 shadow-xs border border-amber-200 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Dices className="w-3.5 h-3.5 text-amber-600" />
          <span className="truncate">Arisan</span>
        </button>

        <button
          id="login-tab-admin"
          type="button"
          onClick={() => {
            setRole('admin');
            setError('');
          }}
          className={`py-2 px-1 text-[11px] font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            role === 'admin'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-rose-600" />
          <span className="truncate">Admin RT</span>
        </button>
      </div>

      <form id="login-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Role permission info banner */}
        <div className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
          role === 'admin_bendahara'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : role === 'admin_arisan'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : role === 'admin'
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-blue-50 border-blue-200 text-blue-950'
        }`}>
          {role === 'admin_bendahara' ? (
            <div>
              <strong className="font-bold block text-emerald-900">Hak Akses Bendahara RT:</strong>
              Didaftarkan oleh Admin RT. Khusus input & kelola Kas/Keuangan RT, mutasi debit/kredit, dan Tutup Buku bulanan.
            </div>
          ) : role === 'admin_arisan' ? (
            <div>
              <strong className="font-bold block text-amber-900">Hak Akses Admin Arisan RT:</strong>
              Didaftarkan oleh Admin RT. Khusus mengelola kocok arisan, input setoran, & anggota arisan.
            </div>
          ) : role === 'admin' ? (
            <div>
              <strong className="font-bold block text-slate-900">Hak Akses Admin RT Pusat:</strong>
              Memiliki wewenang penuh (Kelola Warga, Petugas, Bendahara, Arisan, Jadwal Ronda, Jimpitan, dan Keuangan RT).
            </div>
          ) : (
            <div>
              <strong className="font-bold block text-blue-900">Hak Akses Petugas Jimpitan:</strong>
              Didaftarkan oleh Admin RT untuk mencatat penarikan iuran jimpitan harian warga saat ronda.
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 block">Username</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="login-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder={
                role === 'admin' 
                  ? 'admin' 
                  : role === 'admin_bendahara'
                  ? 'bendahara'
                  : role === 'admin_arisan' 
                  ? 'arisan' 
                  : 'Username Petugas Jimpitan'
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-slate-700 block">Password</label>
            {role === 'admin' && (
              <span className="text-[10px] text-slate-400 italic font-mono">Bawaan: admin123</span>
            )}
            {role === 'admin_bendahara' && (
              <span className="text-[10px] text-slate-400 italic font-mono">Bawaan: bendahara123</span>
            )}
            {role === 'admin_arisan' && (
              <span className="text-[10px] text-slate-400 italic font-mono">Bawaan: arisan123</span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            role === 'admin_bendahara'
              ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300'
              : role === 'admin_arisan'
              ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300'
              : role === 'admin'
              ? 'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300'
              : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300'
          }`}
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Masuk sebagai {
                role === 'admin_bendahara' 
                  ? 'Bendahara RT' 
                  : role === 'admin_arisan' 
                  ? 'Admin Arisan' 
                  : role === 'admin' 
                  ? 'Admin RT' 
                  : 'Petugas Jimpitan'
              }</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400">
            {webAppUrl ? (
              <span className="text-emerald-600 font-medium">✓ Terkoneksi ke Google Sheets (Sheet Petugas)</span>
            ) : (
              <span>⚙️ Menjalankan Mode Offline (Lokal)</span>
            )}
          </p>
        </div>
      </form>
    </div>
  );
}
