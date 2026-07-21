import { forwardRef, useImperativeHandle, useRef } from 'react'

const QuestionImageUploadField = forwardRef(function QuestionImageUploadField(
  { label, required, preview, existingImageUrl, onSelectFile, onClear, disabled, hideTrigger },
  ref,
) {
  const inputRef = useRef(null)
  const displayUrl = preview || existingImageUrl

  useImperativeHandle(ref, () => ({
    openPicker: () => inputRef.current?.click(),
  }))

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    if (file) onSelectFile(file)
    event.target.value = ''
  }

  return (
    <div className="admin-question-image-field">
      {displayUrl ? (
        <div className="admin-question-image-preview">
          <img src={displayUrl} alt={label} />
          <div className="admin-question-image-preview-actions">
            <button type="button" className="admin-outline-action" onClick={() => inputRef.current?.click()} disabled={disabled}>Ganti gambar</button>
            <button type="button" className="admin-question-option-remove" onClick={onClear} disabled={disabled} title="Hapus gambar" aria-label="Hapus gambar">🗑</button>
          </div>
        </div>
      ) : hideTrigger ? null : (
        <button
          type="button"
          className="admin-question-upload-box admin-question-upload-box-interactive"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <div className="admin-question-upload-icon" aria-hidden="true">☁</div>
          <strong>{label}{required ? <sup>*</sup> : null}</strong>
          <p>Format: JPG, PNG. Maks 2MB</p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="admin-question-image-input-hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  )
})

export default QuestionImageUploadField
