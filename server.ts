import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to persistent database.json
const DB_PATH = path.join(process.cwd(), "database.json");
const SEED_PATH = path.join(process.cwd(), "src", "seed.json");

// Local DB cache
let db: {
  registrations: any[];
  accounts: any[];
  config?: {
    spreadsheetUrl?: string;
    autoSync?: boolean;
  };
} = { registrations: [], accounts: [], config: { spreadsheetUrl: "", autoSync: false } };

// Initialize/Load Database
function initDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      console.log("Loading existing database.json...");
      const data = fs.readFileSync(DB_PATH, "utf8");
      db = JSON.parse(data);
      if (!db.config) {
        db.config = { spreadsheetUrl: "", autoSync: false };
      }
    } else {
      console.log("Database file not found. Seeding from src/seed.json...");
      if (fs.existsSync(SEED_PATH)) {
        const seedData = fs.readFileSync(SEED_PATH, "utf8");
        db = JSON.parse(seedData);
        if (!db.config) {
          db.config = { spreadsheetUrl: "", autoSync: false };
        }
        console.log("Database successfully seeded!");
      } else {
        console.warn("Seed file not found! Starting with empty database.");
        db = { registrations: [], accounts: [], config: { spreadsheetUrl: "", autoSync: false } };
      }
    }

    // De-duplicate accounts case-insensitively
    if (db.accounts && Array.isArray(db.accounts)) {
      const seen = new Set<string>();
      db.accounts = db.accounts.filter((acc) => {
        if (!acc || !acc.nama_akun) return false;
        const key = acc.nama_akun.trim().toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    // Save cleaned database
    saveDatabase();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    db = { registrations: [], accounts: [], config: { spreadsheetUrl: "", autoSync: false } };
  }
}

// Helper to sync a single registration to Google Sheets Web App
async function syncToSpreadsheet(reg: any) {
  if (!db.config?.autoSync || !db.config?.spreadsheetUrl) {
    return;
  }
  try {
    const account = db.accounts.find(
      (acc) => acc.nama_akun.trim().toLowerCase() === reg.nama_sekolah.trim().toLowerCase()
    );
    const payload = {
      ...reg,
      password: account ? account.password : ""
    };
    const response = await fetch(db.config.spreadsheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error(`Spreadsheet sync failed with status ${response.status}`);
    } else {
      const resData = await response.json().catch(() => ({}));
      console.log("Spreadsheet sync response:", resData);
    }
  } catch (err) {
    console.error("Error during spreadsheet sync:", err);
  }
}

// Helper to save database
function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save database:", error);
  }
}

initDatabase();

// --- API ROUTES ---

// 1. Get Pangkalan/School names
app.get("/api/pangkalan-list", (req, res) => {
  const list = Array.from(
    new Set(
      db.accounts
        .filter((acc) => acc.nama_akun !== "admin")
        .map((acc) => acc.nama_akun.trim())
    )
  ).sort();
  res.json(list);
});

// 2. User Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: "Pangkalan/Username diperlukan." });
  }

  const role = username.trim().toLowerCase() === "admin" ? "admin" : "peserta";

  if (role === "admin") {
    if (!password) {
      return res.status(400).json({ success: false, message: "Kata sandi diperlukan untuk Admin." });
    }

    const account = db.accounts.find(
      (acc) => acc.nama_akun.trim().toLowerCase() === "admin"
    );

    if (!account || account.password !== password) {
      return res.status(401).json({ success: false, message: "Kata sandi Admin salah." });
    }

    return res.json({
      success: true,
      role: "admin",
      message: "Berhasil masuk sebagai Admin.",
    });
  }

  // School login (no password needed)
  const account = db.accounts.find(
    (acc) => acc.nama_akun.trim().toLowerCase() === username.trim().toLowerCase()
  );

  if (!account) {
    return res.status(401).json({ success: false, message: "Pangkalan tidak ditemukan." });
  }

  // Find existing registration details
  const reg = db.registrations.find(
    (r) => r.nama_sekolah.trim().toLowerCase() === username.trim().toLowerCase()
  );

  res.json({
    success: true,
    role: "peserta",
    data: reg || null,
    message: "Berhasil masuk.",
  });
});

