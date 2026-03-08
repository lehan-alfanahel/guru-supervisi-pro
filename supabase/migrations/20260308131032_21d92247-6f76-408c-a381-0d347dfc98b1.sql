
ALTER TABLE public.supervisions
  ADD COLUMN IF NOT EXISTS mata_pelajaran text,
  ADD COLUMN IF NOT EXISTS kalender_pendidikan integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS program_tahunan integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS program_semester integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alur_tujuan_pembelajaran integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modul_ajar integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jadwal_tatap_muka integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agenda_mengajar integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daftar_nilai integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kktp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS absensi_siswa integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buku_pegangan_guru integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buku_teks_siswa integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tindak_lanjut text;
