/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import {
  School,
  Lock,
  LogOut,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  Tent,
  FileSpreadsheet,
  Search,
  ArrowLeft,
  Key,
  Shield,
  FileText,
  UserCheck,
  Info,
  Download,
  Pencil,
  Trash2
} from "lucide-react";
import { Registration, AdminDashboardData } from "./types";
import seedData from "./seed.json";

export default function App() {
  const [pangkalanList, setPangkalanList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPangkalan, setSelectedPangkalan] = useState("");
  const [password, setPassword] = useState("");
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"peserta" | "admin" | null>(null);
  
  // Registration state
  const [regData, setRegData] = useState<Registration | null>(null);
  
  // Form fields
  const [namaKamabigus, setNamaKamabigus] = useState("");
  const [nipKamabigus, setNipKamabigus] = useState("");
  const [jmlPutra, setJmlPutra] = useState("Tidak ada");
  const [jmlPutri, setJmlPutri] = useState("Tidak ada");
  const [jmlTenda, setJmlTenda] = useState("");
  const [catatan, setCatatan] = useState("");
  
  // Admin dashboard state
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminLevelFilter, setAdminLevelFilter] = useState("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  
  // Google Spreadsheet states
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [sheetMsg, setSheetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [pullLoading, setPullLoading] = useState(false);
  
  // Modal & view states
  const [activeView, setActiveView] = useState<"login" | "form" | "bukti" | "admin">("login");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordModalMsg, setPasswordModalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Admin edit/delete states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [editNamaKamabigus, setEditNamaKamabigus] = useState("");
  const [editNipKamabigus, setEditNipKamabigus] = useState("");
  const [editJmlPutra, setEditJmlPutra] = useState("Tidak ada");
  const [editJmlPutri, setEditJmlPutri] = useState("Tidak ada");
  const [editJmlTenda, setEditJmlTenda] = useState("");
  const [editCatatan, setEditCatatan] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReg, setDeleteReg] = useState<Registration | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Static-mode state indicators
  const [isStaticMode, setIsStaticMode] = useState(false);

  const calculateAdminDashboardLocal = (registrations: Registration[]) => {
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

    registrations.forEach((r) => {
      const hasPa = r.jumlah_peserta_putra && r.jumlah_peserta_putra.trim() !== "" && r.jumlah_peserta_putra.trim().toLowerCase() !== "tidak ada";
      const hasPi = r.jumlah_peserta_putri && r.jumlah_peserta_putri.trim() !== "" && r.jumlah_peserta_putri.trim().toLowerCase() !== "tidak ada";
      
      const isRegistered = (r.jumlah_peserta_putra && r.jumlah_peserta_putra !== "") ||
                           (r.jumlah_peserta_putri && r.jumlah_peserta_putri !== "") ||
                           (r.jumlah_tenda && r.jumlah_tenda !== "");

      if (isRegistered) {
        totalRegistered++;

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
          sd_mi++;
          schoolLevel = "sd_mi";
        }

        if (hasPa) {
          const count = parseInt(r.jumlah_peserta_putra, 10);
          if (!isNaN(count)) totalPutra += count;
        }
        if (hasPi) {
          const count = parseInt(r.jumlah_peserta_putri, 10);
          if (!isNaN(count)) totalPutri += count;
        }

        const tendaStr = (r.jumlah_tenda || "").toLowerCase();
        let addedToPutra = false;
        let addedToPutri = false;

        if (tendaStr.includes("2 tenda") || tendaStr.includes("putra dan putri") || tendaStr.includes("pa dan pi")) {
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

        if (r.catatan && r.catatan.trim() !== "") {
          catatanList.push({
            sekolah: r.nama_sekolah,
            catatan: r.catatan,
          });
        }
      }
    });

    totalTenda = tendaPutra + tendaPutri;

    return {
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
      catatanList
    };
  };

  const loadStaticModeData = () => {
    let storedRegs = localStorage.getItem("registrations");
    let storedAccounts = localStorage.getItem("accounts");
    let storedConfig = localStorage.getItem("spreadsheetConfig");

    let regs: Registration[] = [];
    let accs: any[] = [];
    let config = { spreadsheetUrl: "", autoSync: false };

    if (storedRegs) {
      regs = JSON.parse(storedRegs);
    } else {
      regs = seedData.registrations;
      localStorage.setItem("registrations", JSON.stringify(regs));
    }

    if (storedAccounts) {
      accs = JSON.parse(storedAccounts);
    } else {
      accs = seedData.accounts;
      localStorage.setItem("accounts", JSON.stringify(accs));
    }

    if (storedConfig) {
      config = JSON.parse(storedConfig);
    }

    setPangkalanList(regs.map((r) => r.nama_sekolah));
    setSpreadsheetUrl(config.spreadsheetUrl || "");
    setAutoSync(!!config.autoSync);
  };

  // Fetch pangkalan list on load
  useEffect(() => {
    fetchPangkalanList();
  }, []);

  const fetchPangkalanList = async () => {
    try {
      const res = await fetch("/api/pangkalan-list");
      if (res.ok) {
        const list = await res.json();
        setPangkalanList(list);
        setIsStaticMode(false);
      } else {
        throw new Error("HTTP error");
      }
    } catch (err) {
      console.log("Menggunakan mode static (GitHub Pages)...");
      setIsStaticMode(true);
      loadStaticModeData();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPangkalan) {
      setLoginError("Silakan pilih pangkalan terlebih dahulu.");
      return;
    }
    if (selectedPangkalan === "admin" && !password) {
      setLoginError("Silakan masukkan kata sandi.");
      return;
    }

    setLoading(true);
    setLoginError(null);

    if (isStaticMode) {
      try {
        let matched = false;
        let role: "peserta" | "admin" = "peserta";
        let regDataMatched: Registration | null = null;

        if (selectedPangkalan === "admin") {
          role = "admin";
          const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
          const adminAccount = accounts.find((acc: any) => acc.nama_akun === "admin");
          const adminPassword = adminAccount ? adminAccount.password : "admin123";
          if (password === adminPassword) {
            matched = true;
          }
        } else {
          role = "peserta";
          const regs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
          const matchedReg = regs.find((r) => r.nama_sekolah === selectedPangkalan);
          matched = true;
          regDataMatched = matchedReg || null;
        }

        if (matched) {
          setCurrentUser(selectedPangkalan);
          setCurrentRole(role);

          if (role === "admin") {
            setActiveView("admin");
            const regs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
            setAdminData(calculateAdminDashboardLocal(regs));
          } else {
            setActiveView("form");
            if (regDataMatched) {
              setRegData(regDataMatched);
              setNamaKamabigus(regDataMatched.nama_kamabigus !== "-" ? regDataMatched.nama_kamabigus : "");
              setNipKamabigus(regDataMatched.nip_kamabigus !== "-" ? regDataMatched.nip_kamabigus : "");
              setJmlPutra(regDataMatched.jumlah_peserta_putra || "Tidak ada");
              setJmlPutri(regDataMatched.jumlah_peserta_putri || "Tidak ada");
              setJmlTenda(regDataMatched.jumlah_tenda || "");
              setCatatan(regDataMatched.catatan || "");
            } else {
              setRegData(null);
              resetForm();
            }
          }
        } else {
          setLoginError("Kata sandi salah atau pangkalan tidak ditemukan.");
        }
      } catch (err) {
        setLoginError("Gagal masuk. Silakan coba kembali.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedPangkalan, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCurrentUser(selectedPangkalan);
        setCurrentRole(data.role);

        if (data.role === "admin") {
          setActiveView("admin");
          fetchAdminDashboard();
        } else {
          setActiveView("form");
          if (data.data) {
            const r: Registration = data.data;
            setRegData(r);
            setNamaKamabigus(r.nama_kamabigus !== "-" ? r.nama_kamabigus : "");
            setNipKamabigus(r.nip_kamabigus !== "-" ? r.nip_kamabigus : "");
            setJmlPutra(r.jumlah_peserta_putra || "Tidak ada");
            setJmlPutri(r.jumlah_peserta_putri || "Tidak ada");
            setJmlTenda(r.jumlah_tenda || "");
            setCatatan(r.catatan || "");
          } else {
            setRegData(null);
            resetForm();
          }
        }
      } else {
        setLoginError(data.message || "Gagal masuk. Silakan periksa kembali.");
      }
    } catch (err) {
      setLoginError("Koneksi gagal. Silakan coba beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNamaKamabigus("");
    setNipKamabigus("");
    setJmlPutra("Tidak ada");
    setJmlPutri("Tidak ada");
    setJmlTenda("");
    setCatatan("");
    setFormSuccess(false);
  };

  const pushToSpreadsheetDirectly = async (reg: Registration) => {
    if (!spreadsheetUrl) return;
    try {
      const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
      const account = accounts.find((acc: any) => acc.nama_akun.trim().toLowerCase() === reg.nama_sekolah.trim().toLowerCase());
      const payload = {
        ...reg,
        password: account ? account.password : ""
      };
      await fetch(spreadsheetUrl, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Gagal menyinkronkan data langsung ke Google Sheets:", e);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!jmlTenda) {
      setFormError("Silakan pilih jumlah tenda.");
      return;
    }

    setLoading(true);
    setFormError(null);

    if (isStaticMode) {
      try {
        const regs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
        const r = regs.find((reg) => reg.nama_sekolah === currentUser);
        
        const generatedPa = r?.kode_pa || String(Math.floor(10000 + Math.random() * 90000));
        const generatedPi = r?.kode_pi || String(Math.floor(10000 + Math.random() * 90000));

        const updatedReg: Registration = {
          id: r?.id || "PKL" + String(Math.floor(100 + Math.random() * 900)),
          nama_sekolah: currentUser,
          nama_kamabigus: namaKamabigus || "-",
          nip_kamabigus: nipKamabigus || "-",
          jumlah_peserta_putra: jmlPutra,
          jumlah_peserta_putri: jmlPutri,
          jumlah_tenda: jmlTenda,
          catatan,
          kode_pa: generatedPa,
          kode_pi: generatedPi,
        };

        const updatedRegs = regs.map((reg) => reg.nama_sekolah === currentUser ? updatedReg : reg);
        localStorage.setItem("registrations", JSON.stringify(updatedRegs));
        setRegData(updatedReg);
        setFormSuccess(true);
        setActiveView("bukti");

        if (autoSync && spreadsheetUrl) {
          await pushToSpreadsheetDirectly(updatedReg);
        }
      } catch (err) {
        setFormError("Gagal menyimpan pendaftaran secara lokal.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/submit-pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sekolah: currentUser,
          namaKamabigus: namaKamabigus || "-",
          nipKamabigus: nipKamabigus || "-",
          jmlPutra,
          jmlPutri,
          jmlTenda,
          catatan,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        const updatedReg: Registration = {
          id: regData?.id || "PKL-TEMP",
          nama_sekolah: currentUser,
          nama_kamabigus: namaKamabigus || "-",
          nip_kamabigus: nipKamabigus || "-",
          jumlah_peserta_putra: jmlPutra,
          jumlah_peserta_putri: jmlPutri,
          jumlah_tenda: jmlTenda,
          catatan,
          kode_pa: data.kodePa,
          kode_pi: data.kodePi,
        };
        setRegData(updatedReg);
        setFormSuccess(true);
        setActiveView("bukti");
      } else {
        setFormError(data.message || "Gagal menyimpan pendaftaran.");
      }
    } catch (err) {
      setFormError("Gagal menyimpan data ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!oldPassword || !newPassword) {
      setPasswordModalMsg({ type: "error", text: "Semua bidang harus diisi." });
      return;
    }

    setLoading(true);
    setPasswordModalMsg(null);

    if (isStaticMode) {
      try {
        const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
        const accountIndex = accounts.findIndex((acc: any) => acc.nama_akun.trim().toLowerCase() === currentUser.trim().toLowerCase());
        
        const currentPass = accountIndex !== -1 ? accounts[accountIndex].password : (currentUser === "admin" ? "admin123" : "sandi123");

        if (oldPassword !== currentPass) {
          setPasswordModalMsg({ type: "error", text: "Sandi lama salah." });
          setLoading(false);
          return;
        }

        if (accountIndex !== -1) {
          accounts[accountIndex].password = newPassword;
        } else {
          accounts.push({ nama_akun: currentUser, password: newPassword });
        }

        localStorage.setItem("accounts", JSON.stringify(accounts));
        setPasswordModalMsg({ type: "success", text: "Sandi berhasil diubah!" });
        setOldPassword("");
        setNewPassword("");

        if (currentUser !== "admin" && autoSync && spreadsheetUrl) {
          const regs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
          const r = regs.find((reg) => reg.nama_sekolah === currentUser);
          if (r) {
            await pushToSpreadsheetDirectly(r);
          }
        }

        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setPasswordModalMsg(null);
        }, 1500);
      } catch (err) {
        setPasswordModalMsg({ type: "error", text: "Gagal mengubah sandi." });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser,
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPasswordModalMsg({ type: "success", text: "Sandi berhasil diubah!" });
        setOldPassword("");
        setNewPassword("");
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setPasswordModalMsg(null);
        }, 1500);
      } else {
        setPasswordModalMsg({ type: "error", text: data.message || "Gagal mengubah sandi." });
      }
    } catch (err) {
      setPasswordModalMsg({ type: "error", text: "Gagal terhubung ke server." });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminDashboard = async () => {
    setLoading(true);
    if (isStaticMode) {
      try {
        const regs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
        setAdminData(calculateAdminDashboardLocal(regs));
        
        const config = JSON.parse(localStorage.getItem("spreadsheetConfig") || "{}");
        setSpreadsheetUrl(config.spreadsheetUrl || "");
        setAutoSync(!!config.autoSync);
      } catch (err) {
        console.error("Gagal memuat dashboard lokal:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/admin-dashboard");
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
      }
      
      const configRes = await fetch("/api/spreadsheet-config");
      if (configRes.ok) {
        const configData = await configRes.json();
        setSpreadsheetUrl(configData.spreadsheetUrl || "");
        setAutoSync(!!configData.autoSync);
      }
    } catch (err) {
      console.error("Gagal memuat data admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSpreadsheetConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSheetMsg(null);

    if (isStaticMode) {
      try {
        localStorage.setItem("spreadsheetConfig", JSON.stringify({ spreadsheetUrl, autoSync }));
        setSheetMsg({ type: "success", text: "Pengaturan integrasi berhasil disimpan secara lokal." });
      } catch (err) {
        setSheetMsg({ type: "error", text: "Gagal menyimpan pengaturan lokal." });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/spreadsheet-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetUrl, autoSync }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSheetMsg({ type: "success", text: data.message });
      } else {
        setSheetMsg({ type: "error", text: data.message || "Gagal menyimpan pengaturan." });
      }
    } catch (err) {
      setSheetMsg({ type: "error", text: "Gagal menyimpan pengaturan ke server." });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllToSpreadsheet = async () => {
    if (!spreadsheetUrl) {
      setSheetMsg({ type: "error", text: "Silakan masukkan URL Google Sheets terlebih dahulu." });
      return;
    }
    setSyncAllLoading(true);
    setSheetMsg(null);

    if (isStaticMode) {
      try {
        const regs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
        let successCount = 0;
        for (const r of regs) {
          try {
            await pushToSpreadsheetDirectly(r);
            successCount++;
          } catch (err) {
            console.error(`Gagal sinkron pangkalan ${r.nama_sekolah}:`, err);
          }
        }
        setSheetMsg({
          type: "success",
          text: `Sinkronisasi selesai! ${successCount} data pangkalan berhasil disinkronkan langsung ke Google Spreadsheet.`,
        });
      } catch (err) {
        setSheetMsg({ type: "error", text: "Gagal melakukan sinkronisasi mandiri." });
      } finally {
        setSyncAllLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/sync-all-to-spreadsheet", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSheetMsg({ type: "success", text: data.message });
      } else {
        setSheetMsg({ type: "error", text: data.message || "Gagal melakukan sinkronisasi." });
      }
    } catch (err) {
      setSheetMsg({ type: "error", text: "Gagal terhubung ke server untuk sinkronisasi." });
    } finally {
      setSyncAllLoading(false);
    }
  };

  const handlePullFromSpreadsheet = async () => {
    if (!spreadsheetUrl) {
      setSheetMsg({ type: "error", text: "Silakan masukkan URL Google Sheets terlebih dahulu." });
      return;
    }
    setPullLoading(true);
    setSheetMsg(null);

    if (isStaticMode) {
      try {
        const response = await fetch(spreadsheetUrl, { method: "GET" });
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }
        const resData = await response.json();
        if (resData.status !== "success" || !Array.isArray(resData.registrations)) {
          throw new Error(resData.message || "Format data tidak valid.");
        }

        const fetchedRegs = resData.registrations;
        const localRegs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
        const localAccounts = JSON.parse(localStorage.getItem("accounts") || "[]");
        let updatedCount = 0;

        fetchedRegs.forEach((fetched: any) => {
          if (!fetched || !fetched.nama_sekolah) return;

          let localReg = localRegs.find(
            (r) => r.nama_sekolah.trim().toLowerCase() === fetched.nama_sekolah.trim().toLowerCase()
          );

          if (localReg) {
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
            localRegs.push(fetched);
            updatedCount++;
          }

          if (fetched.password) {
            const accIndex = localAccounts.findIndex(
              (acc: any) => acc.nama_akun.trim().toLowerCase() === fetched.nama_sekolah.trim().toLowerCase()
            );
            if (accIndex !== -1) {
              localAccounts[accIndex].password = fetched.password;
            } else {
              localAccounts.push({ nama_akun: fetched.nama_sekolah, password: fetched.password });
            }
          }
        });

        localStorage.setItem("registrations", JSON.stringify(localRegs));
        localStorage.setItem("accounts", JSON.stringify(localAccounts));

        setSheetMsg({
          type: "success",
          text: `Berhasil menarik data langsung! ${updatedCount} data pangkalan telah disinkronkan ke penyimpanan lokal browser Anda.`,
        });

        // Refresh lists and state
        setPangkalanList(localRegs.map((r) => r.nama_sekolah));
        setAdminData(calculateAdminDashboardLocal(localRegs));
      } catch (err: any) {
        console.error("Error pulling from spreadsheet directly:", err);
        setSheetMsg({ type: "error", text: `Gagal menarik data langsung dari Google Sheets: ${err.message}` });
      } finally {
        setPullLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/pull-from-spreadsheet", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSheetMsg({ type: "success", text: data.message });
        await fetchAdminDashboard();
      } else {
        setSheetMsg({ type: "error", text: data.message || "Gagal menarik data dari spreadsheet." });
      }
    } catch (err) {
      setSheetMsg({ type: "error", text: "Gagal terhubung ke server untuk menarik data." });
    } finally {
      setPullLoading(false);
    }
  };

  const handleOpenEdit = (r: Registration) => {
    setEditReg(r);
    setEditNamaKamabigus(r.nama_kamabigus && r.nama_kamabigus !== "-" ? r.nama_kamabigus : "");
    setEditNipKamabigus(r.nip_kamabigus && r.nip_kamabigus !== "-" ? r.nip_kamabigus : "");
    setEditJmlPutra(r.jumlah_peserta_putra || "Tidak ada");
    setEditJmlPutri(r.jumlah_peserta_putri || "Tidak ada");
    setEditJmlTenda(r.jumlah_tenda || "");
    setEditCatatan(r.catatan || "");
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReg) return;
    if (!editJmlTenda) {
      setEditError("Silakan pilih jumlah tenda.");
      return;
    }
    setLoading(true);
    setEditError(null);

    if (isStaticMode) {
      try {
        const regs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
        const updatedRegs = regs.map((reg) => {
          if (reg.id === editReg.id) {
            const updated = {
              ...reg,
              nama_kamabigus: editNamaKamabigus || "-",
              nip_kamabigus: editNipKamabigus || "-",
              jumlah_peserta_putra: editJmlPutra,
              jumlah_peserta_putri: editJmlPutri,
              jumlah_tenda: editJmlTenda,
              catatan: editCatatan,
            };
            if (autoSync && spreadsheetUrl) {
              pushToSpreadsheetDirectly(updated);
            }
            return updated;
          }
          return reg;
        });
        localStorage.setItem("registrations", JSON.stringify(updatedRegs));
        setIsEditModalOpen(false);
        setEditReg(null);
        setAdminData(calculateAdminDashboardLocal(updatedRegs));
      } catch (err) {
        setEditError("Gagal menyimpan perubahan lokal.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/admin/edit-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editReg.id,
          nama_kamabigus: editNamaKamabigus || "-",
          nip_kamabigus: editNipKamabigus || "-",
          jumlah_peserta_putra: editJmlPutra,
          jumlah_peserta_putri: editJmlPutri,
          jumlah_tenda: editJmlTenda,
          catatan: editCatatan,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditModalOpen(false);
        setEditReg(null);
        fetchAdminDashboard();
      } else {
        setEditError(data.message || "Gagal menyimpan perubahan.");
      }
    } catch (err) {
      setEditError("Koneksi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (r: Registration) => {
    setDeleteReg(r);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteReg) return;
    setLoading(true);
    setDeleteError(null);

    if (isStaticMode) {
      try {
        const regs: Registration[] = JSON.parse(localStorage.getItem("registrations") || "[]");
        const updatedRegs = regs.map((reg) => {
          if (reg.id === deleteReg.id) {
            const updated = {
              ...reg,
              nama_kamabigus: "-",
              nip_kamabigus: "-",
              jumlah_peserta_putra: "",
              jumlah_peserta_putri: "",
              jumlah_tenda: "",
              catatan: "",
            };
            if (autoSync && spreadsheetUrl) {
              pushToSpreadsheetDirectly(updated);
            }
            return updated;
          }
          return reg;
        });
        localStorage.setItem("registrations", JSON.stringify(updatedRegs));
        setIsDeleteModalOpen(false);
        setDeleteReg(null);
        setAdminData(calculateAdminDashboardLocal(updatedRegs));
      } catch (err) {
        setDeleteError("Gagal menghapus pendaftaran lokal.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/admin/delete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteReg.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsDeleteModalOpen(false);
        setDeleteReg(null);
        fetchAdminDashboard();
      } else {
        setDeleteError(data.message || "Gagal menghapus isian.");
      }
    } catch (err) {
      setDeleteError("Koneksi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    setRegData(null);
    setPassword("");
    setSelectedPangkalan("");
    setSearchQuery("");
    resetForm();
    setLoginError(null);
    setActiveView("login");
  };

  // Helper to format date in Indonesian
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    return new Date().toLocaleDateString("id-ID", options);
  };

  // Helper to load image as base64
  const getBase64FromUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Gagal memuat gambar untuk PDF:", url, err);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    if (!regData) return;
    setDownloadingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const qrData = `Pangkalan: ${regData.nama_sekolah}\nKamabigus: ${regData.nama_kamabigus}\nPA: ${regData.jumlah_peserta_putra} | PI: ${regData.jumlah_peserta_putri}\nTenda: ${regData.jumlah_tenda}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;
      const logoUrl = "https://i.wpfc.ml/jy/yzuwxu.png";

      // Safely load images as Base64
      const [logoBase64, qrBase64] = await Promise.all([
        getBase64FromUrl(logoUrl),
        getBase64FromUrl(qrUrl),
      ]);

      // PDF layout coordinates
      let y = 15;

      // 1. Top color bar (Indigo)
      doc.setFillColor(79, 70, 229); // #4f46e5
      doc.rect(0, 0, 210, 6, "F");

      y += 8;

      // 2. Logo & Headers
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 20, y, 22, 22);
      }
      
      doc.setTextColor(30, 41, 59); // dark slate (#1e293b)
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("BUKTI PENDAFTARAN", 115, y + 5, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("Helvetica", "normal");
      doc.text("Perkemahan Hari Pramuka Ke-65", 115, y + 11, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("Kwarran Bulukumpa", 115, y + 17, { align: "center" });

      y += 26;

      // Divider line
      doc.setDrawColor(15, 23, 42); // very dark slate
      doc.setLineWidth(1);
      doc.line(20, y, 190, y);

      y += 10;

      // 3. Metadata Table helper
      const drawTableRow = (label: string, value: string, isAccent: boolean = false) => {
        if (isAccent) {
          doc.setFillColor(248, 250, 252); // light background row
          doc.rect(20, y - 5, 170, 8, "F");
        }
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(100, 116, 139); // gray label
        doc.setFontSize(10);
        doc.text(label, 24, y);

        doc.setFont("Helvetica", "normal");
        doc.text(":", 70, y);

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42); // dark text
        doc.text(value, 75, y);
        y += 8;
      };

      drawTableRow("Pangkalan Sekolah", regData.nama_sekolah.toUpperCase(), true);
      drawTableRow("Nama Kamabigus", regData.nama_kamabigus);
      
      if (regData.nip_kamabigus && regData.nip_kamabigus !== "-") {
        drawTableRow("NIP Kamabigus", regData.nip_kamabigus, true);
      }

      drawTableRow(
        "Jumlah Peserta Kemah",
        `Putra: ${regData.jumlah_peserta_putra}  |  Putri: ${regData.jumlah_peserta_putri}`
      );
      drawTableRow("Kebutuhan Tenda", regData.jumlah_tenda, true);

      y += 4;

      // 4. Code Highlight Boxes (PA & PI Codes)
      // Box PA (Putra)
      doc.setFillColor(238, 242, 255); // light indigo (#eef2ff)
      doc.rect(20, y, 82, 18, "F");
      doc.setDrawColor(224, 231, 255); // border
      doc.rect(20, y, 82, 18, "S");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(49, 46, 129); // dark indigo
      doc.text("KODE LOGIN PUTRA (PA)", 24, y + 5);
      doc.setFontSize(12);
      doc.setFont("Courier", "bold");
      doc.text(regData.kode_pa || "Belum Dibuat", 24, y + 12);

      // Box PI (Putri)
      doc.setFillColor(253, 242, 248); // light pink (#fdf2f8)
      doc.rect(108, y, 82, 18, "F");
      doc.setDrawColor(251, 207, 232); // border
      doc.rect(108, y, 82, 18, "S");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(131, 24, 67); // dark pink
      doc.text("KODE LOGIN PUTRI (PI)", 112, y + 5);
      doc.setFontSize(12);
      doc.setFont("Courier", "bold");
      doc.text(regData.kode_pi || "Belum Dibuat", 112, y + 12);

      y += 24;

      // 5. Catatan Khusus
      if (regData.catatan) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("Catatan Khusus :", 24, y);
        
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        // Word wrap catatan
        const splitCatatan = doc.splitTextToSize(`"${regData.catatan}"`, 160);
        doc.text(splitCatatan, 24, y + 5);
        y += (splitCatatan.length * 4.5) + 4;
      }

      y = Math.max(y, 195); // Ensure bottom section starts low enough

      // 6. Verification Barcode & Signature
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("VERIFIKASI BARCODE PANITIA", 24, y);

      if (qrBase64) {
        doc.addImage(qrBase64, "PNG", 24, y + 4, 25, 25);
      } else {
        doc.rect(24, y + 4, 25, 25, "S");
        doc.setFontSize(7);
        doc.text("[QR Code]", 29, y + 16);
      }

      // Signature right
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Bulukumba, ${getFormattedDate()}`, 145, y + 4, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Kamabigus", 145, y + 9, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(regData.nama_kamabigus, 145, y + 27, { align: "center" });
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const nipValue = regData.nip_kamabigus && regData.nip_kamabigus !== "-" ? regData.nip_kamabigus : "-";
      doc.text(`NIP. ${nipValue}`, 145, y + 31, { align: "center" });

      // Save PDF
      doc.save(`Bukti_Pendaftaran_${regData.nama_sekolah.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      alert("Terjadi kesalahan saat mengunduh PDF. Silakan coba lagi.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Export to CSV helper
  const exportToCSV = () => {
    if (!adminData || !adminData.allRegistrations) return;

    const headers = [
      "ID",
      "Pangkalan",
      "Nama Kamabigus",
      "NIP Kamabigus",
      "Jml Peserta Putra",
      "Jml Peserta Putri",
      "Jumlah Tenda",
      "Catatan",
      "Kode Login Putra",
      "Kode Login Putri"
    ];

    const rows = adminData.allRegistrations.map((r) => [
      r.id || "",
      r.nama_sekolah || "",
      r.nama_kamabigus || "",
      r.nip_kamabigus || "",
      r.jumlah_peserta_putra || "",
      r.jumlah_peserta_putri || "",
      r.jumlah_tenda || "",
      r.catatan || "",
      r.kode_pa || "",
      r.kode_pi || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((val) => {
            const strVal = String(val);
            return `"${strVal.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Rekap_Pendaftaran_Hari_Pramuka_Ke_65.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Search filter for pangkalan selection
  const filteredSchools = pangkalanList.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen font-sans flex flex-col relative text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* SCOUT AMBIENT BACKGROUND */}
      <div className="absolute inset-0 bg-slate-50 -z-20"></div>
      <div className="absolute inset-0 bg-pramuka-pattern -z-10 no-print"></div>

      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 shadow-sm py-4 px-6 relative z-10 no-print">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full justify-center md:justify-start">
            <div className="p-1.5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
              <img
                src="https://i.wpfc.ml/jy/yzuwxu.png"
                alt="Logo Pramuka"
                onError={(e) => {
                  // Fallback logo in case external URL is down
                  e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/2/22/WOSM_Logo.svg";
                }}
                className="h-14 w-auto object-contain filter drop-shadow-sm"
              />
            </div>
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-indigo-100 mb-1 uppercase tracking-wider">
                Kwarran Bulukumpa
              </span>
              <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight leading-tight">
                Pendaftaran Perkemahan Hari Pramuka Ke-65
              </h1>
            </div>
          </div>

          {/* LOGGED IN USER SECTION */}
          {currentUser && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-center">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-700 text-sm font-semibold tracking-wide truncate max-w-[200px]">
                  {currentUser === "admin" ? "Admin Panitia" : currentUser}
                </span>
              </div>
              <div className="flex gap-2">
                {currentUser === "admin" && (
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 py-2 px-3.5 rounded-xl border border-slate-200 transition-all duration-200 shadow-sm cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Sandi
                  </button>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 px-3.5 rounded-xl border border-rose-100 transition-all duration-200 shadow-sm cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN SCREEN ROUTER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center items-center">
        
        {/* VIEW 1: LOGIN AREA */}
        {activeView === "login" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl p-6 md:p-10 relative"
          >
            {/* Design accents */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-t-3xl"></div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Masuk Aplikasi</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Pilih Pangkalan Sekolah Anda, lalu klik tombol "Masuk"
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm flex items-start gap-2.5 font-medium"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{loginError}</span>
                </motion.div>
              )}

              {/* SEARCHABLE DROPDOWN SELECT */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nama Pangkalan / Sekolah
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-slate-50 hover:bg-slate-100/80 text-left text-slate-800 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 flex justify-between items-center cursor-pointer"
                  >
                    <span className="truncate font-semibold text-slate-700">
                      {selectedPangkalan || "-- Pilih Pangkalan --"}
                    </span>
                    <School className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                    >
                      {/* Dropdown Searchbar */}
                      <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari pangkalan..."
                          className="w-full bg-transparent text-slate-800 placeholder-slate-400 outline-none text-sm py-1.5 font-medium"
                          autoFocus
                        />
                      </div>

                      {/* Dropdown Options List */}
                      <div style={{ maxHeight: "350px", overflowY: "auto" }} className="divide-y divide-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPangkalan("admin");
                            setIsDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className={`w-full text-left text-sm py-2.5 px-4 font-bold text-indigo-600 hover:bg-indigo-50 transition ${
                            selectedPangkalan === "admin" ? "bg-indigo-50/55" : ""
                          }`}
                        >
                          Login sebagai Admin Panitia
                        </button>
                        
                        {filteredSchools.map((school) => (
                          <button
                            key={school}
                            type="button"
                            onClick={() => {
                              setSelectedPangkalan(school);
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full text-left text-sm py-2.5 px-4 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-950 transition ${
                              selectedPangkalan === school ? "bg-indigo-50 text-indigo-700" : ""
                            }`}
                          >
                            {school}
                          </button>
                        ))}
                        {filteredSchools.length === 0 && searchQuery !== "" && (
                          <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            Tidak ada pangkalan yang cocok.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* PASSWORD FIELD (ONLY FOR ADMIN) */}
              {selectedPangkalan === "admin" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Kata Sandi Admin
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none font-medium"
                      placeholder="Masukkan kata sandi admin"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-4.5" />
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 shadow-md shadow-indigo-100 mt-4 cursor-pointer flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* VIEW 2: FORM PENDAFTARAN PESERTA */}
        {activeView === "form" && currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl bg-white border border-slate-200 shadow-xl rounded-3xl p-6 md:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>

            <div className="border-b border-slate-100 pb-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  Formulir Registrasi
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  Pangkalan: <span className="text-indigo-600 font-bold">{currentUser}</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-150">
                <UserCheck className="w-3.5 h-3.5" />
                Registrasi Kwarran
              </span>
            </div>

            {/* Autofill Notification / Notice Data Ditemukan */}
            {regData && (regData.jumlah_peserta_putra || regData.jumlah_peserta_putri) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3.5 rounded-xl flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-emerald-900">Pangkalan Sudah Terdaftar</h3>
                  <p className="text-xs text-emerald-700 mt-1 font-medium leading-relaxed">
                    Pangkalan ini sudah pernah mendaftar. Data pendaftaran Anda dimuat secara otomatis di bawah ini. Anda dapat melakukan pengeditan kembali lalu menekan simpan.
                  </p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {formError && (
                <div className="bg-rose-50 border border-rose-150 text-rose-800 p-4 rounded-xl text-sm flex items-start gap-2.5 font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SECTION 1: KAMABIGUS INFO */}
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 font-mono">
                  <span>1.</span> Kepala Majelis Pembimbing Gugus Depan (Kamabigus)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Nama Kamabigus (Dengan Gelar)
                    </label>
                    <input
                      type="text"
                      required
                      value={namaKamabigus}
                      onChange={(e) => setNamaKamabigus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      placeholder="Budi Santoso, S.Pd., M.Pd."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      NIP Kamabigus
                    </label>
                    <input
                      type="text"
                      value={nipKamabigus}
                      onChange={(e) => setNipKamabigus(e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      placeholder="Kosongkan jika bukan ASN"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PARTICIPANTS */}
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
                  <span>2.</span> Jumlah Peserta Kemah
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Peserta Putra (PA)
                    </label>
                    <select
                      value={jmlPutra}
                      onChange={(e) => setJmlPutra(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="Tidak ada">Tidak ada</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((num) => (
                        <option key={`pa-${num}`} value={num}>
                          {num} Orang
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Peserta Putri (PI)
                    </label>
                    <select
                      value={jmlPutri}
                      onChange={(e) => setJmlPutri(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="Tidak ada">Tidak ada</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((num) => (
                        <option key={`pi-${num}`} value={num}>
                          {num} Orang
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: TENTS & NOTES */}
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
                  <span>3.</span> Penempatan Tenda & Catatan Tambahan
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Jumlah Tenda yang Didirikan
                    </label>
                    <select
                      required
                      value={jmlTenda}
                      onChange={(e) => setJmlTenda(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="">-- Pilih Jumlah Tenda --</option>
                      <option value="2 Tenda (Putra dan Putri)">2 Tenda (Putra dan Putri)</option>
                      <option value="1 Tenda di Kapling Putra">1 Tenda di Kapling Putra</option>
                      <option value="1 Tenda di Kapling Putri">1 Tenda di Kapling Putri</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Catatan ke Panitia (Opsional)
                    </label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
                      placeholder="Sampaikan catatan/pesan khusus Anda ke Panitia (misalnya lokasi kapling, dll.)"
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 px-6 rounded-2xl transition shadow-lg shadow-indigo-100 hover:shadow-indigo-200 mt-4 cursor-pointer flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Menyimpan Data...
                  </>
                ) : (
                  "Simpan & Unduh Bukti Pendaftaran"
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* VIEW 3: BUKTI PENDAFTARAN (RECEIPT / CERTIFICATE) */}
        {activeView === "bukti" && regData && (
          <div className="w-full flex flex-col items-center gap-6">
            
            {/* SUCCESS BANNER ALERT (NO PRINT) */}
            <div className="w-full max-w-[800px] bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl no-print flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900">Pendaftaran Berhasil Disimpan!</h3>
                  <p className="text-xs text-emerald-700 mt-0.5 font-medium">Silahkan unduh bukti pendaftaran Anda di bawah ini, dan kumpulkan ke Panitia saat Registrasi Perkemahan.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView("form")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Form
                </button>
              </div>
            </div>

            {/* TICKET CARD AREA */}
            <div
              id="printArea"
              className="print-container w-full max-w-[800px] bg-white text-slate-900 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 relative flex flex-col items-center gap-6 overflow-hidden"
            >
              {/* Border accents */}
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

              {/* TICKET HEADER */}
              <div className="w-full flex justify-between items-center border-b-4 border-slate-800 pb-6 mb-2">
                <div className="w-1/6 flex justify-center">
                  <img
                    src="https://i.wpfc.ml/jy/yzuwxu.png"
                    alt="Logo Pramuka"
                    onError={(e) => {
                      e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/2/22/WOSM_Logo.svg";
                    }}
                    className="w-20 h-auto filter"
                  />
                </div>
                <div className="w-4/6 text-center">
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-wider uppercase font-display">
                    Bukti Pendaftaran
                  </h2>
                  <h3 className="text-md md:text-lg font-bold text-slate-700 mt-1 uppercase">
                    Perkemahan Hari Pramuka Ke-65
                  </h3>
                  <h3 className="text-md md:text-lg font-black text-indigo-700 mt-0.5 tracking-wider py-0.5 bg-indigo-50 rounded-xl px-4 border border-indigo-100 inline-block">
                    Kwarran Bulukumpa
                  </h3>
                </div>
                <div className="w-1/6"></div>
              </div>

              {/* RECEIPT FIELDS */}
              <div className="w-full">
                <table className="w-full text-left border-collapse text-sm md:text-base">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-3.5 px-4 font-semibold text-slate-500 w-1/3">Pangkalan Sekolah</td>
                      <td className="py-3.5 px-2 font-bold text-slate-800 text-center w-5">:</td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-md md:text-lg uppercase font-display">
                        {regData.nama_sekolah}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-500">Nama Kamabigus</td>
                      <td className="py-3.5 px-2 font-bold text-slate-800 text-center w-5">:</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {regData.nama_kamabigus}
                      </td>
                    </tr>
                    {regData.nip_kamabigus && regData.nip_kamabigus !== "-" && (
                      <tr className="border-b border-slate-100">
                        <td className="py-3.5 px-4 font-semibold text-slate-500">NIP Kamabigus</td>
                        <td className="py-3.5 px-2 font-bold text-slate-800 text-center w-5">:</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 font-mono">
                          {regData.nip_kamabigus}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-500">Jumlah Peserta Kemah</td>
                      <td className="py-3.5 px-2 font-bold text-slate-800 text-center w-5">:</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        Putra: <span className="text-indigo-600 font-extrabold">{regData.jumlah_peserta_putra}</span> &nbsp;|&nbsp; 
                        Putri: <span className="text-pink-600 font-extrabold">{regData.jumlah_peserta_putri}</span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3.5 px-4 font-semibold text-slate-500">Kebutuhan Tenda</td>
                      <td className="py-3.5 px-2 font-bold text-slate-800 text-center w-5">:</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {regData.jumlah_tenda}
                      </td>
                    </tr>
                    
                    {/* KEY LOGIN CODES */}
                    <tr className="border-b border-indigo-100 border-dashed bg-indigo-50/50">
                      <td className="py-3.5 px-4 font-bold text-indigo-950">Kode Login Putra (PA)</td>
                      <td className="py-3.5 px-2 font-bold text-indigo-950 text-center w-5">:</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 text-lg tracking-wider">
                        {regData.kode_pa || "Belum Dibuat"}
                      </td>
                    </tr>
                    <tr className="border-b border-pink-100 border-dashed bg-pink-50/50">
                      <td className="py-3.5 px-4 font-bold text-pink-950">Kode Login Putri (PI)</td>
                      <td className="py-3.5 px-2 font-bold text-pink-950 text-center w-5">:</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-pink-700 text-lg tracking-wider">
                        {regData.kode_pi || "Belum Dibuat"}
                      </td>
                    </tr>

                    {regData.catatan && (
                      <tr className="border-b border-slate-100">
                        <td className="py-3.5 px-4 font-semibold text-slate-500">Catatan Khusus</td>
                        <td className="py-3.5 px-2 font-bold text-slate-800 text-center w-5">:</td>
                        <td className="py-3.5 px-4 text-xs italic text-slate-700 font-medium leading-relaxed">
                          "{regData.catatan}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* BARCODE & SIGNATURE block */}
              <div className="w-full flex flex-col sm:flex-row justify-between items-center sm:items-end mt-8 gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">
                    Verifikasi Barcode Panitia
                  </span>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        `Pangkalan: ${regData.nama_sekolah}\nKamabigus: ${regData.nama_kamabigus}\nPA: ${regData.jumlah_peserta_putra} | PI: ${regData.jumlah_peserta_putri}\nTenda: ${regData.jumlah_tenda}`
                      )}`}
                      alt="Verifikasi QR"
                      className="w-24 h-24"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col items-center text-center pb-2">
                  <p className="text-slate-600 text-sm font-medium">
                    Bulukumba, {getFormattedDate()}
                  </p>
                  <p className="text-slate-700 font-bold text-sm mt-1 mb-14">
                    Kamabigus
                  </p>
                  <p className="font-bold text-slate-900 underline underline-offset-4 tracking-wide font-display text-md">
                    {regData.nama_kamabigus}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    NIP. {regData.nip_kamabigus && regData.nip_kamabigus !== "-" ? regData.nip_kamabigus : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION PRINT BUTTONS */}
            <div className="w-full max-w-[800px] flex justify-center gap-4 no-print mt-4">
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3.5 px-8 rounded-full shadow-lg hover:shadow-xl transition flex items-center gap-2 text-md cursor-pointer"
              >
                {downloadingPdf ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Mengunduh PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Unduh PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {activeView === "admin" && currentUser === "admin" && (
          <div className="w-full space-y-8 animate-fade-in">
            
            {/* STATS HIGHLIGHT */}
            {adminData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Terdaftar</p>
                  <p className="text-3xl font-black text-indigo-600 mt-1 font-display">
                    {adminData.totalRegistered}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Sekolah / Gugus Depan</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tingkat SD/MI</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1 font-display">
                    {adminData.sd_mi}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Gugus Pratama/Siaga</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tingkat SMP/MTs</p>
                  <p className="text-3xl font-black text-amber-600 mt-1 font-display">
                    {adminData.smp_mts}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Gugus Penggalang</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tingkat SMA/SMK/MA</p>
                  <p className="text-3xl font-black text-violet-600 mt-1 font-display">
                    {adminData.sma_smk_ma}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Gugus Penegak</p>
                </div>
              </div>
            )}

            {/* DEMOGRAPHICS & TENTS DETAILS */}
            {adminData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                {/* Participant Demographic card */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 tracking-tight font-display">Statistik Peserta Terdaftar</h3>
                  </div>
                  <div className="flex justify-around items-center text-center h-24">
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Putra</p>
                      <p className="text-2xl font-bold text-indigo-600 mt-1 font-mono">{adminData.totalPutra}</p>
                    </div>
                    <div className="w-px h-12 bg-slate-100"></div>
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Putri</p>
                      <p className="text-2xl font-bold text-pink-500 mt-1 font-mono">{adminData.totalPutri}</p>
                    </div>
                    <div className="w-px h-12 bg-slate-100"></div>
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Peserta</p>
                      <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{adminData.totalPutra + adminData.totalPutri}</p>
                    </div>
                  </div>
                </div>

                {/* Tents statistics card */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <Tent className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-800 tracking-tight font-display">Kebutuhan Kapling Tenda</h3>
                  </div>
                  <div className="flex justify-around items-stretch text-center gap-2">
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Kapling PA</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-1 font-mono">{adminData.tendaPutra}</p>
                      </div>
                      {adminData.tendaPutraDetail && (
                        <div className="flex flex-col gap-1 mt-3 text-[10px] font-semibold">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 block">
                            ({adminData.tendaPutraDetail.sd_mi} SD/MI)
                          </span>
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 block">
                            ({adminData.tendaPutraDetail.smp_mts} SMP/MTs)
                          </span>
                          <span className="text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 block">
                            ({adminData.tendaPutraDetail.sma_smk_ma} SMA/MA/SMK)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="w-px bg-slate-100 self-stretch my-2"></div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Kapling PI</p>
                        <p className="text-2xl font-bold text-pink-500 mt-1 font-mono">{adminData.tendaPutri}</p>
                      </div>
                      {adminData.tendaPutriDetail && (
                        <div className="flex flex-col gap-1 mt-3 text-[10px] font-semibold">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 block">
                            ({adminData.tendaPutriDetail.sd_mi} SD/MI)
                          </span>
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 block">
                            ({adminData.tendaPutriDetail.smp_mts} SMP/MTs)
                          </span>
                          <span className="text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 block">
                            ({adminData.tendaPutriDetail.sma_smk_ma} SMA/MA/SMK)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="w-px bg-slate-100 self-stretch my-2"></div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Tenda</p>
                        <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{adminData.totalTenda}</p>
                      </div>
                      {adminData.tendaTotalDetail && (
                        <div className="flex flex-col gap-1 mt-3 text-[10px] font-semibold">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 block">
                            ({adminData.tendaTotalDetail.sd_mi} SD/MI)
                          </span>
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 block">
                            ({adminData.tendaTotalDetail.smp_mts} SMP/MTs)
                          </span>
                          <span className="text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 block">
                            ({adminData.tendaTotalDetail.sma_smk_ma} SMA/MA/SMK)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REGISTERED PANGKALAN LIST (MAIN ADMIN CONTROLLER) */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm no-print">
              <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg tracking-tight font-display">Rekap Data Pendaftaran</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Daftar lengkap seluruh pangkalan gugus depan Kwarran Bulukumpa</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                  {/* CSV Export */}
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition duration-150 shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Unduh Rekap Spreadsheet (CSV)
                  </button>

                  {/* Refresh Data */}
                  <button
                    onClick={fetchAdminDashboard}
                    className="flex items-center gap-2 text-xs bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                    Segarkan
                  </button>
                </div>
              </div>

              {/* FILTERS TOOLBAR */}
              <div className="bg-slate-50/30 p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Cari sekolah..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Level Filter */}
                <select
                  value={adminLevelFilter}
                  onChange={(e) => setAdminLevelFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="all">Semua Jenjang</option>
                  <option value="sd">Tingkat SD / MI</option>
                  <option value="smp">Tingkat SMP / MTs</option>
                  <option value="sma">Tingkat SMA / SMK / MA</option>
                </select>

                {/* Status Filter */}
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="registered">Sudah Terdaftar</option>
                  <option value="unregistered">Belum Terdaftar</option>
                </select>
              </div>

              {/* DETAILS TABLE */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-6 py-4 text-left">Nama Pangkalan</th>
                      <th className="px-6 py-4 text-center">Peserta PA</th>
                      <th className="px-6 py-4 text-center">Peserta PI</th>
                      <th className="px-6 py-4 text-left">Jumlah Tenda</th>
                      <th className="px-6 py-4 text-center">Kode PA</th>
                      <th className="px-6 py-4 text-center">Kode PI</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {adminData &&
                      adminData.allRegistrations &&
                      adminData.allRegistrations
                        .filter((r) => {
                          const matchSearch = r.nama_sekolah.toLowerCase().includes(adminSearch.toLowerCase());
                          
                          // Level categorization match
                          const name = r.nama_sekolah.toUpperCase();
                          let level = "sd";
                          if (name.includes("SMP") || name.includes("MTS")) level = "smp";
                          else if (name.includes("SMA") || name.includes("SMK") || name.includes("MA") || name.includes("MAN")) level = "sma";
                          const matchLevel = adminLevelFilter === "all" || adminLevelFilter === level;

                          // Status match
                          const hasReg = (r.jumlah_peserta_putra && r.jumlah_peserta_putra !== "Tidak ada" && r.jumlah_peserta_putra !== "") ||
                                         (r.jumlah_peserta_putri && r.jumlah_peserta_putri !== "Tidak ada" && r.jumlah_peserta_putri !== "");
                          const matchStatus = adminStatusFilter === "all" ||
                                              (adminStatusFilter === "registered" && hasReg) ||
                                              (adminStatusFilter === "unregistered" && !hasReg);

                          return matchSearch && matchLevel && matchStatus;
                        })
                        .map((r) => {
                          const hasReg = (r.jumlah_peserta_putra && r.jumlah_peserta_putra !== "Tidak ada" && r.jumlah_peserta_putra !== "") ||
                                         (r.jumlah_peserta_putri && r.jumlah_peserta_putri !== "Tidak ada" && r.jumlah_peserta_putri !== "");
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition duration-100">
                              <td className="px-6 py-4 font-bold text-slate-800 uppercase">{r.nama_sekolah}</td>
                              <td className="px-6 py-4 text-center font-bold">
                                {r.jumlah_peserta_putra && r.jumlah_peserta_putra !== "Tidak ada" && r.jumlah_peserta_putra !== "" ? (
                                  <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-mono text-xs">{r.jumlah_peserta_putra}</span>
                                ) : (
                                  <span className="text-slate-400 font-normal">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center font-bold">
                                {r.jumlah_peserta_putri && r.jumlah_peserta_putri !== "Tidak ada" && r.jumlah_peserta_putri !== "" ? (
                                  <span className="text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-100 font-mono text-xs">{r.jumlah_peserta_putri}</span>
                                ) : (
                                  <span className="text-slate-400 font-normal">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-700 font-semibold" title={r.jumlah_tenda}>
                                {r.jumlah_tenda || "-"}
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-indigo-700 bg-indigo-50/50">{r.kode_pa || "-"}</td>
                              <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-pink-700 bg-pink-50/50">{r.kode_pi || "-"}</td>
                              <td className="px-6 py-4 text-center">
                                {hasReg ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
                                    Daftar
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-slate-200">
                                    Belum
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => handleOpenEdit(r)}
                                    title="Edit Isian Sekolah"
                                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition cursor-pointer"
                                  >
                                    <Pencil className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDelete(r)}
                                    title="Hapus Isian Sekolah"
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PANGKALAN NOTES LIST */}
            {adminData && adminData.catatanList && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm no-print">
                <div className="bg-slate-50/50 p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 font-display">Catatan Khusus dari Pangkalan</h3>
                </div>
                {adminData.catatanList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic font-medium">
                    Belum ada catatan yang masuk dari pangkalan.
                  </div>
                ) : (
                  <div className="p-2 divide-y divide-slate-100">
                    {adminData.catatanList.map((item, idx) => (
                      <div key={`note-${idx}`} className="p-4 hover:bg-slate-50/50 transition rounded-xl">
                        <h4 className="text-indigo-600 font-bold uppercase text-xs font-mono">{item.sekolah}</h4>
                        <p className="text-slate-600 text-sm mt-1.5 leading-relaxed italic font-medium">"{item.catatan}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GOOGLE SPREADSHEET INTEGRATION PANEL */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm no-print space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg tracking-tight font-display">Integrasi Google Spreadsheet</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sinkronkan data pendaftaran secara real-time ke Google Spreadsheet Anda</p>
                </div>
              </div>

              {sheetMsg && (
                <div
                  className={`p-4 rounded-xl text-sm font-medium ${
                    sheetMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                      : "bg-rose-50 border border-rose-100 text-rose-800"
                  }`}
                >
                  {sheetMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveSpreadsheetConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                <div className="lg:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    URL Web App Google Apps Script
                  </label>
                  <input
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center h-12">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">Sinkronisasi Otomatis saat Daftar</span>
                  </label>
                </div>

                <div className="lg:col-span-3 flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition duration-150 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncAllToSpreadsheet}
                    disabled={syncAllLoading || !spreadsheetUrl}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition duration-150 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {syncAllLoading ? "Menyinkronkan..." : "Sinkronkan Semua Data Sekarang"}
                  </button>

                  <button
                    type="button"
                    onClick={handlePullFromSpreadsheet}
                    disabled={pullLoading || !spreadsheetUrl}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition duration-150 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {pullLoading ? "Menarik..." : "Tarik Data Dari Spreadsheet"}
                  </button>
                </div>
              </form>

              {/* COLLAPSIBLE / VIEWABLE APPS SCRIPT TUTORIAL */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-xs text-slate-600 space-y-3 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  <Info className="w-4 h-4 text-indigo-500" />
                  <span>Panduan Setup Google Spreadsheet (Sinkronisasi Dua Arah)</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Buat Google Spreadsheet baru.</li>
                  <li>Buka menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
                  <li>Hapus kode bawaan, lalu salin dan tempel seluruh kode berikut:</li>
                </ol>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto text-[10px] font-mono leading-normal max-h-60">
{`function doPost(e) {
  try {
    var json = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID", "Pangkalan", "Nama Kamabigus", "NIP Kamabigus", 
        "Jml Peserta Putra", "Jml Peserta Putri", "Jumlah Tenda", 
        "Catatan", "Kode Login Putra", "Kode Login Putri", "Kata Sandi", "Last Updated"
      ]);
    }
    
    var data = sheet.getDataRange().getValues();
    var foundIndex = -1;
    var sekolah = json.nama_sekolah || json.sekolah;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString().trim().toLowerCase() === sekolah.toString().trim().toLowerCase()) {
        foundIndex = i + 1;
        break;
      }
    }
    
    var rowData = [
      json.id || "",
      sekolah || "",
      json.nama_kamabigus || json.namaKamabigus || "-",
      json.nip_kamabigus || json.nipKamabigus || "-",
      json.jumlah_peserta_putra || json.jmlPutra || "Tidak ada",
      json.jumlah_peserta_putri || json.jmlPutri || "Tidak ada",
      json.jumlah_tenda || json.jmlTenda || "",
      json.catatan || "",
      json.kode_pa || json.kodePa || "",
      json.kode_pi || json.kodePi || "",
      json.password || "",
      new Date().toLocaleString("id-ID")
    ];
    
    if (foundIndex !== -1) {
      var range = sheet.getRange(foundIndex, 1, 1, rowData.length);
      range.setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", registrations: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var registrations = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      registrations.push({
        id: row[0] ? row[0].toString() : "",
        nama_sekolah: row[1] ? row[1].toString() : "",
        nama_kamabigus: row[2] ? row[2].toString() : "-",
        nip_kamabigus: row[3] ? row[3].toString() : "-",
        jumlah_peserta_putra: row[4] ? row[4].toString() : "Tidak ada",
        jumlah_peserta_putri: row[5] ? row[5].toString() : "Tidak ada",
        jumlah_tenda: row[6] ? row[6].toString() : "",
        catatan: row[7] ? row[7].toString() : "",
        kode_pa: row[8] ? row[8].toString() : "",
        kode_pi: row[9] ? row[9].toString() : "",
        password: row[10] ? row[10].toString() : ""
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", registrations: registrations }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                </pre>
                <ol className="list-decimal pl-4 space-y-1" start={4}>
                  <li>Klik tombol simpan (ikon disket), lalu klik <strong>Terapkan &gt; Penerapan Baru</strong>.</li>
                  <li>Pilih jenis pemicu: <strong>Aplikasi Web</strong>.</li>
                  <li>Setel kolom <em>Yang memiliki akses</em> menjadi <strong>Siapa saja</strong>.</li>
                  <li>Klik <strong>Terapkan</strong> dan berikan izin akses ke akun Google Anda jika diminta.</li>
                  <li>Salin <strong>URL Aplikasi Web</strong> yang dihasilkan dan tempelkan ke kolom input di atas.</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER SECTION */}
      <footer className="text-center py-6 border-t border-slate-200 bg-white text-xs text-slate-400 tracking-wider font-semibold no-print">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p>© 2026 Kwarran Bulukumpa — Perkemahan Hari Pramuka Ke-65</p>
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50/50 py-1 px-2.5 rounded-lg border border-indigo-100">
            <Shield className="w-3.5 h-3.5" />
            <span>Sistem Pendaftaran Digital Pramuka Aman</span>
          </div>
        </div>
      </footer>

      {/* MODAL WINDOW: CHANGE PASSWORD */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 shadow-xl rounded-2xl p-6 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 font-display">
                <Key className="w-5 h-5 text-indigo-600" />
                Ubah Sandi Akun
              </h3>

              {passwordModalMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs font-semibold text-center ${
                    passwordModalMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                      : "bg-rose-50 text-rose-700 border border-rose-150"
                  }`}
                >
                  {passwordModalMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Sandi Lama
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Sandi saat ini"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Sandi baru Anda"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition cursor-pointer text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-sm"
                  >
                    {loading ? "Memproses..." : "Simpan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL WINDOW: EDIT PENDAFTARAN (ADMIN) */}
      <AnimatePresence>
        {isEditModalOpen && editReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white border border-slate-200 shadow-xl rounded-3xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2 font-display">
                <Pencil className="w-5 h-5 text-indigo-600" />
                Edit Pendaftaran Sekolah
              </h3>
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-4 font-mono">
                {editReg.nama_sekolah}
              </p>

              {editError && (
                <div className="mb-4 bg-rose-50 border border-rose-150 text-rose-800 p-4 rounded-xl text-xs font-semibold">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Nama Kamabigus
                    </label>
                    <input
                      type="text"
                      required
                      value={editNamaKamabigus}
                      onChange={(e) => setEditNamaKamabigus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Budi Santoso, S.Pd., M.Pd."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      NIP Kamabigus
                    </label>
                    <input
                      type="text"
                      value={editNipKamabigus}
                      onChange={(e) => setEditNipKamabigus(e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Kosongkan jika bukan ASN"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Peserta Putra (PA)
                    </label>
                    <select
                      value={editJmlPutra}
                      onChange={(e) => setEditJmlPutra(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Tidak ada">Tidak ada</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((num) => (
                        <option key={`edit-pa-${num}`} value={num}>
                          {num} Orang
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Peserta Putri (PI)
                    </label>
                    <select
                      value={editJmlPutri}
                      onChange={(e) => setEditJmlPutri(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Tidak ada">Tidak ada</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((num) => (
                        <option key={`edit-pi-${num}`} value={num}>
                          {num} Orang
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jumlah Tenda yang Didirikan
                  </label>
                  <select
                    required
                    value={editJmlTenda}
                    onChange={(e) => setEditJmlTenda(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Pilih Jumlah Tenda --</option>
                    <option value="2 Tenda (Putra dan Putri)">2 Tenda (Putra dan Putri)</option>
                    <option value="1 Tenda di Kapling Putra">1 Tenda di Kapling Putra</option>
                    <option value="1 Tenda di Kapling Putri">1 Tenda di Kapling Putri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Catatan ke Panitia (Opsional)
                  </label>
                  <textarea
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-850 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    placeholder="Sampaikan catatan/pesan khusus Anda ke Panitia"
                  />
                </div>

                <div className="flex gap-3 mt-6 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition cursor-pointer text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-sm flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL WINDOW: DELETE/RESET PENDAFTARAN (ADMIN) */}
      <AnimatePresence>
        {isDeleteModalOpen && deleteReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 shadow-xl rounded-3xl p-6 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2 font-display">
                <Trash2 className="w-5 h-5 text-rose-600" />
                Hapus Isian Pendaftaran
              </h3>
              
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Apakah Anda yakin ingin menghapus/mereset isian pendaftaran untuk <strong className="text-slate-800 uppercase">{deleteReg.nama_sekolah}</strong>? 
                Status pendaftaran akan dikembalikan menjadi <strong className="text-slate-800">"Belum Terdaftar"</strong>.
              </p>

              {deleteError && (
                <div className="mb-4 bg-rose-50 border border-rose-150 text-rose-800 p-3 rounded-xl text-xs font-semibold">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition cursor-pointer text-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-sm flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Ya, Hapus Isian"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