// 3. Submit/Save Pendaftaran
app.post("/api/submit-pendaftaran", (req, res) => {
  const {
    sekolah,
    namaKamabigus,
    nipKamabigus,
    jmlPutra,
    jmlPutri,
    jmlTenda,
    catatan,
  } = req.body;

  if (!sekolah) {
    return res.status(400).json({ status: "error", message: "Nama Pangkalan diperlukan." });
  }

  // Find registration index case-insensitively
  let idx = db.registrations.findIndex(
    (r) => r.nama_sekolah.trim().toLowerCase() === sekolah.trim().toLowerCase()
  );

  let reg: any;

  if (idx !== -1) {
    // Update existing row
    reg = db.registrations[idx];
    reg.nama_kamabigus = namaKamabigus || "-";
    reg.nip_kamabigus = nipKamabigus || "-";
    reg.jumlah_peserta_putra = jmlPutra;
    reg.jumlah_peserta_putri = jmlPutri;
    reg.jumlah_tenda = jmlTenda;
    reg.catatan = catatan || "";
  } else {
    // Generate new entry if not existing (failsafe)
    const newId = `PKL${String(db.registrations.length + 1).padStart(3, "0")}`;
    const kodePa = String(Math.floor(10000 + Math.random() * 90000));
    const kodePi = String(Math.floor(10000 + Math.random() * 90000));

    reg = {
      id: newId,
      nama_sekolah: sekolah,
      nama_kamabigus: namaKamabigus || "-",
      nip_kamabigus: nipKamabigus || "-",
      jumlah_peserta_putra: jmlPutra,
      jumlah_peserta_putri: jmlPutri,
      jumlah_tenda: jmlTenda,
      catatan: catatan || "",
      kode_pa: kodePa,
      kode_pi: kodePi,
    };
    db.registrations.push(reg);
  }

  saveDatabase();

  // Try syncing to Spreadsheet in background if configured
  if (db.config?.autoSync && db.config?.spreadsheetUrl) {
    syncToSpreadsheet(reg);
  }

  res.json({
    status: "success",
    kodePa: reg.kode_pa,
    kodePi: reg.kode_pi,
    message: "Data pendaftaran berhasil disimpan.",
  });
});

// Admin Edit Registration
app.post("/api/admin/edit-registration", (req, res) => {
  const {
    id,
    nama_kamabigus,
    nip_kamabigus,
    jumlah_peserta_putra,
    jumlah_peserta_putri,
    jumlah_tenda,
    catatan,
  } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID Pangkalan diperlukan." });
  }

  const reg = db.registrations.find((r) => r.id === id);
  if (!reg) {
    return res.status(404).json({ success: false, message: "Pendaftaran tidak ditemukan." });
  }

  reg.nama_kamabigus = nama_kamabigus || "-";
  reg.nip_kamabigus = nip_kamabigus || "-";
  reg.jumlah_peserta_putra = jumlah_peserta_putra || "";
  reg.jumlah_peserta_putri = jumlah_peserta_putri || "";
  reg.jumlah_tenda = jumlah_tenda || "";
  reg.catatan = catatan || "";

  saveDatabase();

  if (db.config?.autoSync && db.config?.spreadsheetUrl) {
    syncToSpreadsheet(reg);
  }

  res.json({ success: true, message: "Data pendaftaran sekolah berhasil diperbarui." });
});

