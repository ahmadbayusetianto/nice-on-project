import { useState } from 'react'

export default function PackageSearchSelect({ value, onChange, packages, disabled, placeholder = 'Cari nama paket...' }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const selectedPackage = packages.find((pkg) => String(pkg.pid) === String(value)) || null

  const filteredPackages = packages.filter((pkg) => {
    const search = query.trim().toLowerCase()
    if (!search) return true
    return [pkg.name, pkg.program, pkg.type]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(search))
  })

  return (
    <div
      className={`admin-package-combobox${isOpen ? ' open' : ''}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false)
          setQuery('')
        }
      }}
    >
      <input
        type="text"
        value={isOpen ? query : (selectedPackage?.name ?? '')}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {isOpen ? (
        <div className="admin-package-combobox-menu" role="listbox">
          {filteredPackages.length ? filteredPackages.map((pkg) => (
            <button
              type="button"
              key={pkg.pid}
              className={`admin-package-combobox-option${String(pkg.pid) === String(value) ? ' active' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault()
                onChange(pkg.pid)
                setIsOpen(false)
                setQuery('')
              }}
            >
              <strong>{pkg.name}</strong>
              <span>{[pkg.program, pkg.type].filter(Boolean).join(' · ')}</span>
            </button>
          )) : (
            <div className="admin-package-combobox-empty">Paket tidak ditemukan.</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
