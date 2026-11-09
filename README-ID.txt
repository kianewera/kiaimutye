DRIP CLIENT — PAKET WEBSITE GITHUB PAGES + BACKEND CLOUDFLARE WORKERS

PENTING:
- Website frontend dipasang di GitHub Pages.
- Backend dipasang di Cloudflare Workers.
- API key Drip disimpan di Cloudflare KV, tidak dimasukkan ke GitHub.
- Password admin tidak ditulis ke file website. Atur sebagai Worker secret.
- Jangan pernah mengirim API key live atau password melalui chat atau memasukkannya ke file publik.

ISI:
index.html, style.css, app.js = website
worker/worker.js = backend login + penyimpanan key + katalog API
worker/wrangler.toml = konfigurasi Worker

LANGKAH 1 — DEPLOY BACKEND
1. Buat akun Cloudflare, buka Workers & Pages.
2. Buat KV namespace bernama DRIP_SECRETS.
3. Salin ID KV ke worker/wrangler.toml menggantikan GANTI_DENGAN_KV_NAMESPACE_ID.
4. Buat Worker bernama drip-client-admin-api, unggah worker/worker.js.
   Jika menggunakan Wrangler: masuk ke folder worker lalu jalankan:
   npx wrangler deploy
5. Tambahkan binding KV:
   Variable name: SECRETS
   KV namespace: DRIP_SECRETS
6. Tambahkan Variables/Secrets pada Worker:
   ADMIN_EMAIL = nabilmlc13@gmail.com
   ADMIN_PASSWORD = password admin pilihan Anda (masukkan di dashboard Cloudflare, jangan di file)
   JWT_SECRET = string acak panjang minimal 32 karakter
   FRONTEND_ORIGIN = https://USERNAME.github.io
   Jika memakai repository project page, gunakan URL lengkap misalnya https://USERNAME.github.io/NAMA-REPO
7. Deploy ulang Worker setelah konfigurasi selesai.

LANGKAH 2 — GITHUB PAGES
1. Upload index.html, style.css, dan app.js ke repository GitHub.
2. Buka app.js, ubah nilai API menjadi URL Worker Anda:
   const API = "https://NAMA-WORKER.SUBDOMAIN.workers.dev";
3. Commit perubahan.
4. Repository Settings → Pages → Deploy from a branch → pilih main dan /(root).
5. Tunggu URL GitHub Pages aktif.

LANGKAH 3 — LOGIN DAN API
1. Buka website GitHub Pages.
2. Login dengan email admin yang diset di Cloudflare dan password yang Anda masukkan sebagai ADMIN_PASSWORD.
3. Di panel API Connection, masukkan Drip API key Anda lalu Simpan API Key.
4. Tekan Tes koneksi API.
5. Tekan Muat ulang untuk menampilkan katalog. Harga/stock berasal dari /api/v1/products dan mengikuti price tier API key jika Drip mendukungnya.

CATATAN:
- Paket ini tidak berisi API key Drip maupun password admin.
- Gunakan API key sandbox untuk tes terlebih dahulu. Jangan gunakan key live sampai pengujian selesai.
- Endpoint order/pembelian belum diaktifkan pada tampilan ini; paket ini menampilkan katalog produk, harga, stok, dan pengaturan key saja.
- Foto admin dapat dipilih dari panel dan tersimpan lokal di browser/perangkat tersebut.
- Jika login gagal, periksa FRONTEND_ORIGIN harus sama persis dengan URL GitHub Pages (tanpa slash terakhir), Worker secrets, KV binding, dan URL Worker pada app.js.
- API Drip: https://www.dripclientofficial.dev/developers
