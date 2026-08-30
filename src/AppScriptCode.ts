export const APPS_SCRIPT_CODE = `/**
 * Google Apps Script - Backend untuk Aplikasi Jimpitan, Keuangan & Arisan RT
 * 
 * Petunjuk Penyebaran (Deployment):
 * 1. Buka Google Sheets (buat spreadsheet baru atau pakai yang sudah ada).
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus semua kode default dan tempelkan seluruh kode di bawah ini.
 * 4. Simpan proyek dengan nama "Backend RT Terpadu (Jimpitan, Keuangan & Arisan)".
 * 5. Klik tombol "Terapkan" (Deploy) -> "Penerapan baru" (New deployment).
 * 6. Pilih jenis penerapan: "Aplikasi Web" (Web App).
 * 7. Konfigurasi:
 *    - Jalankan sebagai (Execute as): "Saya" (Me / email Anda).
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone).
 * 8. Klik "Terapkan" (Deploy) lalu berikan izin akses (Authorize access) jika diminta.
 * 9. Salin URL Aplikasi Web yang diberikan (formatnya: https://script.google.com/macros/s/.../exec).
 * 10. Tempelkan URL tersebut ke kolom "URL Apps Script" di Pengaturan Aplikasi!
 */

var SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// Nama-nama sheet yang digunakan
var SHEET_PETUGAS = "Petugas";
var SHEET_WARGA = "Warga";
var SHEET_JADWAL = "Jadwal";
var SHEET_JIMPITAN = "Jimpitan";
var SHEET_KEUANGAN = "Keuangan";
var SHEET_TUTUP_BUKU = "TutupBuku";
var SHEET_ARISAN_PESERTA = "Arisan RT";
var SHEET_ARISAN_SETORAN = "Setoran Arisan";
var SHEET_ARISAN_PEMENANG = "Pemenang Arisan";
var SHEET_ARISAN_CONFIG = "Config Arisan";
var SHEET_DARURAT = "Darurat";
var SHEET_WALKIE_TALKIE = "WalkieTalkie";

function initSheets() {
  // 1. Sheet Petugas
  var sPetugas = SPREADSHEET.getSheetByName(SHEET_PETUGAS);
  if (!sPetugas) {
    sPetugas = SPREADSHEET.insertSheet(SHEET_PETUGAS);
    sPetugas.appendRow(["ID", "Username", "Password", "Nama Petugas", "Hak Akses"]);
    sPetugas.appendRow(["p-admin", "admin", "admin123", "Administrator RT", "admin"]);
    sPetugas.appendRow(["p-bendahara", "bendahara", "bendahara123", "Dewi Lestari (Bendahara RT)", "admin_bendahara"]);
    sPetugas.appendRow(["p-arisan", "arisan", "arisan123", "Siti Aminah (Pengelola Arisan)", "admin_arisan"]);
    sPetugas.appendRow(["p-1", "budi", "petugas123", "Budi Santoso", "petugas"]);
    sPetugas.appendRow(["p-2", "ani", "petugas123", "Ani Rahayu", "petugas"]);
    sPetugas.appendRow(["p-3", "joko", "petugas123", "Joko Widodo", "petugas"]);
  }

  // 2. Sheet Warga
  var sWarga = SPREADSHEET.getSheetByName(SHEET_WARGA);
  if (!sWarga) {
    sWarga = SPREADSHEET.insertSheet(SHEET_WARGA);
    sWarga.appendRow(["ID", "Nama KK", "No KK"]);
    sWarga.appendRow(["w-1", "Ahmad Subarjo", "3301010101010001"]);
    sWarga.appendRow(["w-2", "Slamet Riyadi", "3301010101010002"]);
    sWarga.appendRow(["w-3", "Supardi Purwanto", "3301010101010003"]);
    sWarga.appendRow(["w-4", "Kusnan Sugeng", "3301010101010004"]);
    sWarga.appendRow(["w-5", "Rudi Hartono", "3301010101010005"]);
  }

  // 3. Sheet Jadwal
  var sJadwal = SPREADSHEET.getSheetByName(SHEET_JADWAL);
  if (!sJadwal) {
    sJadwal = SPREADSHEET.insertSheet(SHEET_JADWAL);
    sJadwal.appendRow(["ID", "Hari", "Petugas ID"]);
    sJadwal.appendRow(["j-1", "Senin", "p-1"]);
    sJadwal.appendRow(["j-2", "Selasa", "p-2"]);
    sJadwal.appendRow(["j-3", "Rabu", "p-3"]);
    sJadwal.appendRow(["j-4", "Kamis", "p-1"]);
    sJadwal.appendRow(["j-5", "Jumat", "p-2"]);
    sJadwal.appendRow(["j-6", "Sabtu", "p-3"]);
    sJadwal.appendRow(["j-7", "Minggu", "p-1"]);
  }

  // 4. Sheet Jimpitan
  var sJimpitan = SPREADSHEET.getSheetByName(SHEET_JIMPITAN);
  if (!sJimpitan) {
    sJimpitan = SPREADSHEET.insertSheet(SHEET_JIMPITAN);
    sJimpitan.appendRow(["ID", "Tanggal", "Nama Warga", "No KK", "Jumlah", "Nama Petugas"]);
    var today = new Date().toISOString().split('T')[0];
    sJimpitan.appendRow(["t-1", today, "Ahmad Subarjo", "3301010101010001", 2000, "Budi Santoso"]);
    sJimpitan.appendRow(["t-2", today, "Slamet Riyadi", "3301010101010002", 2000, "Budi Santoso"]);
  }

  // 5. Sheet Keuangan RT
  var sKeuangan = SPREADSHEET.getSheetByName(SHEET_KEUANGAN);
  if (!sKeuangan) {
    sKeuangan = SPREADSHEET.insertSheet(SHEET_KEUANGAN);
    sKeuangan.appendRow(["ID", "Tanggal", "Jenis", "Kategori", "Keterangan", "Debit", "Kredit", "Saldo", "Dicatat Oleh", "Is Tutup Buku", "Bulan Buku"]);
    
    // Sample Initial Balances & Transactions
    sKeuangan.appendRow(["k-1", "2026-07-01", "pemasukan", "Saldo Awal Bulan", "Saldo Awal Kas RT Bulan Juli 2026", 2500000, 0, 2500000, "Dewi Lestari (Bendahara RT)", false, "2026-07"]);
    sKeuangan.appendRow(["k-2", "2026-07-10", "pemasukan", "Setoran Jimpitan", "Rekap Setoran Jimpitan Ronda Juli", 640000, 0, 3140000, "Dewi Lestari (Bendahara RT)", false, "2026-07"]);
    sKeuangan.appendRow(["k-3", "2026-07-15", "pemasukan", "Sumbangan dari Warga", "Donasi sukarela warga", 500000, 0, 3640000, "Dewi Lestari (Bendahara RT)", false, "2026-07"]);
    sKeuangan.appendRow(["k-4", "2026-07-18", "pengeluaran", "Biaya Konsumsi", "Snack rapat RT", 0, 150000, 3490000, "Dewi Lestari (Bendahara RT)", false, "2026-07"]);
    sKeuangan.appendRow(["k-5", "2026-07-22", "pengeluaran", "Dana Sosial", "Santunan warga sakit", 0, 300000, 3190000, "Dewi Lestari (Bendahara RT)", false, "2026-07"]);
    
    // Agustus: Saldo Awal Pindahan
    sKeuangan.appendRow(["k-7", "2026-08-01", "pemasukan", "Saldo Awal Bulan", "Saldo Awal Pindahan dari Tutup Buku Juli 2026", 3190000, 0, 3190000, "Dewi Lestari (Bendahara RT)", true, "2026-08"]);
    sKeuangan.appendRow(["k-8", "2026-08-05", "pemasukan", "Dana Bantuan", "Bantuan Hibah Kelurahan", 1500000, 0, 4690000, "Dewi Lestari (Bendahara RT)", false, "2026-08"]);
    sKeuangan.appendRow(["k-9", "2026-08-10", "pemasukan", "Setoran Jimpitan", "Setoran Jimpitan Ronda Awal Agustus", 280000, 0, 4970000, "Dewi Lestari (Bendahara RT)", false, "2026-08"]);
    sKeuangan.appendRow(["k-10", "2026-08-14", "pengeluaran", "Biaya Lomba", "Hadiah lomba 17-an", 0, 850000, 4120000, "Dewi Lestari (Bendahara RT)", false, "2026-08"]);
    sKeuangan.appendRow(["k-11", "2026-08-16", "pengeluaran", "Biaya Resepsi", "Sewa tratak & tumpeng Malam Tirakatan", 0, 650000, 3470000, "Dewi Lestari (Bendahara RT)", false, "2026-08"]);
    sKeuangan.appendRow(["k-12", "2026-08-20", "pemasukan", "Sumbangan dari Warga", "Donasi warga untuk HUT RI", 600000, 0, 4070000, "Dewi Lestari (Bendahara RT)", false, "2026-08"]);
  }

  // 6. Sheet Tutup Buku
  var sTutupBuku = SPREADSHEET.getSheetByName(SHEET_TUTUP_BUKU);
  if (!sTutupBuku) {
    sTutupBuku = SPREADSHEET.insertSheet(SHEET_TUTUP_BUKU);
    sTutupBuku.appendRow(["ID", "Bulan Buku", "Tanggal Tutup", "Saldo Awal", "Total Pemasukan", "Total Pengeluaran", "Saldo Akhir", "Ditutup Oleh", "Catatan"]);
    sTutupBuku.appendRow(["tb-2026-07", "2026-07", "2026-07-31", 2500000, 1140000, 450000, 3190000, "Dewi Lestari (Bendahara RT)", "Tutup buku kas bulanan Juli 2026."]);
  }

  // 7. Sheet Arisan Peserta
  var sArisanPeserta = SPREADSHEET.getSheetByName(SHEET_ARISAN_PESERTA);
  if (!sArisanPeserta) {
    sArisanPeserta = SPREADSHEET.insertSheet(SHEET_ARISAN_PESERTA);
    sArisanPeserta.appendRow(["ID", "Warga ID", "Nama Peserta", "No KK", "Nomor Urut", "Tanggal Gabung", "Sudah Menang", "Menang Periode Ke", "Tanggal Menang"]);
    sArisanPeserta.appendRow(["ap-1", "w-1", "Ahmad Subarjo", "3301010101010001", 1, "2026-07-01", true, 1, "2026-07-15"]);
    sArisanPeserta.appendRow(["ap-2", "w-2", "Slamet Riyadi", "3301010101010002", 2, "2026-07-01", false, "", ""]);
  }

  // 8. Sheet Setoran Arisan
  var sArisanSetoran = SPREADSHEET.getSheetByName(SHEET_ARISAN_SETORAN);
  if (!sArisanSetoran) {
    sArisanSetoran = SPREADSHEET.insertSheet(SHEET_ARISAN_SETORAN);
    sArisanSetoran.appendRow(["ID", "Peserta ID", "Nama Peserta", "No KK", "Bulan", "Periode Ke", "Jumlah", "Tanggal Bayar", "Status", "Dicatat Oleh"]);
  }

  // 9. Sheet Pemenang Arisan
  var sArisanPemenang = SPREADSHEET.getSheetByName(SHEET_ARISAN_PEMENANG);
  if (!sArisanPemenang) {
    sArisanPemenang = SPREADSHEET.insertSheet(SHEET_ARISAN_PEMENANG);
    sArisanPemenang.appendRow(["ID", "Periode Ke", "Tanggal Kocok", "Peserta ID", "Nama Peserta", "No KK", "Total Hadiah", "Bulan", "Catatan"]);
  }

  // 10. Sheet Config Arisan
  var sArisanConfig = SPREADSHEET.getSheetByName(SHEET_ARISAN_CONFIG);
  if (!sArisanConfig) {
    sArisanConfig = SPREADSHEET.insertSheet(SHEET_ARISAN_CONFIG);
    sArisanConfig.appendRow(["Key", "Value"]);
    sArisanConfig.appendRow(["namaArisan", "Arisan Warga RT 01"]);
    sArisanConfig.appendRow(["nominalIuran", "50000"]);
    sArisanConfig.appendRow(["tanggalPengocokan", "Tanggal 15 Setiap Bulan"]);
    sArisanConfig.appendRow(["periodeBerjalan", "2"]);
    sArisanConfig.appendRow(["status", "aktif"]);
  }

  // 11. Sheet Peringatan Darurat
  var sDarurat = SPREADSHEET.getSheetByName(SHEET_DARURAT);
  if (!sDarurat) {
    sDarurat = SPREADSHEET.insertSheet(SHEET_DARURAT);
    sDarurat.appendRow(["ID", "Tanggal", "Kategori", "Nama Pelapor", "No KK", "Lokasi", "Latitude", "Longitude", "Map URL", "Keterangan", "Status", "Ditangani Oleh", "Waktu Selesai"]);
  }

  // 12. Sheet Walkie Talkie
  var sWalkie = SPREADSHEET.getSheetByName(SHEET_WALKIE_TALKIE);
  if (!sWalkie) {
    sWalkie = SPREADSHEET.insertSheet(SHEET_WALKIE_TALKIE);
    sWalkie.appendRow(["ID", "Tanggal", "Nama Pengirim", "Role Pengirim", "Audio Data", "Durasi Detik"]);
  }
}

// Handler untuk GET (Membaca Data)
function doGet(e) {
  initSheets();
  
  var response = {};
  try {
    // Pastikan saldo (Kolom H) selalu terhitung akurat
    recalculateKeuanganSheet();

    response.petugas = readData(SHEET_PETUGAS, ["id", "username", "password", "nama", "role"]);
    response.warga = readData(SHEET_WARGA, ["id", "namaKK", "noKK"]);
    response.jadwal = readData(SHEET_JADWAL, ["id", "hari", "petugasId"]);
    response.jimpitan = readData(SHEET_JIMPITAN, ["id", "tanggal", "namaWarga", "noKK", "jumlah", "namaPetugas"]);
    
    // Read Keuangan & Tutup Buku
    response.keuangan = readData(SHEET_KEUANGAN, ["id", "tanggal", "jenis", "kategori", "keterangan", "debit", "kredit", "saldo", "dicatatOleh", "isTutupBuku", "bulanBuku"]);
    response.tutupBuku = readData(SHEET_TUTUP_BUKU, ["id", "bulanBuku", "tanggalTutup", "saldoAwal", "totalPemasukan", "totalPengeluaran", "saldoAkhir", "ditutupOleh", "catatan"]);
    
    // Read Arisan
    response.arisanPeserta = readData(SHEET_ARISAN_PESERTA, ["id", "wargaId", "namaPeserta", "noKK", "nomorUrut", "tanggalGabung", "sudahMenang", "menangPeriodeKe", "tanggalMenang"]);
    response.arisanSetoran = readData(SHEET_ARISAN_SETORAN, ["id", "pesertaId", "namaPeserta", "noKK", "bulan", "periodeKe", "jumlah", "tanggalBayar", "status", "dicatatOleh"]);
    response.arisanPemenang = readData(SHEET_ARISAN_PEMENANG, ["id", "periodeKe", "tanggalKocok", "pesertaId", "namaPeserta", "noKK", "totalHadiah", "bulan", "catatan"]);
    
    // Read Darurat & Walkie Talkie
    response.darurat = readData(SHEET_DARURAT, ["id", "tanggal", "kategori", "namaPelapor", "noKK", "lokasi", "latitude", "longitude", "mapUrl", "keterangan", "status", "ditanganiOleh", "waktuSelesai"]);
    response.walkieTalkie = readData(SHEET_WALKIE_TALKIE, ["id", "tanggal", "namaPengirim", "rolePengirim", "audioData", "durasiDetik"]);

    // Read Config
    response.arisanConfig = readConfig(SHEET_ARISAN_CONFIG);
    response.status = "success";
  } catch (err) {
    response.status = "error";
    response.message = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handler untuk POST (Menulis, Mengubah, Menghapus Data)
function doPost(e) {
  initSheets();
  
  var response = {};
  try {
    var postData;
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      postData = e.parameter;
    }
    
    var action = postData.action;
    
    // --- PETUGAS ---
    if (action === "addPetugas") {
      var id = postData.id || ("p-" + new Date().getTime());
      appendRowToSheet(SHEET_PETUGAS, [id, postData.username, postData.password, postData.nama, postData.role || "petugas"]);
      response.status = "success";
      response.id = id;
    } 
    else if (action === "editPetugas") {
      updateRowInSheet(SHEET_PETUGAS, postData.id, {
        "Username": postData.username,
        "Password": postData.password,
        "Nama Petugas": postData.nama,
        "Hak Akses": postData.role || "petugas"
      });
      response.status = "success";
    } 
    else if (action === "deletePetugas") {
      deleteRowInSheet(SHEET_PETUGAS, postData.id);
      response.status = "success";
    }
    // --- WARGA ---
    else if (action === "addWarga") {
      var id = "w-" + new Date().getTime();
      appendRowToSheet(SHEET_WARGA, [id, postData.namaKK, postData.noKK]);
      response.status = "success";
      response.id = id;
    }
    else if (action === "editWarga") {
      updateRowInSheet(SHEET_WARGA, postData.id, {
        "Nama KK": postData.namaKK,
        "No KK": postData.noKK
      });
      response.status = "success";
    }
    else if (action === "deleteWarga") {
      deleteRowInSheet(SHEET_WARGA, postData.id);
      response.status = "success";
    }
    // --- JADWAL ---
    else if (action === "saveJadwal") {
      var sJadwal = SPREADSHEET.getSheetByName(SHEET_JADWAL);
      sJadwal.clearContents();
      sJadwal.appendRow(["ID", "Hari", "Petugas ID"]);
      var jadwalArr = postData.jadwal;
      for (var i = 0; i < jadwalArr.length; i++) {
        var j = jadwalArr[i];
        sJadwal.appendRow([j.id, j.hari, j.petugasId]);
      }
      response.status = "success";
    }
    // --- JIMPITAN ---
    else if (action === "addJimpitan") {
      var id = "t-" + new Date().getTime();
      appendRowToSheet(SHEET_JIMPITAN, [id, postData.tanggal, postData.namaWarga, postData.noKK, postData.jumlah, postData.namaPetugas]);
      response.status = "success";
      response.id = id;
    }
    // --- KEUANGAN RT: ADD ---
    else if (action === "addKeuangan") {
      var id = postData.id || ("k-" + new Date().getTime());
      var debit = Number(postData.debit) || 0;
      var kredit = Number(postData.kredit) || 0;
      var saldo = Number(postData.saldo) || 0;
      var isTutupBuku = postData.isTutupBuku === true;
      var cleanTanggal = String(postData.tanggal || "").trim();
      var cleanBulan = postData.bulanBuku || (cleanTanggal ? cleanTanggal.substring(0, 7) : "");
      var cleanJenis = String(postData.jenis || (debit > 0 ? "pemasukan" : "pengeluaran")).toLowerCase().trim();

      appendRowToSheet(SHEET_KEUANGAN, [
        id,
        cleanTanggal,
        cleanJenis,
        postData.kategori || (cleanJenis === "pemasukan" ? "Lain-lain Pemasukan" : "Lain-lain Pengeluaran"),
        postData.keterangan || "",
        debit,
        kredit,
        saldo,
        postData.dicatatOleh || "Bendahara",
        isTutupBuku,
        cleanBulan
      ]);

      // Hitung dan perbarui seluruh Saldo berjalan (Kolom H) otomatis di sheet Keuangan
      recalculateKeuanganSheet();

      response.status = "success";
      response.id = id;
    }
    // --- KEUANGAN RT: EDIT ---
    else if (action === "editKeuangan") {
      var editDebit = Number(postData.debit) || 0;
      var editKredit = Number(postData.kredit) || 0;
      var editTanggal = String(postData.tanggal || "").trim();
      var editBulan = postData.bulanBuku || (editTanggal ? editTanggal.substring(0, 7) : "");
      var editJenis = String(postData.jenis || (editDebit > 0 ? "pemasukan" : "pengeluaran")).toLowerCase().trim();

      updateRowInSheet(SHEET_KEUANGAN, postData.id, {
        "Tanggal": editTanggal,
        "Jenis": editJenis,
        "Kategori": postData.kategori,
        "Keterangan": postData.keterangan,
        "Debit": editDebit,
        "Kredit": editKredit,
        "Saldo": Number(postData.saldo) || 0,
        "Dicatat Oleh": postData.dicatatOleh || "Bendahara",
        "Bulan Buku": editBulan
      });

      // Hitung dan perbarui seluruh Saldo berjalan (Kolom H) otomatis di sheet Keuangan
      recalculateKeuanganSheet();

      response.status = "success";
    }
    // --- KEUANGAN RT: DELETE ---
    else if (action === "deleteKeuangan") {
      deleteRowInSheet(SHEET_KEUANGAN, postData.id);
      recalculateKeuanganSheet();
      response.status = "success";
    }
    // --- KEUANGAN RT: TUTUP BUKU BULANAN ---
    else if (action === "tutupBukuKeuangan") {
      // 1. Simpan rekapitulasi ke Sheet TutupBuku
      var tb = postData.tutupBukuRecord;
      appendRowToSheet(SHEET_TUTUP_BUKU, [
        tb.id,
        tb.bulanBuku,
        tb.tanggalTutup,
        Number(tb.saldoAwal) || 0,
        Number(tb.totalPemasukan) || 0,
        Number(tb.totalPengeluaran) || 0,
        Number(tb.saldoAkhir) || 0,
        tb.ditutupOleh || "Bendahara",
        tb.catatan || ""
      ]);

      // 2. Tambahkan Saldo Awal Otomatis ke bulan berikutnya jika disediakan
      if (postData.saldoAwalRecord) {
        var sa = postData.saldoAwalRecord;
        appendRowToSheet(SHEET_KEUANGAN, [
          sa.id,
          sa.tanggal,
          "pemasukan",
          sa.kategori || "Saldo Awal Bulan",
          sa.keterangan,
          Number(sa.debit) || 0,
          0,
          Number(sa.saldo) || Number(sa.debit) || 0,
          sa.dicatatOleh || "Sistem (Tutup Buku)",
          true,
          sa.bulanBuku
        ]);
      }

      recalculateKeuanganSheet();
      response.status = "success";
    }
    // --- KEUANGAN RT: BATAL TUTUP BUKU ---
    else if (action === "batalTutupBuku") {
      deleteRowInSheet(SHEET_TUTUP_BUKU, postData.tutupBukuId);
      if (postData.saldoAwalId) {
        deleteRowInSheet(SHEET_KEUANGAN, postData.saldoAwalId);
      }
      recalculateKeuanganSheet();
      response.status = "success";
    }
    // --- ARISAN: PESERTA ---
    else if (action === "addArisanPeserta") {
      var id = postData.id || ("ap-" + new Date().getTime());
      appendRowToSheet(SHEET_ARISAN_PESERTA, [
        id, 
        postData.wargaId, 
        postData.namaPeserta, 
        postData.noKK, 
        postData.nomorUrut || 1, 
        postData.tanggalGabung, 
        false, 
        "", 
        ""
      ]);
      response.status = "success";
      response.id = id;
    }
    else if (action === "deleteArisanPeserta") {
      deleteRowInSheet(SHEET_ARISAN_PESERTA, postData.id);
      response.status = "success";
    }
    // --- ARISAN: SETORAN ---
    else if (action === "toggleArisanSetoran") {
      var sSetoran = SPREADSHEET.getSheetByName(SHEET_ARISAN_SETORAN);
      var values = sSetoran.getDataRange().getValues();
      var tz = SPREADSHEET.getSpreadsheetTimeZone() || "Asia/Jakarta";
      var targetBulan = String(postData.bulan || "").trim().substring(0, 7);
      var targetPesertaId = String(postData.pesertaId || "").trim();
      var found = false;

      for (var r = 1; r < values.length; r++) {
        var rowPesertaId = String(values[r][1] || "").trim();
        var rowBulan = values[r][4];
        if (rowBulan instanceof Date) {
          rowBulan = Utilities.formatDate(rowBulan, tz, "yyyy-MM");
        } else {
          rowBulan = String(rowBulan || "").trim().substring(0, 7);
        }

        if (rowPesertaId === targetPesertaId && rowBulan === targetBulan) {
          sSetoran.getRange(r + 1, 9).setValue(postData.isLunas ? "lunas" : "belum");
          sSetoran.getRange(r + 1, 8).setValue(postData.isLunas ? Utilities.formatDate(new Date(), tz, "yyyy-MM-dd") : "");
          found = true;
          break;
        }
      }
      if (!found && postData.isLunas) {
        var id = "as-" + new Date().getTime();
        appendRowToSheet(SHEET_ARISAN_SETORAN, [
          id,
          postData.pesertaId,
          postData.namaPeserta,
          postData.noKK,
          "'" + targetBulan,
          postData.periodeKe || 1,
          Number(postData.nominal) || 50000,
          Utilities.formatDate(new Date(), tz, "yyyy-MM-dd"),
          "lunas",
          postData.dicatatOleh || "Admin"
        ]);
      }
      response.status = "success";
    }
    // --- ARISAN: WINNER DRAW ---
    else if (action === "kocokArisanWinner") {
      var win = postData.winnerRecord;
      appendRowToSheet(SHEET_ARISAN_PEMENANG, [
        win.id,
        win.periodeKe,
        win.tanggalKocok,
        win.pesertaId,
        win.namaPeserta,
        win.noKK,
        win.totalHadiah,
        win.bulan,
        win.catatan || ""
      ]);
      // Update participant marked won
      updateRowInSheet(SHEET_ARISAN_PESERTA, postData.pesertaId, {
        "Sudah Menang": true,
        "Menang Periode Ke": win.periodeKe,
        "Tanggal Menang": win.tanggalKocok
      });
      response.status = "success";
    }
    // --- ARISAN: RESET CYCLE ---
    else if (action === "resetArisanCycle") {
      var sPeserta = SPREADSHEET.getSheetByName(SHEET_ARISAN_PESERTA);
      if (sPeserta) {
        sPeserta.clearContents();
        sPeserta.appendRow(["ID", "Warga ID", "Nama Peserta", "No KK", "Nomor Urut", "Tanggal Gabung", "Sudah Menang", "Menang Periode Ke", "Tanggal Menang"]);
      }
      if (postData.config) {
        var sConfig = SPREADSHEET.getSheetByName(SHEET_ARISAN_CONFIG);
        if (sConfig) {
          sConfig.clearContents();
          sConfig.appendRow(["Key", "Value"]);
          var cfg = postData.config;
          for (var key in cfg) {
            sConfig.appendRow([key, cfg[key]]);
          }
        }
      }
      response.status = "success";
    }
    // --- ARISAN: CONFIG SAVE ---
    else if (action === "saveArisanConfig") {
      var sConfig = SPREADSHEET.getSheetByName(SHEET_ARISAN_CONFIG);
      sConfig.clearContents();
      sConfig.appendRow(["Key", "Value"]);
      var cfg = postData.config;
      for (var key in cfg) {
        sConfig.appendRow([key, cfg[key]]);
      }
      response.status = "success";
    }
    // --- DARURAT: TRIGGER ALERT ---
    else if (action === "triggerDarurat") {
      var id = postData.id || ("d-" + new Date().getTime());
      appendRowToSheet(SHEET_DARURAT, [
        id,
        postData.tanggal || new Date().toISOString(),
        postData.kategori,
        postData.namaPelapor,
        postData.noKK || "",
        postData.lokasi || "",
        postData.latitude || "",
        postData.longitude || "",
        postData.mapUrl || "",
        postData.keterangan || "",
        "AKTIF",
        "",
        ""
      ]);
      response.status = "success";
      response.id = id;
    }
    // --- DARURAT: RESOLVE ALERT ---
    else if (action === "resolveDarurat") {
      updateRowInSheet(SHEET_DARURAT, postData.id, {
        "Status": "SELESAI",
        "Ditangani Oleh": postData.ditanganiOleh || "Petugas",
        "Waktu Selesai": new Date().toISOString()
      });
      response.status = "success";
    }
    // --- WALKIE TALKIE: ADD AUDIO VOICE ---
    else if (action === "addWalkieTalkie") {
      var id = postData.id || ("wt-" + new Date().getTime());
      appendRowToSheet(SHEET_WALKIE_TALKIE, [
        id,
        postData.tanggal || new Date().toISOString(),
        postData.namaPengirim,
        postData.rolePengirim || "Warga",
        postData.audioData || "",
        postData.durasiDetik || 3
      ]);
      response.status = "success";
      response.id = id;
    }
    else {
      response.status = "error";
      response.message = "Aksi tidak dikenali: " + action;
    }
  } catch (err) {
    response.status = "error";
    response.message = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------
function readData(sheetName, headersKeys) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var tz = SPREADSHEET.getSpreadsheetTimeZone() || "Asia/Jakarta";
  var headerRow = values[0];
  
  // Mapping key ke indeks kolom di spreadsheet
  var colMap = {};
  for (var k = 0; k < headersKeys.length; k++) {
    var key = headersKeys[k];
    var targetCol = -1;
    var cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    for (var c = 0; c < headerRow.length; c++) {
      var cleanHeader = String(headerRow[c]).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanHeader === cleanKey) {
        targetCol = c;
        break;
      }
    }
    // Fallback bila header tidak persis sama
    if (targetCol === -1 && k < headerRow.length) {
      targetCol = k;
    }
    colMap[key] = targetCol;
  }

  var result = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var obj = {};
    for (var c = 0; c < headersKeys.length; c++) {
      var key = headersKeys[c];
      var colIdx = colMap[key];
      var cellVal = (colIdx !== -1 && row[colIdx] !== undefined) ? row[colIdx] : "";
      
      if (cellVal instanceof Date) {
        if (key === "bulan" || key === "bulanBuku") {
          cellVal = Utilities.formatDate(cellVal, tz, "yyyy-MM");
        } else {
          cellVal = Utilities.formatDate(cellVal, tz, "yyyy-MM-dd");
        }
      } else if (typeof cellVal === "string") {
        cellVal = cellVal.trim();
        if ((key === "bulan" || key === "bulanBuku") && cellVal.length >= 7 && cellVal.indexOf("-") !== -1) {
          cellVal = cellVal.substring(0, 7);
        }
        if (key === "status" || key === "jenis") {
          cellVal = cellVal.toLowerCase();
        }
      }
      
      if (key === "jumlah" || key === "totalHadiah" || key === "nominalIuran" || key === "nomorUrut" || key === "periodeKe" || key === "menangPeriodeKe" || key === "debit" || key === "kredit" || key === "saldo" || key === "saldoAwal" || key === "totalPemasukan" || key === "totalPengeluaran" || key === "saldoAkhir") {
        if (typeof cellVal === "string") {
          cellVal = Number(cellVal.replace(/[^0-9.-]/g, "")) || 0;
        } else {
          cellVal = Number(cellVal) || 0;
        }
      }
      if (key === "sudahMenang" || key === "isTutupBuku") {
        cellVal = cellVal === true || String(cellVal).toLowerCase() === "true";
      }
      obj[key] = cellVal;
    }
    result.push(obj);
  }
  return result;
}

function readConfig(sheetName) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  var config = {
    namaArisan: "Arisan Warga RT 01",
    nominalIuran: 50000,
    tanggalPengocokan: "Tanggal 15 Setiap Bulan",
    periodeBerjalan: 1,
    status: "aktif"
  };
  if (!sheet) return config;
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    var k = values[r][0];
    var v = values[r][1];
    if (k === "nominalIuran" || k === "periodeBerjalan") {
      v = Number(v) || 0;
    }
    config[k] = v;
  }
  return config;
}

function appendRowToSheet(sheetName, rowArray) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  sheet.appendRow(rowArray);
}

function updateRowInSheet(sheetName, id, keyValueMap) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;
  
  var headerRow = values[0];
  for (var r = 1; r < values.length; r++) {
    if (values[r][0] == id) {
      for (var colName in keyValueMap) {
        var colIndex = headerRow.indexOf(colName);
        if (colIndex !== -1) {
          sheet.getRange(r + 1, colIndex + 1).setValue(keyValueMap[colName]);
        }
      }
      break;
    }
  }
}

function deleteRowInSheet(sheetName, id) {
  var sheet = SPREADSHEET.getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (values[r][0] == id) {
      sheet.deleteRow(r + 1);
      break;
    }
  }
}

// Menghitung dan memperbarui saldo berjalan (Kolom H) otomatis untuk seluruh baris di Sheet Keuangan
function recalculateKeuanganSheet() {
  var sheet = SPREADSHEET.getSheetByName(SHEET_KEUANGAN);
  if (!sheet) return;
  
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;
  
  var headerRow = values[0];
  var colDebit = -1;
  var colKredit = -1;
  var colSaldo = -1;
  var colKategori = -1;
  var colIsTutupBuku = -1;
  
  for (var c = 0; c < headerRow.length; c++) {
    var h = String(headerRow[c]).toLowerCase().trim();
    if (h === "debit") colDebit = c;
    if (h === "kredit") colKredit = c;
    if (h === "saldo") colSaldo = c;
    if (h === "kategori") colKategori = c;
    if (h === "istutupbuku") colIsTutupBuku = c;
  }
  
  // Posisi default jika header kolom: D (Kategori=3), F (Debit=5), G (Kredit=6), H (Saldo=7), J (IsTutupBuku=9)
  if (colDebit === -1) colDebit = 5;
  if (colKredit === -1) colKredit = 6;
  if (colSaldo === -1) colSaldo = 7;
  if (colKategori === -1) colKategori = 3;
  if (colIsTutupBuku === -1) colIsTutupBuku = 9;
  
  var runningSaldo = 0;
  var saldosToWrite = [];
  
  for (var r = 1; r < values.length; r++) {
    var debit = Number(values[r][colDebit]) || 0;
    var kredit = Number(values[r][colKredit]) || 0;
    var kat = String(values[r][colKategori] || "").toLowerCase().trim();
    var isTB = values[r][colIsTutupBuku] === true || String(values[r][colIsTutupBuku]).toLowerCase().trim() === "true";
    
    var isOpening = isTB || kat === "saldo awal bulan" || kat.indexOf("saldo awal") !== -1;

    if (isOpening) {
      runningSaldo = debit - kredit;
    } else {
      runningSaldo = runningSaldo + debit - kredit;
    }

    saldosToWrite.push([runningSaldo]);
  }
  
  if (saldosToWrite.length > 0) {
    sheet.getRange(2, colSaldo + 1, saldosToWrite.length, 1).setValues(saldosToWrite);
  }
}
`;
