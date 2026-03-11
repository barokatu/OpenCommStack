export const id = {
  // App
  appName: 'OpenCommStack',
  
  // Tabs
  chats: 'Obrolan',
  status: 'Status',
  calls: 'Panggilan',
  settings: 'Pengaturan',
  
  // Auth
  welcome: 'Selamat Datang di OpenCommStack',
  loginSubtitle: 'Masukkan nomor telepon dan PIN untuk melanjutkan',
  register: 'Daftar',
  login: 'Masuk',
  phone: 'Nomor Telepon',
  pin: 'PIN (6 digit)',
  name: 'Nama',
  enterPhone: 'Masukkan nomor telepon',
  enterPin: 'Masukkan 6 digit PIN',
  enterName: 'Masukkan nama Anda',
  noAccount: 'Belum punya akun?',
  hasAccount: 'Sudah punya akun?',
  
  // Chat
  newChat: 'Obrolan Baru',
  newGroup: 'Grup Baru',
  typeMessage: 'Ketik pesan...',
  search: 'Cari...',
  searchChat: 'Cari atau mulai obrolan baru',
  online: 'Online',
  offline: 'Offline',
  typing: 'sedang mengetik...',
  lastSeen: 'Terakhir dilihat',
  today: 'Hari ini',
  yesterday: 'Kemarin',
  you: 'Anda',
  
  // Messages
  photo: 'Foto',
  video: 'Video',
  audio: 'Audio',
  document: 'Dokumen',
  deleted: 'Pesan ini telah dihapus',
  edited: 'diedit',
  reply: 'Balas',
  edit: 'Edit',
  delete: 'Hapus',
  forward: 'Teruskan',
  react: 'Reaksi',
  copy: 'Salin',
  
  // Status
  myStatus: 'Status Saya',
  addStatus: 'Tambah Status',
  statusPlaceholder: 'Tulis status Anda...',
  noStatus: 'Tidak ada pembaruan status',
  recentUpdates: 'Pembaruan Terbaru',
  viewedBy: 'Dilihat oleh',
  
  // Calls
  voiceCall: 'Panggilan Suara',
  videoCall: 'Panggilan Video',
  incoming: 'Masuk',
  outgoing: 'Keluar',
  missed: 'Tidak Terjawab',
  callEnded: 'Panggilan Berakhir',
  calling: 'Memanggil...',
  ringing: 'Berdering...',
  noCalls: 'Tidak ada riwayat panggilan',
  
  // Profile
  profile: 'Profil',
  about: 'Tentang',
  privacy: 'Privasi',
  darkMode: 'Mode Gelap',
  logout: 'Keluar',
  save: 'Simpan',
  cancel: 'Batal',
  
  // Misc
  noChats: 'Belum ada obrolan',
  startChatting: 'Mulai mengobrol dengan teman-teman Anda',
  contacts: 'Kontak',
  addContact: 'Tambah Kontak',
  members: 'Anggota',
  groupName: 'Nama Grup',
  createGroup: 'Buat Grup',
  
  // Errors
  error: 'Terjadi kesalahan',
  tryAgain: 'Coba lagi',
};

export type TranslationKey = keyof typeof id;
