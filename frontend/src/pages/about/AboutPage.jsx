import { Link } from 'react-router-dom'
import niceonImage from '../../../../niceon.png'
import './AboutPage.css'

const MISI_ITEMS = [
  'Menyediakan materi pembelajaran yang relevan dan sesuai dengan kebutuhan seleksi CPNS formasi Dosen dan Laboran.',
  'Memberikan pendampingan yang sistematis dalam menghadapi SKD, SKB CAT, Microteaching, dan Wawancara.',
  'Menyediakan layanan pembelajaran yang terjangkau, fleksibel, dan mudah diakses oleh peserta dari seluruh Indonesia.',
]

export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="about-topbar">
        <div className="about-container about-topbar-inner">
          <Link to="/" className="about-logo">
            <img src={niceonImage} alt="Nice On" className="about-logo-image" />
          </Link>
          <Link to="/" className="about-back-link">← Kembali ke Beranda</Link>
        </div>
      </header>

      <section className="about-hero about-container">
        <div className="about-kicker">TENTANG KAMI</div>
        <h1 className="about-heading">Mengenal Nice On</h1>
        <p className="about-subtitle">
          Nice On adalah bimbingan belajar CPNS yang fokus mendampingi calon ASN formasi Dosen dan Laboran
          mempersiapkan diri secara akademik, kompetitif, dan profesional di setiap tahapan seleksi.
        </p>
      </section>

      <section className="about-content about-container">
        <div className="about-grid">
          <article className="about-card about-visi-card">
            <div className="about-card-label">VISI</div>
            <p>
              Menjadi bimbingan belajar CPNS terpercaya yang fokus mendampingi calon ASN formasi Dosen dan
              Laboran dalam mempersiapkan diri secara akademik, kompetitif, dan profesional untuk meraih
              kelulusan pada setiap tahapan seleksi CPNS.
            </p>
          </article>

          <article className="about-card about-misi-card">
            <div className="about-card-label">MISI</div>
            <ol className="about-misi-list">
              {MISI_ITEMS.map((item, index) => (
                <li key={item} className="about-misi-item">
                  <span className="about-misi-number">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <footer className="about-footer">
        <div className="about-container about-footer-inner">
          <div className="about-footer-copy">© {new Date().getFullYear()} Nice On. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
