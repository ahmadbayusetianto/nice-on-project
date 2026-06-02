<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Daftar - BIMBEL ID</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #980016;
            --text: #ffffff;
            --field: #f1f3f6;
            --line: rgba(255, 255, 255, 0.25);
            --cta: #f79400;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            min-height: 100vh;
            background: var(--bg);
            color: var(--text);
            font-family: "Outfit", sans-serif;
            display: grid;
            place-items: center;
            padding: 28px 14px;
        }

        .card {
            width: min(760px, 100%);
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 26px;
        }

        h1 { font-size: clamp(38px, 6vw, 66px); line-height: 1; margin-bottom: 8px; }
        .sub { font-size: clamp(20px, 2.4vw, 32px); margin-bottom: 18px; opacity: 0.96; }

        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }

        .field.full { grid-column: 1 / -1; }

        label {
            display: block;
            font-size: clamp(20px, 2.2vw, 30px);
            margin: 0 0 6px;
        }

        input, select {
            width: 100%;
            border: 0;
            border-radius: 14px;
            background: var(--field);
            color: #1f2f47;
            font: inherit;
            font-size: clamp(17px, 1.8vw, 24px);
            padding: 12px 14px;
        }

        .btn {
            width: 100%;
            margin-top: 18px;
            border: 0;
            border-radius: 999px;
            padding: 14px 18px;
            font: inherit;
            font-size: clamp(22px, 2.4vw, 32px);
            font-weight: 700;
            cursor: pointer;
        }

        .btn-main { background: var(--cta); color: #1f1700; }

        .foot {
            margin-top: 14px;
            text-align: center;
            font-size: clamp(16px, 1.8vw, 22px);
        }

        .foot a { color: #fff; font-weight: 700; }

        @media (max-width: 760px) {
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <main class="card">
        <h1>Daftar Akun</h1>
        <p class="sub">Mulai perjalanan belajarmu dari sekarang.</p>

        <form>
            <div class="grid">
                <div class="field full">
                    <label for="nama">Nama</label>
                    <input id="nama" type="text" placeholder="Nama lengkap">
                </div>

                <div class="field full">
                    <label for="email">Email</label>
                    <input id="email" type="email" placeholder="nama@email.com">
                </div>

                <div class="field">
                    <label for="telepon">Telepon</label>
                    <input id="telepon" type="tel" placeholder="+62 812 3456 7890">
                </div>

                <div class="field">
                    <label for="sumber">Sumber Informasi</label>
                    <select id="sumber">
                        <option>Pilih sumber</option>
                        <option>Instagram</option>
                        <option>TikTok</option>
                        <option>Teman</option>
                    </select>
                </div>

                <div class="field full">
                    <label for="kategori">Kategori</label>
                    <select id="kategori">
                        <option>Pilih kategori</option>
                        <option>CPNS</option>
                        <option>PPPK</option>
                        <option>Sekolah Kedinasan</option>
                    </select>
                </div>

                <div class="field">
                    <label for="password">Password</label>
                    <input id="password" type="password" placeholder="Buat password">
                </div>

                <div class="field">
                    <label for="password_confirmation">Konfirmasi Password</label>
                    <input id="password_confirmation" type="password" placeholder="Ulangi password">
                </div>
            </div>

            <button class="btn btn-main" type="submit">Daftar</button>
        </form>

        <p class="foot">Sudah punya akun? <a href="{{ route('login') }}">Login di sini</a></p>
    </main>
</body>
</html>
