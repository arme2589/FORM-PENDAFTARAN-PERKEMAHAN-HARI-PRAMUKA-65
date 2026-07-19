/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Registration {
  id: string;
  nama_sekolah: string;
  nama_kamabigus: string;
  nip_kamabigus: string;
  jumlah_peserta_putra: string;
  jumlah_peserta_putri: string;
  jumlah_tenda: string;
  catatan: string;
  kode_pa: string;
  kode_pi: string;
}

export interface Account {
  nama_akun: string;
  password?: string;
}

export interface AdminDashboardData {
  totalRegistered: number;
  sd_mi: number;
  smp_mts: number;
  sma_smk_ma: number;
  totalPutra: number;
  totalPutri: number;
  tendaPutra: number;
  tendaPutri: number;
  totalTenda: number;
  tendaPutraDetail?: {
    sd_mi: number;
    smp_mts: number;
    sma_smk_ma: number;
  };
  tendaPutriDetail?: {
    sd_mi: number;
    smp_mts: number;
    sma_smk_ma: number;
  };
  tendaTotalDetail?: {
    sd_mi: number;
    smp_mts: number;
    sma_smk_ma: number;
  };
  catatanList: Array<{
    sekolah: string;
    catatan: string;
  }>;
  allRegistrations?: Registration[];
}
