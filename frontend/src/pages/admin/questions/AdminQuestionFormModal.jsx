import { useEffect, useRef, useState } from 'react'
import { fetchQuestionGroups, fetchRefPaketByBundle, fetchRefPaketByPid } from '../../../api/adminQuestionsApi'
import QuestionImageUploadField from '../../../components/shared/QuestionImageUploadField'
import PackageSearchSelect from './PackageSearchSelect'

export default function AdminQuestionFormModal({
  open,
  onCancel,
  onSubmit,
  form,
  onFieldChange,
  onOptionChange,
  packages,
  onAddOption,
  onSetCorrectOption,
  onResetForm,
  onQuestionImageChange,
  onQuestionImageClear,
  onOptionImageChange,
  onOptionImageClear,
  loading,
  error,
  title = 'Tambah Soal',
  submitLabel = 'Simpan Soal',
  helpText = 'Kelola soal CAT dengan opsi jawaban yang dapat ditambah atau dihapus secara dinamis.',
  mode = 'create',
}) {
  const [selectedBundlingId, setSelectedBundlingId] = useState('')
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const questionImageFieldRef = useRef(null)
  const [refPaketOptions, setRefPaketOptions] = useState([])

  // Edit mode: `form.package_id` is a ref_paket pid, so the matching Bundling
  // Paket (a tbl_paket row) can only be found by looking up that ref_paket
  // row's nama_bundle and matching it by name. Pre-migration questions whose
  // package_id doesn't resolve in ref_paket just leave both fields unset.
  useEffect(() => {
    if (!open) return

    if (!form.package_id) {
      setSelectedBundlingId('')
      return
    }

    let cancelled = false

    fetchRefPaketByPid(form.package_id)
      .then((payload) => {
        if (cancelled) return
        const row = payload?.data?.[0]
        if (!row) {
          setSelectedBundlingId('')
          return
        }
        setRefPaketOptions((current) => (current.some((item) => item.pid === row.pid) ? current : [...current, row]))
        const matchedBundle = packages.find((pkg) => pkg.name === row.type)
        setSelectedBundlingId(matchedBundle ? String(matchedBundle.pid) : '')
      })
      .catch(() => {
        if (!cancelled) setSelectedBundlingId('')
      })

    return () => { cancelled = true }
  }, [open])

  // Paket dropdown searches ref_paket, scoped to the selected Bundling
  // Paket's name (ref_paket.nama_bundle is a plain text match, not an FK).
  useEffect(() => {
    if (!open || !selectedBundlingId) {
      setRefPaketOptions([])
      return
    }

    const bundleName = packages.find((pkg) => String(pkg.pid) === String(selectedBundlingId))?.name
    if (!bundleName) {
      setRefPaketOptions([])
      return
    }

    let cancelled = false

    fetchRefPaketByBundle(bundleName)
      .then((payload) => {
        if (!cancelled) setRefPaketOptions(payload?.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setRefPaketOptions([])
      })

    return () => { cancelled = true }
  }, [open, selectedBundlingId])

  useEffect(() => {
    if (!open) return

    // SKB packages always have exactly one implicit group, auto-resolved
    // server-side — the admin never picks one, so there's nothing to fetch.
    if (form.question_type === 'SKB') {
      setGroups([])
      return
    }

    let cancelled = false
    setGroupsLoading(true)

    fetchQuestionGroups({ type: form.question_type })
      .then(({ ok, payload }) => {
        if (cancelled) return
        setGroups(ok ? (payload?.data ?? []) : [])
      })
      .catch(() => {
        if (!cancelled) setGroups([])
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false)
      })

    return () => { cancelled = true }
  }, [open, form.question_type])

  useEffect(() => {
    if (!open || groupsLoading) return

    const hasSelection = form.question_group !== '' && form.question_group !== null && form.question_group !== undefined
    const stillValid = hasSelection && groups.some((group) => String(group.id) === String(form.question_group))

    if (hasSelection && !stillValid) {
      onFieldChange('question_group', '')
      return
    }

    // SKD is locked to the 3 seeded groups, so default straight to the first
    // one (TWK) instead of making the admin pick every time.
    if (!hasSelection && form.question_type === 'SKD' && groups.length) {
      onFieldChange('question_group', groups[0].id)
    }
  }, [groups, groupsLoading, open, form.question_type])

  if (!open) return null

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const questionCount = String(form.question || '').length
  const informationCount = String(form.information || '').length
  const pembahasanCount = String(form.pembahasan || '').length
  const hasQuestionImage = Boolean(form.question_image_preview || form.existing_question_image_url)

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal admin-question-modal" role="dialog" aria-modal="true" aria-labelledby="adminQuestionTitle" onClick={(event) => event.stopPropagation()}>
        <div className="admin-question-modal-header">
          <div className="admin-question-title-block">
            <div className="admin-question-title-icon" aria-hidden="true">✎</div>
            <div className="admin-question-title-copy">
              <h3 id="adminQuestionTitle">{title}</h3>
              <p>{helpText}</p>
            </div>
          </div>
          <button type="button" className="admin-question-close" aria-label="Tutup form soal" onClick={onCancel} disabled={loading}>×</button>
        </div>

        {loading ? <div className="admin-package-form-loading">Memuat data soal...</div> : null}
        {error ? <div className="admin-package-form-error">{error}</div> : null}

        <form className="admin-question-form" id="adminQuestionForm" onSubmit={onSubmit}>
          <div className="admin-question-form-layout">
            <section className="admin-question-panel admin-question-panel-left">
              <div className="admin-question-panel-head">
                <div className="admin-question-panel-head-title">
                  <span className="admin-question-panel-head-icon" aria-hidden="true">i</span>
                  <div>
                  <h4>Informasi Soal</h4>
                  <p>Isi data utama soal sebelum menambahkan opsi jawaban.</p>
                  </div>
                </div>
              </div>

              <div className="admin-question-field-group">
                <div className="admin-question-field-row">
                  <label className="admin-question-field">
                    <span>Bundling Paket <sup>*</sup></span>
                    <select
                      value={selectedBundlingId}
                      onChange={(event) => {
                        setSelectedBundlingId(event.target.value)
                        onFieldChange('package_id', '')
                      }}
                      disabled={loading}
                    >
                      <option value="" disabled>Pilih bundling paket dahulu...</option>
                      {packages.map((pkg) => (
                        <option key={pkg.pid} value={pkg.pid}>{pkg.formasi ? `${pkg.name} - ${pkg.formasi}` : pkg.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-question-field">
                    <span>Paket <sup>*</sup></span>
                    <PackageSearchSelect
                      value={form.package_id}
                      onChange={(pid) => {
                        onFieldChange('package_id', pid)

                        const matched = refPaketOptions.find((item) => String(item.pid) === String(pid))
                        const nextType = matched?.program === 'SKB' ? 'SKB' : 'SKD'
                        onFieldChange('question_type', nextType)
                        onFieldChange('question_group', nextType === 'SKD' ? '' : null)
                      }}
                      packages={refPaketOptions}
                      disabled={loading || !selectedBundlingId}
                      placeholder={selectedBundlingId ? 'Cari nama paket...' : 'Pilih bundling paket dahulu...'}
                    />
                  </label>
                </div>

                <div className="admin-question-field-row">
                  <label className="admin-question-field">
                    <span>Tipe Soal <sup>*</sup></span>
                    <select value={form.question_type} onChange={() => {}} disabled>
                      <option value="SKD">SKD</option>
                      <option value="SKB">SKB</option>
                    </select>
                  </label>

                  {form.question_type === 'SKD' ? (
                    <label className="admin-question-field">
                      <span>Grup Soal <sup>*</sup></span>
                      <select
                        value={form.question_group}
                        onChange={(event) => onFieldChange('question_group', event.target.value ? Number(event.target.value) : '')}
                        disabled={loading || groupsLoading}
                      >
                        <option value="" disabled>Pilih grup...</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <label className="admin-question-field admin-question-field-full">
                  <span>Jenis Soal <sup>*</sup></span>
                  <div className="admin-question-jenis-toggle">
                    <button
                      type="button"
                      className={`admin-question-jenis-option${form.istext ? ' active' : ''}`}
                      onClick={() => onFieldChange('istext', true)}
                      disabled={loading}
                    >
                      <span aria-hidden="true">T</span>
                      <strong>Teks</strong>
                    </button>
                    <button
                      type="button"
                      className={`admin-question-jenis-option${!form.istext ? ' active' : ''}`}
                      onClick={() => onFieldChange('istext', false)}
                      disabled={loading}
                    >
                      <span aria-hidden="true">◫</span>
                      <strong>Gambar</strong>
                    </button>
                  </div>
                </label>

                {form.istext ? (
                  <label className="admin-question-field admin-question-field-full">
                    <span>Tulis pertanyaan <sup>*</sup></span>
                    <div className="admin-question-editor-shell">
                      <div className="admin-question-editor-toolbar">
                        <span aria-hidden="true">B</span>
                        <span aria-hidden="true">I</span>
                        <span aria-hidden="true">U</span>
                        <span aria-hidden="true">≡</span>
                        <span aria-hidden="true">≣</span>
                        <span aria-hidden="true">↗</span>
                        <button
                          type="button"
                          className="admin-question-editor-toolbar-action"
                          onClick={() => questionImageFieldRef.current?.openPicker()}
                          disabled={loading}
                          title="Tambah gambar (opsional)"
                          aria-label="Tambah gambar (opsional)"
                        >
                          ▢
                        </button>
                        <span aria-hidden="true">Tx</span>
                      </div>
                      <textarea
                        value={form.question}
                        onChange={(event) => onFieldChange('question', event.target.value)}
                        placeholder="Ketik atau tempel pertanyaan di sini..."
                        disabled={loading}
                        rows={7}
                      />
                      <div className="admin-question-counter">{questionCount}/2000</div>
                      {hasQuestionImage ? (
                        <div className="admin-question-editor-image-slot">
                          <QuestionImageUploadField
                            ref={questionImageFieldRef}
                            label="Tambah gambar (opsional)"
                            preview={form.question_image_preview}
                            existingImageUrl={form.existing_question_image_url}
                            onSelectFile={onQuestionImageChange}
                            onClear={onQuestionImageClear}
                            disabled={loading}
                            hideTrigger
                          />
                        </div>
                      ) : (
                        <QuestionImageUploadField
                          ref={questionImageFieldRef}
                          label="Tambah gambar (opsional)"
                          preview={form.question_image_preview}
                          existingImageUrl={form.existing_question_image_url}
                          onSelectFile={onQuestionImageChange}
                          onClear={onQuestionImageClear}
                          disabled={loading}
                          hideTrigger
                        />
                      )}
                    </div>
                  </label>
                ) : (
                  <label className="admin-question-field admin-question-field-full">
                    <span>Gambar Soal <sup>*</sup></span>
                    <QuestionImageUploadField
                      label="Tambah gambar soal"
                      required
                      preview={form.question_image_preview}
                      existingImageUrl={form.existing_question_image_url}
                      onSelectFile={onQuestionImageChange}
                      onClear={onQuestionImageClear}
                      disabled={loading}
                    />
                  </label>
                )}

                <label className="admin-question-field admin-question-field-full">
                  <span>Informasi Tambahan (Opsional)</span>
                  <div className="admin-question-editor-shell compact">
                    <textarea
                      value={form.information}
                      onChange={(event) => onFieldChange('information', event.target.value)}
                      placeholder="Contoh: sumber, tingkat kesulitan, konteks, dll."
                      disabled={loading}
                      rows={4}
                    />
                    <div className="admin-question-counter">{informationCount}/500</div>
                  </div>
                </label>

                <div className="admin-question-status-row">
                  <span>Status Soal</span>
                  <div className="admin-question-status-toggle">
                    <button type="button" className="active" disabled={loading}>
                      <span className="admin-question-status-dot" />
                      Aktif
                    </button>
                    <button type="button" disabled={loading}>
                      <span className="admin-question-status-dot" />
                      Nonaktif
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-question-panel admin-question-panel-right">
                <div className="admin-question-panel-head admin-question-panel-head-space">
                  <div>
                    <h4>Opsi Jawaban</h4>
                    <p>
                      {Number(form.question_group) === 3
                        ? 'Minimal 1 opsi, maksimal 5 opsi (A-E), isi nilai 1-5 untuk tiap opsi.'
                        : 'Minimal 1 opsi, maksimal 5 opsi (A-E), pilih 1 jawaban benar.'}
                    </p>
                  </div>
                </div>

              <div className="admin-question-option-info" role="note" aria-label="Informasi opsi jawaban">
                <span className="admin-question-option-info-icon" aria-hidden="true">💡</span>
                <div>
                  <strong>{Number(form.question_group) === 3 ? 'Isi nilai tiap opsi' : 'Pilih jawaban yang benar'}</strong>
                  <p>
                    {Number(form.question_group) === 3
                      ? 'Setiap opsi TKP tidak ada benar/salah, isi bobot nilai 1-5 sesuai kesesuaian jawaban.'
                      : 'Pilih satu opsi yang paling tepat sebagai jawaban benar.'}
                  </p>
                </div>
              </div>

              <div className="admin-question-options-list">
                {form.options.map((option, index) => (
                  <div className={`admin-question-option-row${form.istext ? ' rich' : ' image'}`} key={option.key}>
                    <div className="admin-question-option-badge">{optionLabels[index] || index + 1}</div>

                    {form.istext ? (
                      <div className="admin-question-option-editor">
                        <div className="admin-question-option-toolbar" aria-hidden="true">
                          <span>B</span>
                          <span>I</span>
                          <span>U</span>
                          <span>≡</span>
                          <span>≣</span>
                        </div>
                        <textarea
                          value={option.choise}
                          onChange={(event) => onOptionChange(index, 'choise', event.target.value)}
                          placeholder={`Tulis opsi jawaban ${optionLabels[index] || index + 1}`}
                          disabled={loading}
                          rows={2}
                        />
                      </div>
                    ) : (
                      <QuestionImageUploadField
                        label={`Tambah gambar opsi ${optionLabels[index] || index + 1}`}
                        required
                        preview={option.image_preview}
                        existingImageUrl={option.existing_image_url}
                        onSelectFile={(file) => onOptionImageChange(index, file)}
                        onClear={() => onOptionImageClear(index)}
                        disabled={loading}
                      />
                    )}

                    <div className="admin-question-option-side">
                      {Number(form.question_group) === 3 ? (
                        <label className="admin-question-option-tkp-value">
                          <span>Nilai</span>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={option.nilai_tkp}
                            onChange={(event) => onOptionChange(index, 'nilai_tkp', event.target.value)}
                            placeholder="1-5"
                            disabled={loading}
                          />
                        </label>
                      ) : null}

                      {Number(form.question_group) === 3 ? null : (
                        <label className={`admin-question-option-correct${option.answer ? ' active' : ''}`}>
                          <input
                            type="radio"
                            name="correctOption"
                            checked={option.answer}
                            onChange={() => onSetCorrectOption(index)}
                            disabled={loading}
                          />
                          <span className="sr-only">Jawaban benar</span>
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <label className="admin-question-field admin-question-field-full">
                <span>Pembahasan (Opsional)</span>
                <div className="admin-question-editor-shell compact">
                  <div className="admin-question-editor-toolbar" aria-hidden="true">
                    <span>B</span>
                    <span>I</span>
                    <span>U</span>
                    <span>≡</span>
                    <span>≣</span>
                    <span>↗</span>
                    <span>▢</span>
                    <span>&lt;/&gt;</span>
                  </div>
                  <textarea
                    value={form.pembahasan}
                    onChange={(event) => onFieldChange('pembahasan', event.target.value)}
                    placeholder="Tulis pembahasan soal..."
                    disabled={loading}
                    rows={4}
                  />
                  <div className="admin-question-counter">{pembahasanCount}/2000</div>
                </div>
              </label>
            </section>
          </div>

          <div className="admin-question-modal-footer">
            <button type="button" className="admin-outline-action" onClick={() => onResetForm?.()} disabled={loading}>Reset</button>
            <button type="button" className="admin-modal-button secondary" onClick={onCancel} disabled={loading}>Batal</button>
            <button type="submit" className="admin-modal-button secondary admin-question-submit-alt" disabled={loading} value="save-add">Simpan & Tambah Lagi</button>
            <button type="submit" className="admin-modal-button primary" disabled={loading} value="save">{loading ? 'Menyimpan...' : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
