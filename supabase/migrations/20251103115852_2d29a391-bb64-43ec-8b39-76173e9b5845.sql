-- Add 'Tidak Ada' to the teacher_rank enum type
ALTER TYPE teacher_rank ADD VALUE IF NOT EXISTS 'Tidak Ada';