// Admin Delete Registration (Reset details)
app.post("/api/admin/delete-registration", (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID Pangkalan diperlukan." });
  }

  const reg = db.registrations.find((r) => r.id === id);
  if (!reg) {
    return res.status(404).json({ success: false, message: "Pendaftaran tidak ditemukan." });
  }

  // Clear fields to reset registration status to "Belum"
  reg.nama_kamabigus = "-";
  reg.nip_kamabigus = "-";
  reg.jumlah_peserta_putra = "";
  reg.jumlah_peserta_putri = "";
  reg.jumlah_tenda = "";
  reg.catatan = "";

  saveDatabase();

  if (db.config?.autoSync && db.config?.spreadsheetUrl) {
    syncToSpreadsheet(reg);
  }

  res.json({ success: true, message: "Isian pendaftaran sekolah berhasil dihapus." });
});

// 4. Change Password
app.post("/api/change-password", (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Semua bidang harus diisi." });
  }

  const account = db.accounts.find(
    (acc) => acc.nama_akun.trim().toLowerCase() === username.trim().toLowerCase()
  );

  if (!account) {
    return res.status(404).json({ success: false, message: "Akun tidak ditemukan." });
  }

  if (account.password !== oldPassword) {
    return res.status(401).json({ success: false, message: "Sandi lama salah." });
  }

  account.password = newPassword;
  saveDatabase();

  // Sync to Spreadsheet immediately when password changes
  const reg = db.registrations.find(
    (r) => r.nama_sekolah.trim().toLowerCase() === username.trim().toLowerCase()
  );
  if (reg && db.config?.autoSync && db.config?.spreadsheetUrl) {
    syncToSpreadsheet(reg);
  }

  res.json({ success: true, message: "Kata sandi berhasil diubah." });
});

