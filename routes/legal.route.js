const express = require("express");
const router = express.Router();

const renderHtml = (title, content) => `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Daily Reflection</title>
  <style>
    :root {
      --primary: #2563eb;
      --text: #1e293b;
      --text-muted: #64748b;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --danger: #dc2626;
      --success: #16a34a;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      margin: 0;
      padding: 24px 16px;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 12px;
      padding: 32px 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      border: 1px solid var(--border);
    }
    h1 {
      font-size: 24px;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 18px;
      color: #0f172a;
      margin-top: 28px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    p, li {
      font-size: 15px;
      color: #334155;
    }
    ul, ol {
      padding-left: 20px;
    }
    li {
      margin-bottom: 6px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #eff6ff;
      color: var(--primary);
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .card {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border-left: 4px solid var(--primary);
    }
    .card-danger {
      background: #fef2f2;
      border-left-color: var(--danger);
    }
    .contact-box {
      background: #f8fafc;
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      text-align: center;
    }
    a {
      color: var(--primary);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      &copy; 2026 Daily Reflection &middot; <a href="/privacy-policy">Privacy Policy</a> &middot; <a href="/delete-account">Data Deletion</a>
    </div>
  </div>
</body>
</html>`;

// Data Deletion Request Page (Google Play Store compliance)
router.get(["/delete-account", "/data-deletion"], (req, res) => {
  const content = `
    <span class="badge">Google Play Data Safety</span>
    <h1>Permintaan Penghapusan Akun & Data (Account & Data Deletion)</h1>
    <div class="subtitle">Aplikasi: <strong>Daily Reflection</strong> (Package: <code>fulk.evilcorp.dailyreflection</code>)</div>

    <p>Pengguna aplikasi <strong>Daily Reflection</strong> berhak meminta penghapusan akun serta seluruh data pribadi yang terkait dengan aplikasi ini kapan saja.</p>

    <h2>1. Cara Menghapus Akun Langsung dari Aplikasi (Instan)</h2>
    <p>Jika aplikasi Daily Reflection masih terpasang di perangkat Anda, Anda dapat langsung menghapus akun dan data dalam hitungan detik:</p>
    <ol>
      <li>Buka aplikasi <strong>Daily Reflection</strong> di ponsel Anda.</li>
      <li>Buka tab <strong>Profil</strong> (kanan bawah) atau menu <strong>Pengaturan</strong>.</li>
      <li>Gulir ke bagian <strong>Akun</strong>.</li>
      <li>Ketuk tombol <strong>Hapus Akun & Data</strong>.</li>
      <li>Konfirmasikan pada dialog pop-up. Akun dan seluruh data cloud Anda akan langsung terhapus secara permanen seketika.</li>
    </ol>

    <h2>2. Cara Meminta Penghapusan Data Melalui Web / Email</h2>
    <p>Jika Anda telah menghapus/mencopot (uninstall) aplikasi dari perangkat Anda dan ingin menghapus seluruh data yang tersimpan di server kami:</p>
    <div class="card">
      <p>Kirimkan email permohonan ke pengembang aplikasi:</p>
      <ul>
        <li><strong>Email Tujuan:</strong> <a href="mailto:indrapalijama@gmail.com?subject=Permintaan%20Penghapusan%20Akun%20Daily%20Reflection">indrapalijama@gmail.com</a></li>
        <li><strong>Subjek Email:</strong> Permintaan Penghapusan Akun Daily Reflection</li>
        <li><strong>Isi Email:</strong> Cantumkan alamat email Google yang Anda gunakan untuk masuk (login) ke aplikasi Daily Reflection.</li>
      </ul>
      <p>Permintaan akan diverifikasi dan diproses dalam waktu <strong>maksimal 7 hari kerja</strong>.</p>
    </div>

    <h2>3. Jenis Data yang Akan Dihapus Secara Permanen</h2>
    <p>Saat penghapusan akun diproses, seluruh data berikut akan dimusnahkan secara permanen:</p>
    <ul>
      <li><strong>Data Autentikasi Pengguna:</strong> Identitas akun Firebase Authentication (Email, Nama profil, dan User UID).</li>
      <li><strong>Data Favorit Cloud:</strong> Seluruh daftar renungan dan artikel favorit yang tersimpan di Google Cloud Firestore (<code>users/{userId}/favorites</code>).</li>
      <li><strong>Histori & Statistik:</strong> Catatan streak harian dan histori saat teduh.</li>
    </ul>

    <h2>4. Kebijakan Retensi Data (Data Retention)</h2>
    <div class="card card-danger">
      <p><strong>Tidak ada data pribadi yang disimpan setelah akun dihapus.</strong> Kami tidak menjual data pengguna dan tidak menyimpan salinan cadangan (backup) dari data pengguna yang telah meminta penghapusan akun.</p>
    </div>

    <div class="contact-box">
      <strong>Butuh bantuan lebih lanjut?</strong><br>
      Hubungi kami di <a href="mailto:indrapalijama@gmail.com">indrapalijama@gmail.com</a>
    </div>
  `;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.send(renderHtml("Penghapusan Akun & Data", content));
});

