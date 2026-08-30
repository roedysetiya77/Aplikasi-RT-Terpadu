import React, { useState, useEffect } from 'react';
import { JadwalMingguan, Petugas } from '../types';
import { Save, Calendar, CheckCircle2, ShieldAlert, Plus, Edit2, Trash2, RotateCcw, AlertCircle } from 'lucide-react';

interface JadwalPanelProps {
  jadwalList: JadwalMingguan[];
  petugasList: Petugas[];
  onSave: (updatedJadwal: JadwalMingguan[]) => Promise<void>;
}

const DEFAULT_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function JadwalPanel({ jadwalList, petugasList, onSave }: JadwalPanelProps) {
  // Local list of schedule slots
  const [slots, setSlots] = useState<JadwalMingguan[]>([]);
  
  // Form input states
  const [hari, setHari] = useState('');
  const [petugasId, setPetugasId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formError, setFormError] = useState('');

  // Exclude system admin, bendahara, and admin arisan from jimpitan ronda scheduling dropdown
  const normalPetugas = petugasList.filter(
    p => p.id !== 'p-admin' && 
         p.role !== 'admin_arisan' && 
         p.role !== 'admin_bendahara' &&
         !p.username.toLowerCase().includes('arisan') &&
         !p.username.toLowerCase().includes('bendahara')
  );

  // Sync state with parent list
  useEffect(() => {
    if (jadwalList && jadwalList.length > 0) {
      setSlots(jadwalList);
    } else {
      // Initialize with default empty weekly slots if empty
      const initial = DEFAULT_DAYS.map((day, idx) => ({
        id: `j-${idx + 1}`,
        hari: day,
        petugasId: '',
        namaPetugas: 'Belum Ditugaskan'
      }));
      setSlots(initial);
    }
  }, [jadwalList]);

  const resetForm = () => {
    setHari('');
    setPetugasId('');
    setEditingId(null);
    setFormError('');
  };

  // Form submission handler to add or update local slots list
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setMessage(null);

    if (!hari.trim()) {
      setFormError('Nama hari / shift penarikan wajib diisi!');
      return;
    }

    const matchedPetugas = petugasList.find(p => p.id === petugasId);
    const petugasName = matchedPetugas ? matchedPetugas.nama : 'Belum Ditugaskan';

    if (editingId) {
      // Update existing slot in local array
      setSlots(prev => prev.map(s => s.id === editingId ? {
        ...s,
        hari: hari.trim(),
        petugasId: petugasId,
        namaPetugas: petugasName
      } : s));
      resetForm();
    } else {
      // Add new slot to local array
      const newSlot: JadwalMingguan = {
        id: `j-${Date.now()}`,
        hari: hari.trim(),
        petugasId: petugasId,
        namaPetugas: petugasName
      };
      setSlots(prev => [...prev, newSlot]);
      resetForm();
    }
  };

  // Edit action
  const handleEditClick = (slot: JadwalMingguan) => {
    setEditingId(slot.id);
    setHari(slot.hari);
    setPetugasId(slot.petugasId);
    setFormError('');
    setMessage(null);
  };

  // Delete action from local array
  const handleDeleteClick = (id: string, label: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal untuk "${label}"?`)) {
      setSlots(prev => prev.filter(s => s.id !== id));
      setMessage(null);
      if (editingId === id) resetForm();
    }
  };

  // Save the entire list to Spreadsheet
  const handleSaveToSpreadsheet = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await onSave(slots);
      setMessage({ type: 'success', text: 'Jadwal penarikan berhasil disinkronkan ke Spreadsheet!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal mengunggah jadwal ke spreadsheet.' });
    } finally {
      setLoading(false);
    }
  };

  // Helper to reset to basic Monday-Sunday template
  const handleResetToDefault = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang jadwal ke template standar (Senin - Minggu)? Perubahan belum akan tersimpan ke spreadsheet sampai Anda mengeklik tombol "Simpan ke Spreadsheet".')) {
      const template = DEFAULT_DAYS.map((day, idx) => ({
        id: `j-temp-${idx + 1}`,
        hari: day,
        petugasId: '',
        namaPetugas: 'Belum Ditugaskan'
      }));
      setSlots(template);
      resetForm();
      setMessage(null);
    }
  };

  return (
    <div id="jadwal-panel-root" className="space-y-6">
      
      {/* Description header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Kelola Jadwal Penarikan Jimpitan</h3>
            <p className="text-xs text-slate-500">
              Admin dapat menambahkan shift/hari baru, mengubah petugas terdaftar, dan melakukan penghapusan jadwal.
            </p>
          </div>
        </div>

        <button
          id="btn-reset-template"
          onClick={handleResetToDefault}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
          title="Reset ke Senin-Minggu standar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Template</span>
        </button>
      </div>

      {/* Message alerts */}
      {message && (
        <div className={`p-4 border rounded-2xl text-xs flex items-center gap-2.5 shadow-2xs ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid: Form Editor (Left) & Current Schedule List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor form card */}
        <div id="jadwal-form-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs h-fit">
          <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-1">
            {editingId ? (
              <span className="text-blue-700 flex items-center gap-1">
                <Edit2 className="w-4 h-4" /> Edit Jadwal Slot
              </span>
            ) : (
              <span className="text-slate-800 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Tambah Jadwal Baru
              </span>
            )}
          </h4>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Hari / Nama Shift</label>
              <input
                id="form-hari-input"
                type="text"
                value={hari}
                onChange={(e) => setHari(e.target.value)}
                placeholder="Misal: Senin, Jumat Malam, Piket Tambahan"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Petugas Penanggung Jawab</label>
              <select
                id="form-petugas-select"
                value={petugasId}
                onChange={(e) => setPetugasId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="">-- Belum Ditugaskan --</option>
                {normalPetugas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                id="submit-form-jadwal-btn"
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                {editingId ? 'Terapkan Perubahan' : 'Masukkan ke Daftar'}
              </button>
              {editingId && (
                <button
                  id="cancel-form-jadwal-btn"
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Current list table card */}
        <div id="jadwal-list-card" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Daftar Jadwal Penarikan Saat Ini</h4>
                <p className="text-[10px] text-slate-400">Total shift: {slots.length} penarikan terdaftar</p>
              </div>
              
              {/* Highlight changes status */}
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded-full font-semibold">
                Perubahan Lokal Aktif
              </span>
            </div>

            {/* Responsive list table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Shift / Hari</th>
                    <th className="py-2.5 px-4">Petugas Terdaftar</th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {slots.length > 0 ? (
                    slots.map((slot) => {
                      const hasAssigned = slot.petugasId && slot.petugasId !== '';
                      return (
                        <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{slot.hari}</td>
                          <td className="py-2.5 px-4">
                            {hasAssigned ? (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-100 text-[10px] font-medium rounded-md">
                                {slot.namaPetugas}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-400 border border-slate-200/50 text-[10px] italic rounded-md">
                                Belum Ditugaskan
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                id={`edit-slot-btn-${slot.id}`}
                                type="button"
                                onClick={() => handleEditClick(slot)}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded-lg transition-colors"
                                title="Edit Jadwal"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`delete-slot-btn-${slot.id}`}
                                type="button"
                                onClick={() => handleDeleteClick(slot.id, slot.hari)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg transition-colors"
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-slate-400 italic text-xs">
                        Belum ada jadwal penarikan. Silakan tambahkan baru di form samping.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Persistent Action Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <p className="text-[10px] text-slate-400 max-w-[60%] leading-relaxed">
              *Tekan tombol di samping untuk menyimpan seluruh daftar jadwal di atas secara permanen ke Google Sheets.
            </p>
            <button
              id="save-jadwal-spreadsheet-btn"
              onClick={handleSaveToSpreadsheet}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Menyimpan...' : 'Simpan ke Spreadsheet'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