// 5. Get Admin Dashboard Data
app.get("/api/admin-dashboard", (req, res) => {
  let totalRegistered = 0;
  let sd_mi = 0;
  let smp_mts = 0;
  let sma_smk_ma = 0;

  let totalPutra = 0;
  let totalPutri = 0;

  let tendaPutra = 0;
  let tendaPutri = 0;
  let totalTenda = 0;

  let tendaPutraSdMi = 0;
  let tendaPutraSmpMts = 0;
  let tendaPutraSmaSmkMa = 0;

  let tendaPutriSdMi = 0;
  let tendaPutriSmpMts = 0;
  let tendaPutriSmaSmkMa = 0;

  const catatanList: Array<{ sekolah: string; catatan: string }> = [];

  db.registrations.forEach((r) => {
    // Check if the pangkalan has filled out their participant count (registered)
    const hasPa = r.jumlah_peserta_putra && r.jumlah_peserta_putra.trim() !== "" && r.jumlah_peserta_putra.trim().toLowerCase() !== "tidak ada";
    const hasPi = r.jumlah_peserta_putri && r.jumlah_peserta_putri.trim() !== "" && r.jumlah_peserta_putri.trim().toLowerCase() !== "tidak ada";
    
    // A school is considered registered if any registration data has been submitted
    const isRegistered = (r.jumlah_peserta_putra && r.jumlah_peserta_putra !== "") ||
                         (r.jumlah_peserta_putri && r.jumlah_peserta_putri !== "") ||
                         (r.jumlah_tenda && r.jumlah_tenda !== "");

    if (isRegistered) {
      totalRegistered++;

      // Level categorization
      const name = r.nama_sekolah.toUpperCase();
      let schoolLevel = "sd_mi";
      if (name.includes("SD ") || name.includes("SDN ") || name.includes("MI ") || name.includes("MIN ")) {
        sd_mi++;
        schoolLevel = "sd_mi";
      } else if (name.includes("SMP ") || name.includes("SMPN ") || name.includes("MTS ") || name.includes("MTSS ")) {
        smp_mts++;
        schoolLevel = "smp_mts";
      } else if (name.includes("SMA ") || name.includes("SMK ") || name.includes("MA ") || name.includes("MAS ") || name.includes("MAN ")) {
        sma_smk_ma++;
        schoolLevel = "sma_smk_ma";
      } else {
        sd_mi++; // Default fallback
        schoolLevel = "sd_mi";
      }

      // Participant counts
      if (hasPa) {
        const count = parseInt(r.jumlah_peserta_putra, 10);
        if (!isNaN(count)) totalPutra += count;
      }
      if (hasPi) {
        const count = parseInt(r.jumlah_peserta_putri, 10);
        if (!isNaN(count)) totalPutri += count;
      }

      // Tents computation based on selection and actual participants of each gender
      const tendaStr = (r.jumlah_tenda || "").toLowerCase();
      let addedToPutra = false;
      let addedToPutri = false;

      if (tendaStr.includes("2 tenda") || tendaStr.includes("putra dan putri") || tendaStr.includes("pa dan pi")) {
        // If 2 Tenda is selected:
        // 1 Kapling Pi if they have Putri participants.
        // 1 Kapling Pa if they have Putra participants OR if they don't have Putri participants (defaulting to Pa).
        if (hasPi) {
          tendaPutri += 1;
          addedToPutri = true;
        }
        if (hasPa || !hasPi) {
          tendaPutra += 1;
          addedToPutra = true;
        }
      } else if (tendaStr.includes("kapling putra") || tendaStr.includes("kapling pa") || tendaStr.includes("putra") || tendaStr.includes("pa")) {
        tendaPutra += 1;
        addedToPutra = true;
      } else if (tendaStr.includes("kapling putri") || tendaStr.includes("kapling pi") || tendaStr.includes("putri") || tendaStr.includes("pi")) {
        tendaPutri += 1;
        addedToPutri = true;
      }

      if (addedToPutra) {
        if (schoolLevel === "sd_mi") tendaPutraSdMi++;
        else if (schoolLevel === "smp_mts") tendaPutraSmpMts++;
        else if (schoolLevel === "sma_smk_ma") tendaPutraSmaSmkMa++;
      }
      if (addedToPutri) {
        if (schoolLevel === "sd_mi") tendaPutriSdMi++;
        else if (schoolLevel === "smp_mts") tendaPutriSmpMts++;
        else if (schoolLevel === "sma_smk_ma") tendaPutriSmaSmkMa++;
      }

      // Catatan list
      if (r.catatan && r.catatan.trim() !== "") {
        catatanList.push({
          sekolah: r.nama_sekolah,
          catatan: r.catatan,
        });
      }
    }
  });

  // Calculate total tents as the sum of Putra and Putri kaplings
  totalTenda = tendaPutra + tendaPutri;

  res.json({
    totalRegistered,
    sd_mi,
    smp_mts,
    sma_smk_ma,
    totalPutra,
    totalPutri,
    tendaPutra,
    tendaPutri,
    totalTenda,
    tendaPutraDetail: {
      sd_mi: tendaPutraSdMi,
      smp_mts: tendaPutraSmpMts,
      sma_smk_ma: tendaPutraSmaSmkMa
    },
    tendaPutriDetail: {
      sd_mi: tendaPutriSdMi,
      smp_mts: tendaPutriSmpMts,
      sma_smk_ma: tendaPutriSmaSmkMa
    },
    tendaTotalDetail: {
      sd_mi: tendaPutraSdMi + tendaPutriSdMi,
      smp_mts: tendaPutraSmpMts + tendaPutriSmpMts,
      sma_smk_ma: tendaPutraSmaSmkMa + tendaPutriSmaSmkMa
    },
    catatanList,
    allRegistrations: db.registrations, // useful for the detailed admin table!
  });
});

// 6. Get Spreadsheet Config
app.get("/api/spreadsheet-config", (req, res) => {
  res.json(db.config || { spreadsheetUrl: "", autoSync: false });
});

// 7. Update Spreadsheet Config
app.post("/api/spreadsheet-config", (req, res) => {
  const { spreadsheetUrl, autoSync } = req.body;
  
  db.config = {
    spreadsheetUrl: spreadsheetUrl || "",
    autoSync: !!autoSync,
  };
  
  saveDatabase();
  res.json({ success: true, message: "Pengaturan spreadsheet berhasil disimpan." });
});

