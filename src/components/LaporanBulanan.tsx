import { useState } from 'react';
import { JimpitanRecord, Petugas } from '../types';
import { formatTanggalIndo } from '../initialData';
import { utils, write } from 'xlsx';
import { Download, Share2, Printer, Search, Calendar, User, FileSpreadsheet, TrendingUp, DollarSign, Filter, RefreshCcw, Copy, MessageSquare } from 'lucide-react';

interface LaporanBulananProps {
  jimpitanList: JimpitanRecord[];
  petugasList: Petugas[];
}

export default function LaporanBulanan({ jimpitanList, petugasList }: LaporanBulananProps) {
  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  // States
  const [filterBulan, setFilterBulan] = useState<string>(currentMonthStr); // YYYY-MM
  const [filterPetugas, setFilterPetugas] = useState<string>('all'); // 'all' or petugas name
  const [shareStatus, setShareStatus] = useState<'idle' | 'success'>('idle');

  // Find all unique petugas names in the records to make sure we filter correctly
  const listPetugasName = petugasList
    .filter(p => p.id !== 'p-admin')
    .map(p => p.nama);

  // Filter records
  const filteredRecords = jimpitanList.filter((rec) => {
    // match month
    const recMonth = rec.tanggal.substring(0, 7); // YYYY-MM
    const matchMonth = recMonth === filterBulan;

    // match petugas
    const matchPetugas = filterPetugas === 'all' || rec.namaPetugas === filterPetugas;

    return matchMonth && matchPetugas;
  });

  // Calculate stats
  const totalSetoran = filteredRecords.reduce((sum, rec) => sum + rec.jumlah, 0);
  const totalTransaksi = filteredRecords.length;
  
  // Find distinct citizens who contributed
  const distinctWarga = Array.from(new Set(filteredRecords.map(r => r.noKK)));
  const totalWargaBerpartisipasi = distinctWarga.length;

  // Average setoran per transaction
  const rataRataSetoran = totalTransaksi > 0 ? totalSetoran / totalTransaksi : 0;

  // Format month label in Indonesian
  const getBulanIndoLabel = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Export to XLSX function (using SheetJS)
  // Helper to build XLSX workbook and File/Blob objects
  const generateXLSXFileObject = () => {
    if (filteredRecords.length === 0) {
      return null;
    }

    // Format data for sheet
    const dataForExport = filteredRecords.map((rec, index) => ({
      'No': index + 1,
      'Tanggal': rec.tanggal,
      'Nama Kepala Keluarga': rec.namaWarga,
      'No KK': rec.noKK,
      'Jumlah Setoran (Rp)': rec.jumlah,
      'Nama Petugas Penarik': rec.namaPetugas
    }));

    // Create workbook and worksheet
    const worksheet = utils.json_to_sheet(dataForExport);
    const workbook = utils.book_new();
    
    // Add columns widths for readability
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 15 }, // Tanggal
      { wch: 25 }, // Nama Kepala Keluarga
      { wch: 22 }, // No KK
      { wch: 18 }, // Jumlah Setoran (Rp)
      { wch: 22 }  // Nama Petugas Penarik
    ];

    utils.book_append_sheet(workbook, worksheet, 'Laporan Jimpitan');

    // Generate Excel file
    const monthName = getBulanIndoLabel(filterBulan).replace(/\s+/g, '_');
    const fileName = `Laporan_Jimpitan_${monthName}_${filterPetugas === 'all' ? 'SemuaPetugas' : filterPetugas.replace(/\s+/g, '')}.xlsx`;

    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob = new Blob([excelBuffer], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    return { workbook, fileName, blob, file };
  };

  // 1. Direct Download XLSX
  const handleExportXLSX = () => {
    const fileData = generateXLSXFileObject();
    if (!fileData) {
      alert('Tidak ada data jimpitan untuk diekspor pada filter terpilih.');
      return;
    }

    const { blob, fileName } = fileData;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to construct formatted report text
  const getFormattedReportText = () => {
    const monthLabel = getBulanIndoLabel(filterBulan);
    const petugasLabel = filterPetugas === 'all' ? 'Semua Petugas' : filterPetugas;
    
    return `*REKAP IURAN JIMPITAN RT*
Bulan: ${monthLabel}
Petugas: ${petugasLabel}
---------------------------
• Total Setoran: Rp ${totalSetoran.toLocaleString('id-ID')}
• Total Penarikan: ${totalTransaksi} Kali
• Warga Berpartisipasi: ${totalWargaBerpartisipasi} KK
• Rata-rata Iuran: Rp ${Math.round(rataRataSetoran).toLocaleString('id-ID')}

Berikut terlampir file rekapitulasi data Excel (.xlsx).
_Aplikasi Jimpitan RT_`;
  };

  // 2. Share .XLSX File to WhatsApp / Native Android Share Sheet (Web Share API Level 2 with Files)
  const handleShareXLSXFile = async () => {
    const fileData = generateXLSXFileObject();
    if (!fileData) {
      alert('Tidak ada data jimpitan untuk dibagikan pada filter terpilih.');
      return;
    }

    const { file, blob, fileName } = fileData;
    const summaryText = getFormattedReportText();

    // Check if Web Share API with file attachment is supported (Android WebViews & modern mobile browsers)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Laporan Jimpitan RT (${fileName})`,
          text: summaryText,
        });
        setShareStatus('success');
        setTimeout(() => setShareStatus('idle'), 3000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // User canceled
        }
        console.warn('File sharing error, using fallback:', err);
      }
    }

    // Fallback if browser/webview cannot share binary file directly via Web Share:
    // Trigger download of .xlsx file + open WhatsApp with report summary text
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
    window.open(waUrl, '_blank');
    setShareStatus('success');
    setTimeout(() => setShareStatus('idle'), 3000);
  };

  // 3. Clipboard copy fallback
  const handleCopyText = () => {
    const textToShare = getFormattedReportText();
    navigator.clipboard.writeText(textToShare);
    setShareStatus('success');
    setTimeout(() => setShareStatus('idle'), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="laporan-bulanan-root" className="space-y-6">
      
      {/* Filters Form */}
      <div id="laporan-filters-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          Filter Rekapitulasi Laporan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Month Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Pilih Bulan & Tahun</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="filter-bulan-input"
                type="month"
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Petugas Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Pilih Petugas Penarik</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="filter-petugas-select"
                value={filterPetugas}
                onChange={(e) => setFilterPetugas(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="all">Semua Petugas</option>
                {listPetugasName.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="md:col-span-2 flex flex-wrap gap-2 justify-end">
            <button
              id="share-wa-xlsx-btn"
              onClick={handleShareXLSXFile}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              title="Bagikan file dokumen .xlsx langsung ke WhatsApp / Aplikasi lain via Android Share"
            >
              <Share2 className="w-4 h-4" />
              <span>{shareStatus === 'success' ? 'Berhasil Dibagikan!' : 'Bagikan File XLSX (Share to WA)'}</span>
            </button>

            <button
              id="export-xlsx-btn"
              onClick={handleExportXLSX}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              title="Unduh file Excel (.xlsx) secara langsung"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh .xlsx</span>
            </button>

            <button
              id="copy-report-btn"
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              title="Salin ringkasan teks ke clipboard"
            >
              <Copy className="w-4 h-4" />
              <span>{shareStatus === 'success' ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Cetak Laporan"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Metrics (Summary Indicators) */}
      <div id="laporan-summary-metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Setoran Terkumpul</span>
            <p className="text-xl font-bold text-slate-900">Rp {totalSetoran.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Frekuensi Tarikan</span>
            <p className="text-xl font-bold text-slate-900">{totalTransaksi} Kali</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Warga Berpartisipasi</span>
            <p className="text-xl font-bold text-slate-900">{totalWargaBerpartisipasi} KK</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Rata-rata Iuran</span>
            <p className="text-xl font-bold text-slate-900">Rp {Math.round(rataRataSetoran).toLocaleString('id-ID')}</p>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Details Table view */}
      <div id="laporan-details-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 print:border-0 print:shadow-none">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Data Transaksi Rincian</h3>
            <p className="text-xs text-slate-500">Menampilkan {filteredRecords.length} transaksi untuk filter {getBulanIndoLabel(filterBulan)}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block italic">Sistem Sinkronisasi</span>
            <span className="text-xs text-emerald-600 font-semibold">Google Sheets Aktif</span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl print:border-collapse">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Warga</th>
                <th className="py-3 px-4">No KK</th>
                <th className="py-3 px-4">Jumlah Setoran</th>
                <th className="py-3 px-4">Nama Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, index) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatTanggalIndo(rec.tanggal, 'full')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{rec.namaWarga}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 tracking-wider">{rec.noKK}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">Rp {rec.jumlah.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 text-slate-600">{rec.namaPetugas}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic text-xs">
                    Tidak ada transaksi jimpitan yang cocok dengan filter.
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
