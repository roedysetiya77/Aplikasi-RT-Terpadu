import React, { useState } from 'react';
import { Warga } from '../types';
import { Plus, Edit2, Trash2, Search, Users, AlertCircle, FileText } from 'lucide-react';

interface WargaPanelProps {
  wargaList: Warga[];
  onAdd: (warga: Omit<Warga, 'id'>) => Promise<void>;
  onEdit: (id: string, warga: Omit<Warga, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function WargaPanel({ wargaList, onAdd, onEdit, onDelete }: WargaPanelProps) {
  const [namaKK, setNamaKK] = useState('');
  const [noKK, setNoKK] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setNamaKK('');
    setNoKK('');
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!namaKK.trim() || !noKK.trim()) {
      setFormError('Nama Kepala Keluarga dan No KK wajib diisi!');
      return;
    }

    if (noKK.length !== 16 || !/^\d+$/.test(noKK)) {
      setFormError('Nomor Kartu Keluarga (No KK) harus terdiri dari 16 digit angka!');
      return;
    }

    // Check for duplicates
    const duplicateKK = wargaList.some(
      w => w.noKK === noKK.trim() && w.id !== editingId
    );
    if (duplicateKK) {
      setFormError('Nomor Kartu Keluarga ini sudah terdaftar sebelumnya.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await onEdit(editingId, { namaKK: namaKK.trim(), noKK: noKK.trim() });
      } else {
        await onAdd({ namaKK: namaKK.trim(), noKK: noKK.trim() });
      }
      resetForm();
    } catch (err) {
      setFormError('Gagal menyimpan data ke spreadsheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (warga: Warga) => {
    setEditingId(warga.id);
    setNamaKK(warga.namaKK);
    setNoKK(warga.noKK);
    setFormError('');
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus warga "${name}"? Semua data jimpitan warga ini akan tetap disimpan di rekap, tetapi warga tidak akan muncul di penarikan iuran baru.`)) {
      setLoading(true);
      try {
        await onDelete(id);
      } catch (err) {
        alert('Gagal menghapus warga.');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredWarga = wargaList.filter(
    w =>
      w.namaKK.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.noKK.includes(searchTerm)
  );

  return (
    <div id="warga-panel-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Input Form Card */}
      <div id="warga-form-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 h-fit">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          {editingId ? (
            <span className="flex items-center gap-1.5 text-blue-700">
              <Edit2 className="w-4 h-4" /> Edit Data Warga
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-800">
              <Plus className="w-4 h-4" /> Tambah Warga Baru
            </span>
          )}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nama Kepala Keluarga (KK)</label>
            <div className="relative">
              <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="warga-nama-kk"
                type="text"
                value={namaKK}
                onChange={(e) => setNamaKK(e.target.value)}
                placeholder="Nama lengkap kepala keluarga"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nomor Kartu Keluarga (16 Digit)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="warga-no-kk"
                type="text"
                maxLength={16}
                value={noKK}
                onChange={(e) => setNoKK(e.target.value.replace(/\D/g, ''))} // Numeric only
                placeholder="330101xxxxxxxxxx"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tracking-wider"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Harus 16 digit angka.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              id="warga-submit-btn"
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {loading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Warga'}
            </button>
            {editingId && (
              <button
                id="warga-cancel-btn"
                type="button"
                onClick={resetForm}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Card */}
      <div id="warga-list-card" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daftar Warga RT</h3>
            <p className="text-xs text-slate-500">Total: {wargaList.length} Kepala Keluarga terdaftar</p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="warga-search"
              type="text"
              placeholder="Cari nama atau No KK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Kepala Keluarga</th>
                <th className="py-3 px-4">No KK</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredWarga.length > 0 ? (
                filteredWarga.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{w.namaKK}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 tracking-wider">{w.noKK}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`edit-warga-btn-${w.id}`}
                          onClick={() => handleEditClick(w)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-warga-btn-${w.id}`}
                          onClick={() => handleDeleteClick(w.id, w.namaKK)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 italic text-xs">
                    Warga tidak ditemukan.
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
