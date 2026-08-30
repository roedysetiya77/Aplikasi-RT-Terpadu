import React, { useState } from 'react';
import { Petugas } from '../types';
import { Plus, Edit2, Trash2, Search, User, ShieldAlert, Key, Eye, EyeOff, Users, Dices, Shield, Filter, Wallet } from 'lucide-react';

interface PetugasPanelProps {
  petugasList: Petugas[];
  onAdd: (petugas: Omit<Petugas, 'id'>) => Promise<void>;
  onEdit: (id: string, petugas: Omit<Petugas, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function PetugasPanel({ petugasList, onAdd, onEdit, onDelete }: PetugasPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<'petugas' | 'admin_bendahara' | 'admin_arisan'>('petugas');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'petugas' | 'admin_bendahara' | 'admin_arisan'>('all');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setNama('');
    setRole('petugas');
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim() || !password.trim() || !nama.trim()) {
      setFormError('Semua kolom nama, username, dan password harus diisi!');
      return;
    }

    // Only 'admin' is reserved for system admin
    if (username.toLowerCase() === 'admin' && editingId !== 'p-admin') {
      setFormError('Username "admin" dicadangkan khusus untuk akun Administrator Pusat RT.');
      return;
    }

    // Check duplicate username (exclude currently editing)
    const isDuplicate = petugasList.some(
      p => p.username.toLowerCase() === username.trim().toLowerCase() && p.id !== editingId
    );
    if (isDuplicate) {
      setFormError('Username ini sudah digunakan oleh akun lain. Gunakan username lain.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await onEdit(editingId, { 
          username: username.trim(), 
          password, 
          nama: nama.trim(),
          role 
        });
      } else {
        await onAdd({ 
          username: username.trim(), 
          password, 
          nama: nama.trim(),
          role 
        });
      }
      resetForm();
    } catch (err) {
      setFormError('Gagal menyimpan data ke spreadsheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (petugas: Petugas) => {
    setEditingId(petugas.id);
    setUsername(petugas.username);
    setPassword(petugas.password);
    setNama(petugas.nama);
    const assignedRole = petugas.role || (
      petugas.username.toLowerCase().includes('bendahara') 
        ? 'admin_bendahara' 
        : petugas.username.toLowerCase().includes('arisan') 
        ? 'admin_arisan' 
        : 'petugas'
    );
    setRole(assignedRole);
    setFormError('');
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (id === 'p-admin') {
      alert('Akun administrator pusat bawaan tidak dapat dihapus.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun "${name}"?`)) {
      setLoading(true);
      try {
        await onDelete(id);
      } catch (err) {
        alert('Gagal menghapus akun pengurus.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter petugas by search and role
  const filteredPetugas = petugasList.filter(p => {
    const matchesSearch = 
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const pRole = p.role || (
      p.username.toLowerCase().includes('bendahara') 
        ? 'admin_bendahara' 
        : p.username.toLowerCase().includes('arisan') 
        ? 'admin_arisan' 
        : 'petugas'
    );
    
    if (roleFilter === 'all') return matchesSearch;
    if (roleFilter === 'admin_bendahara') return matchesSearch && pRole === 'admin_bendahara';
    if (roleFilter === 'admin_arisan') return matchesSearch && pRole === 'admin_arisan';
    if (roleFilter === 'petugas') return matchesSearch && (pRole === 'petugas' && p.id !== 'p-admin');
    return matchesSearch;
  });

  const totalPetugasJimpitan = petugasList.filter(p => (p.role === 'petugas' || !p.role) && p.id !== 'p-admin').length;
  const totalBendahara = petugasList.filter(p => p.role === 'admin_bendahara' || p.username.toLowerCase().includes('bendahara')).length;
  const totalAdminArisan = petugasList.filter(p => p.role === 'admin_arisan' || p.username.toLowerCase().includes('arisan')).length;

  return (
    <div id="petugas-panel-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Form Input Card */}
      <div id="petugas-form-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 h-fit">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            {editingId ? (
              <span className="flex items-center gap-1.5 text-blue-700">
                <Edit2 className="w-4 h-4" /> Edit Akun Pengurus / Petugas
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-800">
                <Plus className="w-4 h-4" /> Tambah Akun Pengurus / Petugas
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tentukan hak akses untuk wewenang Jimpitan, Kas Keuangan RT, atau Arisan Warga.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Role / Hak Akses Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Hak Akses / Wewenang</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                id="role-select-petugas"
                onClick={() => setRole('petugas')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  role === 'petugas'
                    ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Petugas</span>
                </div>
                <span className="text-[9px] text-slate-500 leading-tight">
                  Jimpitan Ronda
                </span>
              </button>

              <button
                type="button"
                id="role-select-bendahara"
                onClick={() => setRole('admin_bendahara')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  role === 'admin_bendahara'
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <Wallet className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Bendahara</span>
                </div>
                <span className="text-[9px] text-slate-500 leading-tight">
                  Keuangan RT
                </span>
              </button>

              <button
                type="button"
                id="role-select-arisan"
                onClick={() => setRole('admin_arisan')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  role === 'admin_arisan'
                    ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <Dices className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Arisan</span>
                </div>
                <span className="text-[9px] text-slate-500 leading-tight">
                  Undian Arisan
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="petugas-nama"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Dewi Lestari (Bendahara)"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">@</span>
              <input
                id="petugas-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: bendahara_dewi"
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="petugas-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password login akun"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              id="petugas-submit-btn"
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                role === 'admin_bendahara'
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300'
                  : role === 'admin_arisan'
                  ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300'
              }`}
            >
              {loading ? (
                'Menyimpan...'
              ) : editingId ? (
                'Simpan Perubahan'
              ) : role === 'admin_bendahara' ? (
                <>
                  <Wallet className="w-3.5 h-3.5" /> Tambah Admin Bendahara
                </>
              ) : role === 'admin_arisan' ? (
                <>
                  <Dices className="w-3.5 h-3.5" /> Tambah Admin Arisan
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Tambah Petugas Jimpitan
                </>
              )}
            </button>
            {editingId && (
              <button
                id="petugas-cancel-btn"
                type="button"
                onClick={resetForm}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List / Table Card */}
      <div id="petugas-list-card" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daftar Akun Pengurus & Petugas</h3>
            <p className="text-xs text-slate-500">
              Total {petugasList.length} akun ({totalPetugasJimpitan} Petugas Jimpitan, {totalBendahara} Bendahara, {totalAdminArisan} Admin Arisan)
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="petugas-search"
              type="text"
              placeholder="Cari nama atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({petugasList.length})
          </button>
          <button
            onClick={() => setRoleFilter('petugas')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              roleFilter === 'petugas'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Users className="w-3 h-3" /> Petugas ({totalPetugasJimpitan})
          </button>
          <button
            onClick={() => setRoleFilter('admin_bendahara')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              roleFilter === 'admin_bendahara'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Wallet className="w-3 h-3" /> Bendahara ({totalBendahara})
          </button>
          <button
            onClick={() => setRoleFilter('admin_arisan')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              roleFilter === 'admin_arisan'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Dices className="w-3 h-3" /> Arisan ({totalAdminArisan})
          </button>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Nama & Hak Akses</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPetugas.length > 0 ? (
                filteredPetugas.map((p) => {
                  const isSysAdmin = p.id === 'p-admin' || p.username.toLowerCase() === 'admin';
                  const isBendahara = p.role === 'admin_bendahara' || (!p.role && p.username.toLowerCase().includes('bendahara'));
                  const isArisan = p.role === 'admin_arisan' || (!p.role && p.username.toLowerCase().includes('arisan'));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{p.nama}</span>
                          {isSysAdmin ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <Shield className="w-3 h-3 text-rose-600" /> Admin RT Pusat
                            </span>
                          ) : isBendahara ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <Wallet className="w-3 h-3 text-emerald-600" /> Bendahara RT
                            </span>
                          ) : isArisan ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <Dices className="w-3 h-3 text-amber-600" /> Admin Arisan RT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <Users className="w-3 h-3 text-blue-600" /> Petugas Jimpitan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">@{p.username}</td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-700">
                            {showPasswordMap[p.id] ? p.password : '••••••••'}
                          </span>
                          <button
                            id={`toggle-pwd-btn-${p.id}`}
                            onClick={() => togglePasswordVisibility(p.id)}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                            title={showPasswordMap[p.id] ? 'Sembunyikan password' : 'Lihat password'}
                          >
                            {showPasswordMap[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.id !== 'p-admin' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`edit-petugas-btn-${p.id}`}
                              onClick={() => handleEditClick(p)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-petugas-btn-${p.id}`}
                              onClick={() => handleDeleteClick(p.id, p.nama)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Bawaan</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic text-xs">
                    Data pengurus/petugas tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