// Privacy Policy Page
router.get(["/privacy-policy", "/privacy"], (req, res) => {
  const content = `
    <span class="badge">Kebijakan Privasi</span>
    <h1>Kebijakan Privasi Daily Reflection</h1>
    <div class="subtitle">Terakhir Diperbarui: 11 September 2026</div>

    <p>Privasi Anda sangat penting bagi kami. Kebijakan Privasi ini menjelaskan bagaimana aplikasi <strong>Daily Reflection</strong> (<code>fulk.evilcorp.dailyreflection</code>) mengelola informasi Anda.</p>

    <h2>1. Data yang Dikumpulkan</h2>
    <ul>
      <li><strong>Akun Google (Opsional):</strong> Jika Anda memilih untuk masuk (Sign in with Google), kami hanya menggunakan User ID dan alamat email Anda untuk menyinkronkan renungan favorit Anda antar perangkat melalui Firebase Authentication dan Google Cloud Firestore.</li>
      <li><strong>Penggunaan Anonim:</strong> Anda dapat menggunakan seluruh fitur utama aplikasi (membaca renungan harian, Alkitab, dan kidung pujian) tanpa harus membuat akun atau masuk.</li>
      <li><strong>Tanpa Iklan &amp; Pelacak Pihak Ketiga:</strong> Aplikasi ini bebas dari iklan komersial dan tidak mengumpulkan data untuk keperluan pemasaran.</li>
    </ul>

    <h2>2. Penggunaan Data</h2>
    <p>Data yang dikumpulkan semata-mata digunakan untuk:</p>
    <ul>
      <li>Menyimpan dan menyinkronkan renungan favorit Anda.</li>
      <li>Menyimpan preferensi tampilan lokal (tema gelap/terang, ukuran huruf, pengaturan terjemahan Alkitab).</li>
      <li>Mengirimkan notifikasi pengingat harian lokal (hanya jika diaktifkan oleh pengguna).</li>
    </ul>

    <h2>3. Penghapusan Akun dan Data</h2>
    <p>Anda dapat menghapus seluruh akun dan data Anda kapan saja langsung dari aplikasi melalui menu <strong>Profil &gt; Pengaturan &gt; Hapus Akun &amp; Data</strong>, atau mengajukan permintaan melalui halaman <a href="/delete-account">Penghapusan Data</a>.</p>

    <h2>4. Kontak Pengembang</h2>
    <p>Jika ada pertanyaan seputar kebijakan privasi ini, silakan hubungi kami di <a href="mailto:indrapalijama@gmail.com">indrapalijama@gmail.com</a>.</p>
  `;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.send(renderHtml("Kebijakan Privasi", content));
});

module.exports = router;
