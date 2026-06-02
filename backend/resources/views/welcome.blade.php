<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>BIMBEL ID - Fresh Blue Mockup</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #edf1f6;
            --nav-bg: rgba(255, 255, 255, 0.95);
            --text: #13203a;
            --muted: #4b5f7f;
            --cyan: #10a7e4;
            --cyan-dark: #0f8fcd;
            --blue: #1d4ed8;
            --blue-2: #0ea5e9;
            --shadow: 0 14px 34px rgba(41, 83, 145, 0.16);
            --line: rgba(122, 146, 184, 0.22);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            min-height: 100vh;
            color: var(--text);
            font-family: "Outfit", sans-serif;
            background: var(--bg);
        }

        .promo {
            background: linear-gradient(90deg, var(--blue), var(--blue-2));
            color: #fff;
            padding: 14px 0;
        }

        .promo-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            flex-wrap: wrap;
            font-weight: 600;
            font-size: 18px;
        }

        .promo-pill {
            border-radius: 999px;
            padding: 9px 18px;
            background: #0b1a38;
            color: #fff;
            text-decoration: none;
            font-weight: 700;
        }

        .container { width: min(1180px, 92vw); margin: 0 auto; }

        .topbar {
            position: sticky;
            top: 0;
            z-index: 50;
            backdrop-filter: blur(10px);
            background: var(--nav-bg);
            border-bottom: 1px solid var(--line);
            box-shadow: 0 6px 18px rgba(90, 110, 143, 0.1);
        }

        .topbar-inner {
            height: 74px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .logo {
            font-size: 30px;
            font-weight: 900;
            letter-spacing: 0.7px;
            background: linear-gradient(90deg, #24b4ed, #0ea5e9);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .menu {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .menu a {
            color: var(--text);
            text-decoration: none;
            font-weight: 600;
            padding: 10px 14px;
            border-radius: 999px;
            border: 1px solid transparent;
            transition: all 0.2s ease;
        }

        .menu a:hover { border-color: var(--line); background: rgba(147, 197, 253, 0.08); }

        .menu a.active { color: #fff; background: linear-gradient(135deg, var(--cyan), #2bb7f3); box-shadow: 0 8px 20px rgba(16, 167, 228, 0.32); }

        .auth { display: flex; gap: 10px; }

        .auth .btn { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }

        .btn {
            border: 1px solid var(--line);
            border-radius: 999px;
            padding: 10px 18px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
            color: #213350;
            background: #f8fbff;
        }

        .btn.primary {
            color: #fff;
            border: none;
            background: linear-gradient(130deg, var(--cyan), #2ab8f4);
        }

        .hero {
            padding: 64px 0 56px;
            text-align: left;
            position: relative;
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 28px;
            align-items: start;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid var(--line);
            background: #fff8ee;
            color: var(--muted);
            padding: 8px 14px;
            border-radius: 999px;
            margin-bottom: 22px;
            font-size: 14px;
            position: relative;
            z-index: 1;
        }

        .hero h1 {
            position: relative;
            z-index: 1;
            font-size: clamp(44px, 7vw, 94px);
            line-height: 0.98;
            font-weight: 900;
            letter-spacing: -1.2px;
        }

        .hero h1 span {
            display: block;
            margin-top: 10px;
            background: linear-gradient(90deg, #1ab3ef 0%, #129fe1 48%, #147ed2 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .hero p {
            position: relative;
            z-index: 1;
            width: min(840px, 100%);
            margin: 22px auto 0;
            color: var(--muted);
            font-size: clamp(16px, 2vw, 30px);
            line-height: 1.35;
            font-weight: 500;
        }

        .hero-points {
            margin-top: 16px;
            list-style: none;
            padding: 0;
        }

        .hero-points li {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            color: #1d3557;
            font-size: clamp(15px, 1.3vw, 20px);
            line-height: 1.45;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .hero-points li::before {
            content: "✅";
            line-height: 1;
            margin-top: 2px;
            flex: 0 0 auto;
        }

        .hero-strong {
            margin-top: 12px;
            color: #102a4b;
            font-weight: 700;
            font-size: clamp(16px, 1.6vw, 24px);
        }

        .hero-actions {
            position: relative;
            z-index: 1;
            margin-top: 32px;
            display: flex;
            justify-content: flex-start;
            gap: 12px;
            flex-wrap: wrap;
        }

        .pill {
            border-radius: 999px;
            padding: 12px 20px;
            font-weight: 700;
            border: 1px solid var(--line);
            background: #f8fbff;
            color: #1f3552;
            text-decoration: none;
        }

        .pill.main {
            color: #052336;
            border: none;
            background: linear-gradient(130deg, var(--cyan), #2ab8f4);
            box-shadow: 0 12px 24px rgba(16, 167, 228, 0.28);
        }

        .hero-card {
            border-radius: 26px;
            background: #fff;
            border: 1px solid #d4deee;
            box-shadow: var(--shadow);
            overflow: hidden;
            position: relative;
        }

        .hero-card .thumb {
            height: 250px;
            background: linear-gradient(145deg, #5cbaf4, #1f7fcd);
            position: relative;
            overflow: hidden;
        }

        .slider-track {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .slide {
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity 0.7s ease;
            pointer-events: none;
        }

        .slide.active {
            opacity: 1;
            pointer-events: auto;
        }

        .slide-bg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            transform: scale(1.06);
            transition: transform 0.25s linear;
        }

        .slide-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(6, 24, 56, 0.5), rgba(6, 24, 56, 0.08));
        }

        .slide-label {
            position: absolute;
            left: 14px;
            bottom: 14px;
            background: rgba(255, 255, 255, 0.9);
            color: #12365a;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.4px;
        }

        .slider-dots {
            position: absolute;
            right: 12px;
            bottom: 12px;
            display: flex;
            gap: 6px;
            z-index: 5;
        }

        .slider-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            border: 0;
            padding: 0;
            background: rgba(255, 255, 255, 0.6);
            cursor: pointer;
        }

        .slider-dot.active {
            width: 22px;
            background: #ffffff;
        }

        .hero-card .body { padding: 18px; }

        .hero-card h3 { font-size: 36px; line-height: 1.05; margin-bottom: 8px; }

        .hero-card p { color: var(--muted); font-size: 16px; }

        .stats { padding-bottom: 56px; }

        .stats-card {
            background: linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.98));
            border: 1px solid var(--line);
            border-radius: 30px;
            box-shadow: var(--shadow);
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
        }

        .stat {
            border: 1px solid rgba(124, 162, 226, 0.18);
            border-radius: 20px;
            padding: 18px 12px;
            text-align: center;
            background: linear-gradient(175deg, rgba(236, 245, 255, 0.95), rgba(227, 239, 255, 0.95));
        }

        .icon {
            width: 62px;
            height: 62px;
            border-radius: 18px;
            margin: 0 auto 10px;
            display: grid;
            place-items: center;
            color: #0a3554;
            font-weight: 800;
            background: linear-gradient(130deg, #b7e8ff, #8cd9ff);
        }

        .stat-value {
            font-size: clamp(30px, 3.5vw, 44px);
            font-weight: 800;
            line-height: 1;
        }

        .stat-label {
            margin-top: 8px;
            font-size: 13px;
            color: var(--muted);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stats-note {
            margin-top: 12px;
            text-align: center;
            color: #51647f;
            font-size: 14px;
        }

        .faq {
            padding: 34px 0 72px;
        }

        .testimonials {
            padding: 24px 0 62px;
        }

        .testimonials-head {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .testimonials-title {
            font-size: clamp(32px, 4vw, 52px);
            font-weight: 800;
            color: #11243f;
        }

        .testimonials-sub {
            font-size: 18px;
            color: #4f617d;
            max-width: 620px;
        }

        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
        }

        .testimonial-card {
            background: #ffffff;
            border: 1px solid #d5deeb;
            border-radius: 18px;
            box-shadow: 0 10px 24px rgba(25, 56, 99, 0.1);
            padding: 20px;
        }

        .testimonial-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .avatar {
            width: 52px;
            height: 52px;
            border-radius: 999px;
            background: linear-gradient(130deg, #8cd9ff, #b7e8ff);
            display: grid;
            place-items: center;
            color: #0b3654;
            font-weight: 800;
        }

        .who strong {
            display: block;
            font-size: 18px;
            color: #17253b;
        }

        .who span {
            display: block;
            font-size: 14px;
            color: #5d6f8a;
        }

        .stars {
            color: #ffb800;
            letter-spacing: 1px;
            margin-bottom: 8px;
            font-size: 16px;
        }

        .testimonial-text {
            color: #334765;
            line-height: 1.6;
            font-size: 16px;
        }

        .package {
            padding: 8px 0 76px;
        }

        .package-title {
            font-size: clamp(32px, 4vw, 52px);
            font-weight: 800;
            color: #9a001a;
            margin-bottom: 16px;
        }

        .package-tabs {
            display: flex;
            align-items: end;
            border-bottom: 1px solid #cfd8e6;
            margin-bottom: 24px;
            gap: 8px;
        }

        .package-tab {
            border: 1px solid transparent;
            border-bottom: 0;
            background: transparent;
            color: #990019;
            font: inherit;
            font-weight: 700;
            font-size: 36px;
            padding: 12px 28px;
            border-radius: 12px 12px 0 0;
            cursor: pointer;
        }

        .package-tab.active {
            background: #fff;
            border-color: #cfd8e6;
            color: #8e0016;
            margin-bottom: -1px;
        }

        .package-filter {
            margin-bottom: 24px;
        }

        .package-filter label {
            display: block;
            font-size: 38px;
            font-weight: 700;
            color: #162946;
            margin-bottom: 10px;
        }

        .package-filter select {
            width: min(480px, 100%);
            border: 1px solid #c4cedf;
            background: #f8fbff;
            color: #203251;
            border-radius: 12px;
            padding: 14px 16px;
            font: inherit;
            font-size: 30px;
        }

        .package-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 20px;
        }

        .course-card {
            border-radius: 24px;
            border: 1px solid #d5deeb;
            background: #fff;
            box-shadow: 0 12px 28px rgba(25, 56, 99, 0.12);
            overflow: hidden;
        }

        .course-cover {
            height: 220px;
            background: radial-gradient(circle at 72% 30%, rgba(0, 0, 0, 0.2), transparent 26%), linear-gradient(135deg, #6f0015, #910019 60%, #50000b);
            position: relative;
        }

        .course-cover::before {
            content: "LOREM IPSUM";
            position: absolute;
            left: 22px;
            top: 24px;
            color: #ffe28e;
            font-weight: 800;
            font-size: 26px;
            letter-spacing: 1.2px;
        }

        .course-cover::after {
            content: "TRYOUT BUNDLE";
            position: absolute;
            left: 22px;
            bottom: 24px;
            color: #ffffff;
            font-weight: 900;
            font-size: 34px;
            line-height: 0.95;
            white-space: pre;
        }

        .course-body {
            padding: 20px 22px 24px;
        }

        .course-title {
            font-size: 46px;
            line-height: 1.08;
            color: #1f2a3d;
            margin-bottom: 12px;
            font-weight: 800;
        }

        .course-sub {
            font-size: 34px;
            color: #2a2f36;
            line-height: 1.35;
            margin-bottom: 14px;
        }

        .course-meta {
            font-size: 33px;
            color: #394b65;
            line-height: 1.35;
            margin-bottom: 14px;
        }

        .course-list {
            padding-left: 0;
            list-style: none;
            margin-bottom: 18px;
        }

        .course-list li {
            font-size: 31px;
            color: #1f2f47;
            line-height: 1.3;
            margin-bottom: 6px;
        }

        .course-price {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
        }

        .badge-discount {
            background: #18a92c;
            color: #fff;
            font-size: 27px;
            border-radius: 9px;
            font-weight: 700;
            padding: 6px 10px;
        }

        .old-price {
            color: #4f617d;
            text-decoration: line-through;
            font-size: 34px;
            margin-left: 6px;
        }

        .new-price {
            color: #980018;
            font-size: 58px;
            font-weight: 900;
            margin-left: auto;
        }

        .faq-title {
            text-align: center;
            font-size: clamp(34px, 4vw, 56px);
            font-weight: 800;
            color: #a00020;
            margin-bottom: 26px;
        }

        .faq-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px 26px;
        }

        .faq-item {
            border: 1px solid #ced7e4;
            border-radius: 10px;
            background: #f9fbff;
            overflow: hidden;
        }

        .faq-item summary {
            list-style: none;
            cursor: pointer;
            font-size: 24px;
            font-weight: 500;
            color: #1f2a3d;
            padding: 18px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .faq-item summary::-webkit-details-marker { display: none; }

        .faq-item summary::after {
            content: "+";
            font-size: 32px;
            font-weight: 400;
            line-height: 1;
            color: #3b4e6d;
        }

        .faq-item[open] summary::after {
            content: "-";
        }

        .faq-answer {
            border-top: 1px solid #d8e0eb;
            padding: 0 24px 18px;
            color: #51647f;
            font-size: 17px;
            line-height: 1.6;
        }

        @media (max-width: 980px) {
            .topbar-inner { height: auto; padding: 14px 0; flex-wrap: wrap; justify-content: center; }
            .promo-inner { font-size: 16px; }
            .hero { grid-template-columns: 1fr; text-align: center; }
            .hero-actions { justify-content: center; }
            .stats-card { grid-template-columns: repeat(2, 1fr); }
            .faq-grid { grid-template-columns: 1fr; }
            .package-grid { grid-template-columns: 1fr; }
            .testimonials-grid { grid-template-columns: 1fr; }
            .package-tab { font-size: 22px; padding: 10px 14px; }
            .package-filter label { font-size: 24px; }
            .package-filter select { font-size: 18px; }
            .course-title { font-size: 34px; }
            .course-sub { font-size: 24px; }
            .course-meta, .course-list li { font-size: 21px; }
            .new-price { font-size: 42px; }
            .old-price { font-size: 24px; }
        }

        @media (max-width: 640px) {
            .logo { font-size: 25px; }
            .menu a { font-size: 14px; padding: 8px 12px; }
            .btn { padding: 9px 14px; }
            .hero { padding-top: 40px; }
            .hero h1 { letter-spacing: -0.5px; }
            .hero p { font-size: 17px; }
            .hero-points li { font-size: 15px; }
            .hero-strong { font-size: 16px; }
            .hero-card h3 { font-size: 30px; }
            .stats-card { grid-template-columns: 1fr; border-radius: 22px; }
            .faq-item summary { font-size: 18px; padding: 15px 16px; }
            .faq-answer { font-size: 15px; padding: 0 16px 14px; }
            .course-cover { height: 180px; }
            .course-cover::before { font-size: 20px; }
            .course-cover::after { font-size: 26px; }
            .testimonials-sub { font-size: 16px; }
        }
    </style>
</head>
<body>
    <div class="promo">
        <div class="container promo-inner">
            <span>&nbsp;</span>
            <a href="#" class="promo-pill">&nbsp;</a>
        </div>
    </div>

    <header class="topbar">
        <div class="container topbar-inner">
            <div class="logo">BIMBEL ID</div>

            <nav class="menu">
                <a href="#" class="active">Beranda</a>
                <a href="#">Paket Belajar</a>
                <a href="#testimoni">Testimoni</a>
                <a href="#faq">FAQ</a>
            </nav>

            <div class="auth">
                <a class="btn" href="{{ route('login') }}">Masuk</a>
                <a class="btn primary" href="{{ route('register') }}">Daftar</a>
            </div>
        </div>
    </header>

    <section class="hero container">
        <div>
            <div class="hero-badge">Dipakai 200.000+ pejuang ASN di seluruh Indonesia</div>
            <h1>Satu Langkah <span>Menuju ASN.</span></h1>
            <p>Persiapan yang tepat dapat mengubah keraguan menjadi keyakinan.</p>
            <p>Dengan pendekatan belajar yang terstruktur, latihan yang relevan, dan bimbingan yang responsif, kamu dapat fokus pada hal yang benar-benar penting: meningkatkan peluang kelulusan.</p>
            <ul class="hero-points">
                <li>Materi ringkas dan terarah</li>
                <li>Simulasi CAT sesuai ujian asli</li>
                <li>Evaluasi progres belajar</li>
                <li>Mentor responsif saat kamu butuh bantuan</li>
            </ul>
            <p class="hero-strong">Mulai hari ini. Selangkah lebih siap dari peserta lainnya.</p>

            <div class="hero-actions">
                <a href="#" class="pill main">Mulai Belajar Sekarang</a>
                <a href="#" class="pill">Lihat Paket Kelas</a>
            </div>
        </div>

        <div class="hero-card" id="hero-slider">
            <div class="thumb">
                <div class="slider-track">
                    <div class="slide active">
                        <div class="slide-bg" data-parallax style="background-image: linear-gradient(145deg, #5cbaf4, #1f7fcd);"></div>
                        <div class="slide-overlay"></div>
                        <div class="slide-label">Try Out CAT Intensif</div>
                    </div>
                    <div class="slide">
                        <div class="slide-bg" data-parallax style="background-image: linear-gradient(145deg, #4fc3f7, #2563eb);"></div>
                        <div class="slide-overlay"></div>
                        <div class="slide-label">Live Class Interaktif</div>
                    </div>
                    <div class="slide">
                        <div class="slide-bg" data-parallax style="background-image: linear-gradient(145deg, #60a5fa, #0284c7);"></div>
                        <div class="slide-overlay"></div>
                        <div class="slide-label">Strategi Lolos Terstruktur</div>
                    </div>
                </div>
                <div class="slider-dots" id="slider-dots">
                    <button class="slider-dot active" type="button" aria-label="Slide 1"></button>
                    <button class="slider-dot" type="button" aria-label="Slide 2"></button>
                    <button class="slider-dot" type="button" aria-label="Slide 3"></button>
                </div>
            </div>
            <div class="body">
                <h3>Program Intensif SKD 2026</h3>
                <p>Targetkan nilai aman dengan jadwal belajar terarah, evaluasi progres rutin, dan bank soal terbaru.</p>
            </div>
        </div>
    </section>

    <section class="stats container">
        <div class="stats-card">
            <div class="stat">
                <div class="icon">YT</div>
                <div class="stat-value">1.75Jt+</div>
                <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat">
                <div class="icon">TT</div>
                <div class="stat-value">742K+</div>
                <div class="stat-label">Followers</div>
            </div>
            <div class="stat">
                <div class="icon">IG</div>
                <div class="stat-value">389K+</div>
                <div class="stat-label">Followers</div>
            </div>
            <div class="stat">
                <div class="icon">X</div>
                <div class="stat-value">198K+</div>
                <div class="stat-label">Followers</div>
            </div>
        </div>
        <p class="stats-note">Komunitas belajar aktif, mentor berpengalaman, dan ribuan kisah lolos setiap tahunnya.</p>
    </section>

    <section class="testimonials container" id="testimoni">
        <div class="testimonials-head">
            <h2 class="testimonials-title">Testimoni Peserta</h2>
            <p class="testimonials-sub">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.</p>
        </div>

        <div class="testimonials-grid">
            <article class="testimonial-card">
                <div class="testimonial-top">
                    <div class="avatar">AR</div>
                    <div class="who">
                        <strong>Lorem Arian</strong>
                        <span>Lorem ipsum alumni</span>
                    </div>
                </div>
                <div class="stars">★★★★★</div>
                <p class="testimonial-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse.</p>
            </article>

            <article class="testimonial-card">
                <div class="testimonial-top">
                    <div class="avatar">NS</div>
                    <div class="who">
                        <strong>Nadia S</strong>
                        <span>Dolor sit amet peserta</span>
                    </div>
                </div>
                <div class="stars">★★★★★</div>
                <p class="testimonial-text">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </article>

            <article class="testimonial-card">
                <div class="testimonial-top">
                    <div class="avatar">RK</div>
                    <div class="who">
                        <strong>Raka K</strong>
                        <span>Consectetur program</span>
                    </div>
                </div>
                <div class="stars">★★★★★</div>
                <p class="testimonial-text">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </article>
        </div>
    </section>

    <section class="faq container" id="faq">
        <h2 class="faq-title">Pertanyaan yang Sering Ditanyakan</h2>

        <div class="faq-grid">
            <details class="faq-item">
                <summary>Lorem ipsum dolor sit amet consectetur?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis, nisi neque pulvinar nunc, ut vulputate eros leo ac velit.</div>
            </details>
            <details class="faq-item">
                <summary>Consectetur adipiscing elit sed do eiusmod?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse potenti. Nulla facilisi. Curabitur non malesuada orci, a feugiat velit.</div>
            </details>

            <details class="faq-item">
                <summary>Tempor incididunt ut labore et dolore?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet volutpat sem. Donec ultricies finibus justo, nec luctus arcu fermentum quis.</div>
            </details>
            <details class="faq-item">
                <summary>Magna aliqua ut enim ad minim veniam?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas commodo convallis arcu, at accumsan nunc interdum sit amet.</div>
            </details>

            <details class="faq-item">
                <summary>Quis nostrud exercitation ullamco laboris?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</div>
            </details>
            <details class="faq-item">
                <summary>Nisi ut aliquip ex ea commodo consequat?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam semper justo eu dui vulputate, nec egestas magna volutpat.</div>
            </details>

            <details class="faq-item">
                <summary>Duis aute irure dolor in reprehenderit?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec mi at turpis commodo dictum. In ac nisl vel odio dictum congue.</div>
            </details>
            <details class="faq-item">
                <summary>In voluptate velit esse cillum dolore?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eu ex quis tortor tincidunt tristique vel vitae est.</div>
            </details>

            <details class="faq-item">
                <summary>Eu fugiat nulla pariatur excepteur sint?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eget venenatis turpis. Donec at ligula non odio feugiat commodo.</div>
            </details>
            <details class="faq-item">
                <summary>Occaecat cupidatat non proident sunt?</summary>
                <div class="faq-answer">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum vitae justo sapien. Mauris pulvinar, ipsum in interdum consequat, est magna viverra purus.</div>
            </details>
        </div>
    </section>

    <section class="package container">
        <h2 class="package-title">Paket Belajar</h2>

        <div class="package-tabs">
            <button class="package-tab active" type="button">Tryout</button>
            <button class="package-tab" type="button">Kelas Online</button>
            <button class="package-tab" type="button">Rekaman Kelas</button>
        </div>

        <div class="package-filter">
            <label for="program">Program</label>
            <select id="program" name="program">
                <option>UTBK</option>
                <option>CPNS</option>
                <option>PPPK</option>
            </select>
        </div>

        <div class="package-grid">
            <article class="course-card">
                <div class="course-cover"></div>
                <div class="course-body">
                    <h3 class="course-title">Lorem Ipsum Dolor Sit Amet 2026</h3>
                    <p class="course-sub"><strong>Lorem ipsum dolor sit amet</strong><br>Consectetur adipiscing elit sed do eiusmod tempor incididunt.</p>
                    <p class="course-meta"><strong>(Aktif hingga lorem ipsum selesai)</strong></p>
                    <ul class="course-list">
                        <li>✓ Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                        <li>✓ Sed do eiusmod tempor incididunt ut labore et dolore.</li>
                    </ul>
                    <div class="course-price">
                        <span class="badge-discount">52%</span>
                        <span class="old-price">Rp25.000</span>
                        <span class="new-price">Rp12.000</span>
                    </div>
                </div>
            </article>

            <article class="course-card">
                <div class="course-cover"></div>
                <div class="course-body">
                    <h3 class="course-title">Lorem Ipsum Fulltest Part 29</h3>
                    <p class="course-sub"><strong>Lorem ipsum dolor sit amet</strong><br>Ut enim ad minim veniam quis nostrud exercitation ullamco.</p>
                    <p class="course-meta"><strong>(Aktif hingga lorem ipsum selesai)</strong></p>
                    <ul class="course-list">
                        <li>✓ Duis aute irure dolor in reprehenderit in voluptate.</li>
                        <li>✓ Velit esse cillum dolore eu fugiat nulla pariatur.</li>
                    </ul>
                    <div class="course-price">
                        <span class="badge-discount">40%</span>
                        <span class="old-price">Rp35.000</span>
                        <span class="new-price">Rp21.000</span>
                    </div>
                </div>
            </article>

            <article class="course-card">
                <div class="course-cover"></div>
                <div class="course-body">
                    <h3 class="course-title">Lorem Bundling Persubtest 2026</h3>
                    <p class="course-sub"><strong>Lorem ipsum dolor sit amet</strong><br>Excepteur sint occaecat cupidatat non proident sunt in culpa.</p>
                    <p class="course-meta"><strong>(Aktif hingga lorem ipsum selesai)</strong></p>
                    <ul class="course-list">
                        <li>✓ Officia deserunt mollit anim id est laborum lorem.</li>
                        <li>✓ Integer nec odio praesent libero sed cursus ante.</li>
                    </ul>
                    <div class="course-price">
                        <span class="badge-discount">57%</span>
                        <span class="old-price">Rp59.000</span>
                        <span class="new-price">Rp25.000</span>
                    </div>
                </div>
            </article>
        </div>
    </section>

    <script>
        (function () {
            var slider = document.getElementById("hero-slider");
            if (!slider) return;

            var slides = slider.querySelectorAll(".slide");
            var dots = slider.querySelectorAll(".slider-dot");
            var current = 0;
            var timer;

            function showSlide(index) {
                slides[current].classList.remove("active");
                dots[current].classList.remove("active");
                current = (index + slides.length) % slides.length;
                slides[current].classList.add("active");
                dots[current].classList.add("active");
            }

            function startAutoplay() {
                timer = setInterval(function () {
                    showSlide(current + 1);
                }, 3200);
            }

            function resetAutoplay() {
                clearInterval(timer);
                startAutoplay();
            }

            dots.forEach(function (dot, index) {
                dot.addEventListener("click", function () {
                    showSlide(index);
                    resetAutoplay();
                });
            });

            var thumb = slider.querySelector(".thumb");
            thumb.addEventListener("mousemove", function (event) {
                var rect = thumb.getBoundingClientRect();
                var x = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
                var y = ((event.clientY - rect.top) / rect.height - 0.5) * 14;
                var activeBg = slider.querySelector(".slide.active [data-parallax]");
                if (activeBg) {
                    activeBg.style.transform = "scale(1.08) translate(" + (-x) + "px, " + (-y) + "px)";
                }
            });

            thumb.addEventListener("mouseleave", function () {
                var activeBg = slider.querySelector(".slide.active [data-parallax]");
                if (activeBg) {
                    activeBg.style.transform = "scale(1.06) translate(0, 0)";
                }
            });

            startAutoplay();
        })();
    </script>
</body>
</html>
