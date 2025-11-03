/**
 * Maps internal error codes and messages to user-friendly Indonesian messages
 * while logging full details server-side for debugging
 */
export function getUserFriendlyError(error: any): string {
  // PostgreSQL error codes
  if (error.code === '23505') return 'Data sudah ada dalam sistem';
  if (error.code === '23503') return 'Data terkait tidak ditemukan';
  if (error.code === '23514') return 'Data tidak valid';
  if (error.code === '42501') return 'Anda tidak memiliki akses';
  
  // Auth errors
  if (error.message?.includes('JWT')) return 'Sesi Anda telah berakhir. Silakan login kembali';
  if (error.message?.includes('Invalid login')) return 'Email atau password salah';
  if (error.message?.includes('Email not confirmed')) return 'Email belum dikonfirmasi';
  if (error.message?.includes('User already registered')) return 'Email sudah terdaftar';
  
  // Log full error for debugging (only visible in console, not to users)
  console.error('Internal error:', error);
  
  // Generic message for everything else
  return 'Terjadi kesalahan. Silakan coba lagi';
}
