<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login - BIMBEL ID</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #980016;
            --text: #ffffff;
            --input: #f2f4f7;
            --btn: #f89a00;
            --btn-soft: #af5a68;
            --line: rgba(255, 255, 255, 0.35);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: "Outfit", sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
        }

        .layout {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 24px;
            width: min(1500px, 94vw);
            margin: 0 auto;
            padding: 24px 0;
        }

        .left { padding: 18px 20px; display: flex; flex-direction: column; justify-content: center; }
        .brand { font-size: 82px; font-weight: 800; letter-spacing: 1px; }
        .tagline { margin-top: auto; font-size: clamp(56px, 7vw, 110px); line-height: 0.92; font-weight: 900; }
        .tagline span { color: #ffcf38; }

        .team {
            margin: 38px 0;
            background: radial-gradient(circle at 50% 20%, rgba(255,255,255,0.24), transparent 58%);
            height: 360px;
            border-radius: 28px;
            border: 1px dashed rgba(255,255,255,0.25);
            display: grid;
            place-items: center;
            font-size: 28px;
            color: rgba(255,255,255,0.8);
        }

        .right {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 14px;
        }

        .panel {
            width: min(700px, 100%);
        }

        h1 { font-size: clamp(52px, 6vw, 90px); line-height: 0.95; margin-bottom: 14px; }
        .sub { font-size: 46px; margin-bottom: 28px; }

        label { display: block; font-size: 48px; margin: 18px 0 10px; }

        input {
            width: 100%;
            border: 0;
            border-radius: 22px;
            background: var(--input);
            padding: 18px 20px;
            font: inherit;
            font-size: 30px;
            color: #223;
        }

        .forgot {
            margin-top: 12px;
            text-align: right;
            font-size: 44px;
            display: block;
            color: #fff;
            text-decoration: none;
        }

        .btn {
            margin-top: 24px;
            width: 100%;
            border: 0;
            border-radius: 999px;
            padding: 16px;
            font: inherit;
            font-size: 44px;
            font-weight: 700;
            cursor: pointer;
        }

        .btn-main { background: var(--btn); color: #241600; }

        .divider {
            margin: 20px 0;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #ffdede;
            font-size: 36px;
        }

        .divider::before,
        .divider::after { content: ""; height: 1px; background: var(--line); flex: 1; }

        .btn-google { background: #ffffff; color: #293850; }
        .btn-soft { background: var(--btn-soft); color: #fff; }

        .links {
            margin-top: 22px;
            display: flex;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
        }

        .links a { color: #fff; font-size: 32px; }

        @media (max-width: 1100px) {
            .layout { grid-template-columns: 1fr; }
            .left { order: 2; padding-top: 0; }
            .right { order: 1; }
            .brand { font-size: 54px; }
            .team { height: 220px; font-size: 20px; }
            .tagline { font-size: clamp(40px, 9vw, 62px); }
            h1 { font-size: clamp(40px, 10vw, 62px); }
            .sub { font-size: 24px; }
            label { font-size: 24px; }
            input { font-size: 18px; border-radius: 14px; }
            .forgot { font-size: 22px; }
            .btn { font-size: 26px; }
            .divider { font-size: 22px; }
            .links a { font-size: 18px; }
        }
    </style>
</head>
<body>
    <main class="layout">
        <section class="left">
            <div class="brand">BIMBEL ID</div>
            <div class="team">Area visual tim / banner</div>
            <div class="tagline">Belajar Lebih Cerdas<br><span>Prestasi Mengesankan</span></div>
        </section>

        <section class="right">
            <div class="panel">
                <h1>Selamat Datang<br>Kembali!</h1>
                <p class="sub">Mulai lagi progres belajarmu hari ini.</p>

                <form>
                    <label for="email">Email</label>
                    <input id="email" type="email" placeholder="nama@email.com">

                    <label for="password">Password</label>
                    <input id="password" type="password" placeholder="Masukkan password">

                    <a class="forgot" href="#">Lupa Password?</a>

                    <button class="btn btn-main" type="submit">Masuk</button>

                    <div class="divider">ATAU</div>

                    <button class="btn btn-google" type="button">Sign in with Google</button>
                    <a class="btn btn-soft" href="{{ route('register') }}" style="display:block;text-align:center;text-decoration:none;">Belum Punya Akun? Daftar Sekarang!</a>
                </form>

                <div class="links">
                    <a href="#">Tentang Kami</a>
                    <a href="#">Syarat dan Ketentuan</a>
                    <a href="#">Kebijakan Privasi</a>
                </div>
            </div>
        </section>
    </main>
</body>
</html>
