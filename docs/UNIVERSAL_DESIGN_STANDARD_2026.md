# Universal Modern Premium Design System & Website Quality Standard (2026)

Pedoman standar arsitektur UI/UX global untuk repositori `ticketing-system` dan proyek ekosistem Codex lainnya (seperti *Wedding Planner*, *Life Planner*, *Kept*, dan aplikasi SaaS internal lainnya).

---

## 1. Filosofi Inti: Sintesis "The Big Five"

Standar ini bukan menjiplak satu website secara mentah, melainkan mengabstraksi prinsip terbaik dari 5 kiblat produk modern:

1. **Linear** — *Consistency & Speed:* Navigasi berbasis keyboard, kerapatan informasi yang pas, hirarki visual monokromatik terstruktur, dan mikro-interaksi secepat kilat.
2. **Apple** — *Simplicity, Restraint & Tactile Depth:* Whitespace proporsional, sudut squircle (`rounded-xl`/`rounded-2xl`), font sistem asli (`-apple-system`), dan transisi fisik halus (`active:scale-[0.98]`).
3. **Stripe** — *Visual Hierarchy & Clarity:* Tipografi berbobot tegas, tata letak data yang bersih, dan penggunaan aksen warna fungsional untuk status penting.
4. **Raycast** — *Interactivity & Fluidity:* Command Palette cepat (`Ctrl+K`), navigasi baris (`j`/`k`), dan umpan balik instan untuk setiap mutasi data.
5. **Vercel** — *Technical Precision & Performance:* Border 1px yang tajam (`#E2E8F0`), kontras terukur (WCAG AAA), zero bloat, serta skeleton loading yang tenang.

---

## 2. Delapan Karakteristik Utama & Penerapannya

### Karakteristik 1: Modern Visual Language
- **Typography Berkarakter:** Gunakan font sistem modern (`-apple-system`, `SF Pro`, `Inter`, `Geist`) dengan penyesuaian *optical tracking* (h1: `-0.025em`, h2: `-0.02em`, h3: `-0.015em`).
- **Whitespace Proporsional:** Berikan ruang bernapas yang cukup antar seksi (`space-y-6`, `p-5 sm:p-6`).
- **Warna Terukur:** Dominasi warna netral (canvas slate/white, teks obsidian ink). Warna saturasi tinggi (merah, amber, zamrud) **hanya** dipakai untuk status fungsional tiket dan identitas aplikasi.
- **Konsistensi Desain:** Token warna, bayangan, dan radius sudut seragam di seluruh portal dan dashboard.

### Karakteristik 2: Bento Grid & Modular Layout
- Hindari deretan kartu yang semuanya identik dan membosankan.
- Gunakan ritme visual bertingkat:
  - **Hero / Primary KPI Card:** Kartu metrik utama dengan visualisasi atau angka besar.
  - **Secondary Info Cards:** Kartu statistik ringkas pendukung dengan ikon fungsional.
  - **Actionable Modular Queue:** Tabel atau daftar kerja dengan kontrol interaktif di tempat.

### Karakteristik 3: Sophisticated Typography
- Angka, persentase, dan metrik wajib menggunakan format **`tabular-nums`** agar angka rata dan mudah dipindai mata saat nilai berubah.
- Monospace (`font-mono`) **hanya** digunakan untuk ID kode teknis (misal `TKT-101`, kunci UUID, hash kriptografi, atau blok kode).
- Body text menggunakan tinggi baris nyaman (`leading-relaxed` atau `leading-normal`).

### Karakteristik 4: Subtle Animations & Micro-Interactions
- Tombol dan kartu interaktif memiliki respon sentuhan nyata:
  ```css
  /* Sentuhan taktil cepat tanpa lag */
  active:scale-[0.98] transition-all duration-150 ease-out
  ```
- Animasi transisi halus (`animate-fadeIn`) pada dialog popover dan drawer notifikasi.
- **Loading Skeleton:** Gunakan skeleton pulsa lembut (`Skeleton.tsx`) saat memuat halaman atau data asynchronous, menggantikan spinner kaku.

