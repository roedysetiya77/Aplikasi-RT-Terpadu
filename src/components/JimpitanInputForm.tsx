import React, { useState } from 'react';
import { JimpitanRecord, Warga, Petugas, CurrentUser } from '../types';
import { Search, Calendar, User, DollarSign, ClipboardCheck, ArrowRight, CheckCircle2, History } from 'lucide-react';

interface JimpitanInputFormProps {
  wargaList: Warga[];
  petugasList: Petugas[];
  currentUser: CurrentUser;
  onAddJimpitan: (record: Omit<JimpitanRecord, 'id'>) => Promise<void>;
  recentJimpitan: JimpitanRecord[];
}

export default function JimpitanInputForm({
  wargaList,
  petugasList,
  currentUser,
  onAddJimpitan,
  recentJimpitan
}: JimpitanInputFormProps) {
  // Input fields
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
  const [jumlah, setJumlah] = useState<number>(1000); // Default Jimpitan Rp 1.000
  const [namaPetugas, setNamaPetugas] = useState<string>(
    currentUser.role === 'petugas' ? currentUser.nama : ''
  );

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter citizens based on search query
  const searchResults = searchQuery.trim() === ''
    ? []
    : wargaList.filter(
        w =>
          w.namaKK.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.noKK.includes(searchQuery)
      ).slice(0, 5); // Limit to top 5 results

  const handleSelectWarga = (warga: Warga) => {
    setSelectedWarga(warga);
    setSearchQuery('');
    setIsSearching(false);
    setErrorMsg('');
  };

  const handleClearSelectedWarga = () => {
    setSelectedWarga(null);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedWarga) {
      setErrorMsg('Harap pilih Warga terlebih dahulu melalui kolom pencarian!');
      return;
    }

    if (!tanggal) {
      setErrorMsg('Harap masukkan tanggal penarikan!');
      return;
    }

    const selectedPetugasName = currentUser.role === 'petugas' ? currentUser.nama : namaPetugas;
    if (!selectedPetugasName) {
      setErrorMsg('Harap pilih nama Petugas yang bertugas!');
      return;
    }

    if (jumlah <= 0) {
      setErrorMsg('Jumlah setoran iuran harus lebih besar dari Rp 0!');
      return;
    }

    setLoading(true);
    try {
      await onAddJimpitan({
        tanggal,
        namaWarga: selectedWarga.namaKK,
        noKK: selectedWarga.noKK,
        jumlah,
        namaPetugas: selectedPetugasName
      });

      setSuccessMsg(`Berhasil mencatat Jimpitan Rp ${jumlah.toLocaleString('id-ID')} untuk Keluarga ${selectedWarga.namaKK}!`);
      setSelectedWarga(null);
      setSearchQuery('');
      
      // Auto fade-out success message
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Gagal mengirim iuran ke spreadsheet.');
    } finally {
      setLoading(false);
    }
  };

  // Only show normal collectors (excluding system admin) for admin selection
  const normalPetugasList = petugasList.filter(p => p.id !== 'p-admin');

  // Filter recent entries for display (just show today's or this session's entries)
  const sessionEntries = recentJimpitan.slice(0, 5);

  return (
    <div id="jimpitan-input-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Entry Form Card */}
      <div id="jimpitan-entry-card" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-600" />
          Form Pencatatan & Penarikan Jimpitan Warga
        </h3>

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
            <span className="text-rose-600 shrink-0">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Citizen Search Autocomplete (Mandatory requirement!) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800 block">
              Cari & Pilih Kepala Keluarga (Warga) <span className="text-rose-500">*</span>
            </label>
            
            {selectedWarga ? (
              /* Selected Warga Badge */
              <div className="p-4 bg-blue-50/50 border border-blue-200/60 rounded-xl flex items-center justify-between animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">{selectedWarga.namaKK}</h4>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider">No KK: {selectedWarga.noKK}</p>
                  </div>
                </div>
                <button
                  id="clear-warga-btn"
                  type="button"
                  onClick={handleClearSelectedWarga}
                  className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  Ganti Warga
                </button>
              </div>
            ) : (
              /* Search Input with autocomplete suggestions dropdown */
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="warga-search-autocomplete"
                  type="text"
                  placeholder="Ketik Nama Kepala Keluarga atau No KK untuk mencari..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />

                {/* Autocomplete Dropdown List */}
                {isSearching && searchQuery.trim() !== '' && (
                  <div className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((w) => (
                        <button
                          key={w.id}
                          id={`autocomplete-item-${w.id}`}
                          type="button"
                          onClick={() => handleSelectWarga(w)}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 text-xs block">{w.namaKK}</span>
                            <span className="text-[10px] text-slate-500 font-mono">No KK: {w.noKK}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            Pilih <ArrowRight className="w-3 h-3" />
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                        Tidak ada warga yang cocok dengan pencarian.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2. Date of Collection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Tanggal Penarikan</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="jimpitan-tanggal"
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                />
              </div>
            </div>

            {/* 3. Amount of Setoran (standard Rp 2000 is editable) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Jumlah Iuran (Setoran)</label>
              <div className="relative">
                <div className="absolute left-3 top-2 text-xs font-bold text-slate-500 select-none">Rp</div>
                <input
                  id="jimpitan-jumlah"
                  type="number"
                  required
                  min={0}
                  value={jumlah}
                  onChange={(e) => setJumlah(parseInt(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold"
                />
              </div>
              <div className="flex gap-1 mt-1">
                <button
                  id="quick-amt-1000"
                  type="button"
                  onClick={() => setJumlah(1000)}
                  className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] rounded font-semibold border border-blue-200/50"
                >
                  1.000 (Default)
                </button>
                <button
                  id="quick-amt-2000"
                  type="button"
                  onClick={() => setJumlah(2000)}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] rounded font-medium"
                >
                  2.000
                </button>
                <button
                  id="quick-amt-5000"
                  type="button"
                  onClick={() => setJumlah(5000)}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] rounded font-medium"
                >
                  5.000
                </button>
              </div>
            </div>

            {/* 4. Collector Name (namaPetugas) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Nama Petugas</label>
              {currentUser.role === 'petugas' ? (
                /* Disabled input for logged-in petugas */
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="jimpitan-petugas-readonly"
                    type="text"
                    disabled
                    value={currentUser.nama}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium"
                  />
                </div>
              ) : (
                /* Select input for Admin to input on behalf of anyone */
                <select
                  id="jimpitan-petugas-select"
                  required
                  value={namaPetugas}
                  onChange={(e) => setNamaPetugas(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                >
                  <option value="">-- Pilih Petugas Penarik --</option>
                  {normalPetugasList.map((p) => (
                    <option key={p.id} value={p.nama}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              id="jimpitan-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              <span>{loading ? 'Mengirim Data...' : 'Simpan & Rekam Jimpitan'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Recent Entries log (Session history log) */}
      <div id="jimpitan-recent-entries" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-600" />
          Setoran Terakhir (Sesi Ini)
        </h3>

        {sessionEntries.length > 0 ? (
          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
            {sessionEntries.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 flex justify-between items-start text-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <div className="space-y-1">
                  <span className="font-semibold text-slate-900 block">{item.namaWarga}</span>
                  <div className="flex flex-col gap-0.5 text-[10px] text-slate-500">
                    <span>Petugas: {item.namaPetugas}</span>
                    <span>Tgl: {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 block">
                    +Rp {item.jumlah.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-200/50 px-1 rounded">
                    {item.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 italic text-center text-xs space-y-1">
            <span>Belum ada setoran diinput.</span>
            <span className="text-[10px] not-italic text-slate-500">Cari warga lalu simpan iuran untuk melihat riwayat di sini!</span>
          </div>
        )}
      </div>

    </div>
  );
}
