import { useState } from 'react';
import { APPS_SCRIPT_CODE } from '../AppScriptCode';
import { Check, Copy, ExternalLink, HelpCircle, BookOpen, Settings } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  onSaveUrl: (url: string) => void;
}

export default function GuideModal({ isOpen, onClose, webAppUrl, onSaveUrl }: GuideModalProps) {
  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState(webAppUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveUrl(inputUrl);
    setTestStatus('idle');
  };

  const handleTestConnection = async () => {
    if (!inputUrl) {
      setTestStatus('error');
      setErrorMessage('URL tidak boleh kosong.');
      return;
    }
    setTestStatus('testing');
    setErrorMessage('');
    try {
      // Use a standard fetch request with a shorter timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(inputUrl, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(id);
      
      const data = await response.json();
      if (data && data.status === 'success') {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setErrorMessage(data.message || 'Respons tidak valid dari Apps Script.');
      }
    } catch (err: any) {
      console.error('Test connection error:', err);
      // Apps Script might block standard direct CORS GET requests depending on browser settings, 
      // but if we got a CORS redirect or opaque, we try to explain.
      setTestStatus('error');
      setErrorMessage(
        'Gagal menyambung. Pastikan URL benar, Anda telah memilih "Siapa saja (Anyone)" pada akses deployment, dan Anda mengizinkan CORS di browser.'
      );
    }
  };

  return (
    <div id="guide-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="guide-modal-container" className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div id="guide-modal-header" className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900">Panduan Sinkronisasi Spreadsheet</h3>
              <p className="text-xs text-slate-500">Hubungkan aplikasi ini dengan Spreadsheet Google Anda secara Real-time</p>
            </div>
          </div>
          <button 
            id="close-guide-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div id="guide-modal-body" className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed">
          
          {/* Connection form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-medium">
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Konfigurasi Endpoint Apps Script</span>
            </div>
            <p className="text-xs text-slate-500">Masukkan URL Web App hasil deploy Google Apps Script untuk menghubungkan spreadsheet:</p>
            <div className="flex gap-2">
              <input
                id="apps-script-url-input"
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                id="save-url-btn"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                Simpan
              </button>
            </div>
            {webAppUrl && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                <span className="text-xs text-slate-500">Status saat ini: <strong className="text-slate-700">{webAppUrl ? 'Terhubung ke URL' : 'Mode Offline (Lokal)'}</strong></span>
                <button
                  id="test-connection-btn"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  {testStatus === 'testing' ? 'Menguji...' : 'Uji Koneksi'}
                </button>
              </div>
            )}

            {/* Test connection alert states */}
            {testStatus === 'success' && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                ✓ Koneksi berhasil! Aplikasi dapat tersinkronisasi dengan Google Spreadsheet.
              </div>
            )}
            {testStatus === 'error' && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>

          {/* Sheet Architecture Note */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs text-emerald-950">
            <h5 className="font-bold flex items-center gap-1.5 text-emerald-900">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              Struktur Sheet Spreadsheet yang Terbuat Otomatis:
            </h5>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Skrip akan otomatis membuat dan menginisialisasi 10 Sheet bila belum ada di Google Spreadsheet Anda:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px] pt-1">
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">1. Petugas</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">2. Warga</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">3. Jadwal</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">4. Jimpitan</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">5. Keuangan RT</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">6. TutupBuku</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">7. ArisanConfig</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">8. ArisanPeserta</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">9. ArisanSetoran</span>
              <span className="bg-white/80 px-2 py-1 rounded border border-emerald-200">10. ArisanPemenang</span>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">1</span>
              Buat Spreadsheet Baru & Apps Script
            </h4>
            <ol className="list-decimal pl-5 space-y-2 text-xs">
              <li>Buka <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-medium">Google Sheets Baru <ExternalLink className="w-3 h-3 inline" /></a></li>
              <li>Masuk ke menu <strong className="text-slate-800">Ekstensi (Extensions)</strong> &rarr; <strong className="text-slate-800">Apps Script</strong>.</li>
              <li>Hapus seluruh kode default di editor, lalu tempel kode di bawah ini.</li>
            </ol>
          </div>

          {/* Code block view */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Kode Google Apps Script (GAS)</span>
              <button
                id="copy-script-code-btn"
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Salin Kode GAS
                  </>
                )}
              </button>
            </div>
            <div className="relative bg-slate-950 rounded-xl overflow-hidden text-slate-200 font-mono text-xs leading-5">
              <div className="absolute top-2 right-2 flex items-center bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-slate-400">
                appscript.js
              </div>
              <pre className="p-4 max-h-60 overflow-y-auto whitespace-pre scrolling-touch scrollbar-thin">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>

          {/* Steps Continue */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">2</span>
              Deploy Sebagai Aplikasi Web
            </h4>
            <ol className="list-decimal pl-5 space-y-2 text-xs" start={4}>
              <li>Beri nama proyek Apps Script Anda, misal: <strong className="text-slate-800">Backend Jimpitan</strong>.</li>
              <li>Klik tombol <strong className="text-slate-800">Terapkan (Deploy)</strong> di kanan atas &rarr; pilih <strong className="text-slate-800">Penerapan baru (New deployment)</strong>.</li>
              <li>Klik ikon gerigi di sebelah "Pilih jenis" &rarr; pilih <strong className="text-slate-800">Aplikasi Web (Web App)</strong>.</li>
              <li>Konfigurasikan:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>Jalankan sebagai (Execute as):</strong> Pilih <strong className="text-slate-800">Saya (Me / Email anda)</strong></li>
                  <li><strong>Siapa yang memiliki akses (Who has access):</strong> Pilih <strong className="text-slate-800">Siapa saja (Anyone)</strong>. <span className="text-blue-700 italic">(Penting agar frontend bisa mengakses)</span></li>
                </ul>
              </li>
              <li>Klik <strong className="text-slate-800">Terapkan (Deploy)</strong>.</li>
              <li>Klik <strong className="text-slate-800">Izinkan Akses (Authorize access)</strong> dan pilih akun Google Anda. Jika ada peringatan "Google has not verified...", klik <strong className="text-slate-500 underline cursor-pointer">Advanced</strong> lalu klik <strong className="text-slate-500 underline cursor-pointer">Go to Backend Jimpitan (unsafe)</strong> untuk menyetujui izin.</li>
              <li>Salin <strong className="text-slate-800">URL Aplikasi Web (Web App URL)</strong> yang berakhiran <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">/exec</code>.</li>
              <li>Masukkan URL tersebut ke dalam kolom konfigurasi di atas!</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div id="guide-modal-footer" className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button
            id="close-guide-footer-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