### Karakteristik 5: Modern Color System (Netral Terstruktur)
```js
colors: {
  canvas: '#F8FAFC',        // Slate-50: Latar belakang bersih, tidak buram
  panel: '#FFFFFF',         // Putih bersih untuk kontainer kartu & modal
  subtle: '#F1F5F9',        // Slate-100: Tombol sekunder & latar input
  line: '#E2E8F0',          // Slate-200: Garis pemisah 1px halus
  'line-strong': '#CBD5E1', // Slate-300: Border saat hover
  ink: '#0F172A',           // Slate-900 / Obsidian: Teks utama kontras tinggi
  'ink-muted': '#475569',   // Slate-600: Label sekunder
  'ink-faint': '#94A3B8',   // Slate-400: Placeholder & bantuan
}
```

### Karakteristik 6: Glassmorphism & Depth yang Terkendali
- Hindari efek blur di mana-mana yang membuat website berat.
- Terapkan efek kaca (*frosted glass*) **secara selektif** hanya pada elemen yang melayang di atas konten yang bergulir:
  - Sticky Header: `backdrop-blur-md bg-panel/85 border-b border-line`
  - Command Palette Modal & Lightbox: `backdrop-blur-sm bg-black/60`
- Bayangan lembut berlapis:
  - `shadow-xs`: Tombol & lencana kecil
  - `shadow-card`: Kartu konten & tabel
  - `shadow-popover`: Menu dropdown & modal

### Karakteristik 7: Desain Responsif & Adaptif Sejati
- **Mobile First & Touch Targets:** Semua tombol interaktif memiliki target sentuh minimal 44x44px pada layar smartphone.
- **Tabel Responsif:** Selalu dibungkus `overflow-x-auto` agar data lebar tetap dapat digeser horizontal tanpa merusak layout layar.
- **Sidebar Adaptif:** Bilah ikon primer tetap ringkas (52px) dengan panel teks yang dapat diciutkan (*collapsible*).

### Karakteristik 8: Functional UX & Feedback Loop
- **Empty States yang Membantu:** Saat pencarian atau filter bernilai kosong, tampilkan ilustrasi ikon, judul yang ramah, serta tombol *action* untuk mereset filter.
- **Pintasan Keyboard:**
  - `Ctrl + K` / `Cmd + K`: Membuka Command Palette universal.
  - `Ctrl + Enter`: Mengirim balasan tiket atau menyimpan catatan internal seketika.
  - `Esc`: Menutup dialog, drawer notifikasi, atau penampil gambar.
- **Umpan Balik Instan:** Tindakan menyalin ID komposit atau merubah status langsung memberikan konfirmasi visual (ikon centang dan toast notifikasi).

---

## 3. Checklist Evaluasi Kualitas Desain (Sebelum Rilis)

Setiap halaman baru wajib memenuhi checklist ini sebelum digabungkan ke cabang `main`:

- [ ] Apakah tipografi judul dan teks memiliki kontras yang nyaman dan terbaca jelas?
- [ ] Apakah metrik dan angka sudah menggunakan `tabular-nums` dan bukan font-mono liar?
- [ ] Apakah kartu dan tombol memiliki state hover, focus, dan active yang responsif?
- [ ] Apakah kondisi kosong (*empty state*) menyediakan solusi atau arahan langkah selanjutnya bagi pengguna?
- [ ] Apakah halaman dapat dibuka dan digunakan dengan nyaman di layar ponsel tanpa elemen terpotong?
- [ ] Apakah tidak ada gradien berlebihan atau dekorasi "AI slop" yang tidak memiliki nilai fungsional?
- [ ] Apakah seluruh istilah bahasa Indonesia konsisten dengan [`GLOSSARY.md`](file:///c:/Users/rizky/Documents/Dev/ticketing-system/GLOSSARY.md)?
