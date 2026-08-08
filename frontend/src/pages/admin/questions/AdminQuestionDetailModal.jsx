import { useState } from 'react'
import RichText from '../../../components/shared/RichText'
import { formatAdminDate } from '../../../utils/format'
import { formatQuestionTypeLabel } from '../../../utils/questionLabels'

export default function AdminQuestionDetailModal({ open, question, onCancel, onEdit, onDelete, onRestore }) {
  const [lightboxImage, setLightboxImage] = useState(null)

  if (!open || !question) return null

  const openImageLightbox = (src, alt) => (event) => {
    event.stopPropagation()
    setLightboxImage({ src, alt })
  }

  const closeImageLightbox = (event) => {
    event.stopPropagation()
    setLightboxImage(null)
  }

  const isTrashed = Boolean(question.deleted_at)
  const isTkpQuestion = Number(question.question_group) === 3
  const detailCards = [
    { label: 'Grup Soal', value: question.question_group_label, tone: 'orange', icon: '📁' },
    { label: 'Tipe Soal', value: formatQuestionTypeLabel(question.question_type), tone: 'blue', icon: '🎯' },
    { label: 'Jenis Soal', value: question.istext ? 'Teks' : 'Gambar', tone: 'green', icon: 'T' },
    { label: 'Jumlah Opsi', value: String(question.options_count || (question.options || []).length || 0), tone: 'purple', icon: '≣' },
  ]

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="admin-modal admin-question-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adminQuestionDetailTitle"
        onClick={(event) => event.stopPropagation()}
        >
        <div className="admin-question-detail-header">
          <div className="admin-question-detail-title-block">
            <div>
              <h3 id="adminQuestionDetailTitle">Detail Soal</h3>
              <p>Lihat detail informasi soal secara lengkap.</p>
            </div>
          </div>
          <div className="admin-question-detail-header-actions">
            <button type="button" className="admin-outline-action admin-question-detail-edit" onClick={onEdit}>✎ Edit Soal</button>
            {isTrashed ? (
              <button type="button" className="admin-primary-action admin-question-detail-restore" onClick={onRestore}>↺ Pulihkan</button>
            ) : (
              <button type="button" className="admin-danger-action admin-question-detail-delete" onClick={onDelete}>🗑 Hapus Soal</button>
            )}
            <button type="button" className="admin-question-close" aria-label="Tutup detail soal" onClick={onCancel}>×</button>
          </div>
        </div>
        <hr className="admin-question-detail-divider" />

        <div className="admin-question-detail-grid">
          {detailCards.map((card) => (
            <article className={`admin-question-detail-card ${card.tone}`} key={card.label}>
              <div className="admin-question-detail-card-icon" aria-hidden="true">{card.icon}</div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>

        <div className="admin-question-detail-body">
          <div className="admin-question-detail-column left">
            <section className="admin-question-detail-section info-card">
              <div className="admin-question-detail-section-head">
                <span className="admin-question-detail-section-icon" aria-hidden="true">i</span>
                <h4>Informasi Tambahan</h4>
              </div>
              <p>{question.information || 'Tidak ada informasi tambahan.'}</p>
            </section>

            <section className="admin-question-detail-section question-card">
              <div className="admin-question-detail-section-head">
                <span className="admin-question-detail-section-icon question" aria-hidden="true">?</span>
                <h4>Pertanyaan</h4>
              </div>
              {question.image_url ? (
                <button
                  type="button"
                  className="admin-question-detail-image-trigger"
                  onClick={openImageLightbox(question.image_url, 'Gambar soal')}
                  title="Klik untuk memperbesar"
                >
                  <img className="admin-question-detail-image" src={question.image_url} alt="Gambar soal" />
                </button>
              ) : null}
              {question.istext ? (
                <p className="admin-question-detail-question"><RichText text={question.question} /></p>
              ) : null}
              {!question.istext && !question.image_url ? (
                <p className="admin-question-detail-question">Gambar soal belum diunggah.</p>
              ) : null}
            </section>

            <section className="admin-question-detail-section explanation-card">
              <div className="admin-question-detail-section-head">
                <span className="admin-question-detail-section-icon explanation" aria-hidden="true">📖</span>
                <h4>Pembahasan</h4>
              </div>
              {question.pembahasan_image_url ? (
                <button
                  type="button"
                  className="admin-question-detail-image-trigger"
                  onClick={openImageLightbox(question.pembahasan_image_url, 'Gambar pembahasan')}
                  title="Klik untuk memperbesar"
                >
                  <img className="admin-question-detail-image" src={question.pembahasan_image_url} alt="Gambar pembahasan" />
                </button>
              ) : null}
              <p><RichText text={question.pembahasan || 'Tidak ada pembahasan.'} /></p>
            </section>
          </div>

          <div className="admin-question-detail-column right">
            <section className="admin-question-detail-section options-card admin-question-detail-section-options">
              <div className="admin-question-detail-section-head">
                <span className="admin-question-detail-section-icon options" aria-hidden="true">≣</span>
                <h4>Opsi Jawaban</h4>
              </div>
              <div className="admin-question-detail-options wide">
                {Array.from({ length: 5 }, (_, index) => {
                  const option = (question.options || [])[index] ?? null
                  const letter = String.fromCharCode(65 + index)

                  return (
                    <div
                      className={`admin-question-detail-option wide${!isTkpQuestion && option?.answer ? ' correct' : ''}${option ? '' : ' placeholder'}`}
                      key={option?.id ?? `empty-${index}`}
                    >
                      <span className="admin-question-detail-option-badge">{letter}</span>
                      <div className="admin-question-detail-option-copy wide">
                        {option?.image_url ? (
                          <button
                            type="button"
                            className="admin-question-detail-option-image-trigger"
                            onClick={openImageLightbox(option.image_url, `Gambar opsi ${letter}`)}
                            title="Klik untuk memperbesar"
                          >
                            <img className="admin-question-detail-option-image" src={option.image_url} alt={`Gambar opsi ${letter}`} />
                          </button>
                        ) : null}
                        {!option || option.istext ? (
                          <strong><RichText text={option?.choise || 'Belum ada opsi.'} /></strong>
                        ) : null}
                      </div>
                      {isTkpQuestion ? (
                        option ? (
                          <span className="admin-question-detail-correct tkp" title="Nilai TKP" aria-label="Nilai TKP">{option.nilai_tkp ?? '-'}</span>
                        ) : null
                      ) : option?.answer ? (
                        <span className="admin-question-detail-correct success" title="Jawaban benar" aria-label="Jawaban benar">✓</span>
                      ) : (
                        <span className="admin-question-detail-correct neutral" title="Bukan jawaban benar" aria-label="Bukan jawaban benar">○</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>

        <hr className="admin-question-detail-footer-divider" />

        <div className="admin-question-detail-footer">
          <div className="admin-question-detail-footer-meta">
            <article className="admin-question-detail-footer-card">
              <span>Dibuat oleh</span>
              <strong>{question.created_by_label || question.created_by_name || 'Admin'}</strong>
            </article>
            <article className="admin-question-detail-footer-card">
              <span>Dibuat pada</span>
              <strong>{formatAdminDate(question.created_at, { hour: false })}</strong>
            </article>
          </div>
          <button type="button" className="admin-modal-button secondary" onClick={onCancel}>Tutup</button>
        </div>
      </div>

      {lightboxImage ? (
        <div className="admin-image-lightbox-backdrop" role="presentation" onClick={closeImageLightbox}>
          <button type="button" className="admin-image-lightbox-close" aria-label="Tutup pratinjau gambar" onClick={closeImageLightbox}>×</button>
          <img className="admin-image-lightbox-image" src={lightboxImage.src} alt={lightboxImage.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </div>
  )
}