// 8. Sync All to Spreadsheet
app.post("/api/sync-all-to-spreadsheet", async (req, res) => {
  if (!db.config?.spreadsheetUrl) {
    return res.status(400).json({ success: false, message: "URL Google Sheets belum dikonfigurasi." });
  }

  const registrations = db.registrations.filter((r) => {
    return (r.jumlah_peserta_putra && r.jumlah_peserta_putra !== "Tidak ada" && r.jumlah_peserta_putra !== "") ||
           (r.jumlah_peserta_putri && r.jumlah_peserta_putri !== "Tidak ada" && r.jumlah_peserta_putri !== "");
  });

  if (registrations.length === 0) {
    return res.json({ success: true, message: "Tidak ada data pendaftaran yang valid untuk disinkronkan." });
  }

  let successCount = 0;
  let failCount = 0;

  for (const reg of registrations) {
    try {
      const account = db.accounts.find(
        (acc) => acc.nama_akun.trim().toLowerCase() === reg.nama_sekolah.trim().toLowerCase()
      );
      const payload = {
        ...reg,
        password: account ? account.password : ""
      };
      const response = await fetch(db.config.spreadsheetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      failCount++;
    }
  }

  res.json({
    success: true,
    message: `Sinkronisasi selesai. Berhasil: ${successCount}, Gagal: ${failCount}.`,
  });
});

// 9. Pull Registrations from Spreadsheet
app.post("/api/pull-from-spreadsheet", async (req, res) => {
  if (!db.config?.spreadsheetUrl) {
    return res.status(400).json({ success: false, message: "URL Google Sheets belum dikonfigurasi." });
  }

  try {
    const response = await fetch(db.config.spreadsheetUrl, {
      method: "GET",
    });

    if (!response.ok) {
      return res.status(500).json({ success: false, message: `Gagal menarik data. Server Spreadsheet merespons dengan status ${response.status}` });
    }

    const resData = await response.json();
    if (resData.status !== "success" || !Array.isArray(resData.registrations)) {
      return res.status(500).json({ success: false, message: resData.message || "Format data dari spreadsheet tidak valid." });
    }

    const fetchedRegs = resData.registrations;
    let updatedCount = 0;

    fetchedRegs.forEach((fetched: any) => {
      if (!fetched || !fetched.nama_sekolah) return;

      // Find local registration to update
      let localReg = db.registrations.find(
        (r) => r.nama_sekolah.trim().toLowerCase() === fetched.nama_sekolah.trim().toLowerCase()
      );

      if (localReg) {
        // Update local registration
        localReg.nama_kamabigus = fetched.nama_kamabigus || "-";
        localReg.nip_kamabigus = fetched.nip_kamabigus || "-";
        localReg.jumlah_peserta_putra = fetched.jumlah_peserta_putra || "";
        localReg.jumlah_peserta_putri = fetched.jumlah_peserta_putri || "";
        localReg.jumlah_tenda = fetched.jumlah_tenda || "";
        localReg.catatan = fetched.catatan || "";
        localReg.kode_pa = fetched.kode_pa || localReg.kode_pa;
        localReg.kode_pi = fetched.kode_pi || localReg.kode_pi;
        updatedCount++;
      } else {
        // Optionally insert if not found in local seed (failsafe)
        db.registrations.push(fetched);
        updatedCount++;
      }

      // Also update password if provided
      if (fetched.password) {
        const account = db.accounts.find(
          (acc) => acc.nama_akun.trim().toLowerCase() === fetched.nama_sekolah.trim().toLowerCase()
        );
        if (account) {
          account.password = fetched.password;
        }
      }
    });

    saveDatabase();
    res.json({
      success: true,
      message: `Berhasil menarik data! ${updatedCount} data pendaftaran pangkalan telah disinkronkan kembali ke server.`,
    });
  } catch (err: any) {
    console.error("Error pulling from spreadsheet:", err);
    res.status(500).json({ success: false, message: `Gagal menghubungi server Spreadsheet: ${err.message}` });
  }
});

// Start server and handle Vite middleware
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
