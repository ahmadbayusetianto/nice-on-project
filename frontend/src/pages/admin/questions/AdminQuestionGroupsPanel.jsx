import { useEffect, useState } from 'react'
import { createQuestionGroup, deleteQuestionGroup, fetchQuestionGroups, updateQuestionGroup } from '../../../api/adminQuestionsApi'
import PackageSearchSelect from './PackageSearchSelect'

export default function AdminQuestionGroupsPanel({ packages }) {
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [isSavingNew, setIsSavingNew] = useState(false)
  const [addError, setAddError] = useState(null)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [rowError, setRowError] = useState(null)
  const [busyGroupId, setBusyGroupId] = useState(null)

  useEffect(() => {
    if (!selectedPackageId) {
      setGroups([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setLoadError(null)
    setEditingGroupId(null)
    setRowError(null)
    setAddError(null)

    fetchQuestionGroups({ type: 'SKB', packageId: selectedPackageId })
      .then(({ ok, payload }) => {
        if (cancelled) return
        if (!ok) throw new Error(payload?.message || 'Gagal memuat grup soal.')
        setGroups(payload?.data ?? [])
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message)
          setGroups([])
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedPackageId])

  const handleAddGroup = async (event) => {
    event.preventDefault()
    const name = newGroupName.trim()
    if (!name || !selectedPackageId) return

    setIsSavingNew(true)
    setAddError(null)
    try {
      const payload = await createQuestionGroup({ package_id: Number(selectedPackageId), question_type: 'SKB', name })

      setGroups((current) => [...current, payload.data])
      setNewGroupName('')
    } catch (error) {
      setAddError(error.message)
    } finally {
      setIsSavingNew(false)
    }
  }

  const startEditing = (group) => {
    setEditingGroupId(group.id)
    setEditingName(group.name)
    setRowError(null)
  }

  const cancelEditing = () => {
    setEditingGroupId(null)
    setEditingName('')
  }

  const handleRename = async (group) => {
    const name = editingName.trim()
    if (!name) return

    setBusyGroupId(group.id)
    setRowError(null)
    try {
      const payload = await updateQuestionGroup(group.id, { name })

      setGroups((current) => current.map((item) => (item.id === group.id ? payload.data : item)))
      setEditingGroupId(null)
    } catch (error) {
      setRowError(error.message)
    } finally {
      setBusyGroupId(null)
    }
  }

  const handleDelete = async (group) => {
    if (!window.confirm(`Hapus grup "${group.name}"? Grup yang masih dipakai soal tidak akan bisa dihapus.`)) return

    setBusyGroupId(group.id)
    setRowError(null)
    try {
      await deleteQuestionGroup(group.id)

      setGroups((current) => current.filter((item) => item.id !== group.id))
    } catch (error) {
      setRowError(error.message)
    } finally {
      setBusyGroupId(null)
    }
  }

  return (
    <section className="admin-card admin-question-groups-card">
      <div className="admin-question-groups-intro">
        <div>
          <h3>Grup Soal SKB</h3>
          <p>Kelola grup soal SKB per paket. Grup SKD (TWK/TIU/TKP) sudah baku dan tidak perlu dikelola di sini.</p>
        </div>
      </div>

      <label className="admin-question-field admin-question-groups-package-field">
        <span>Paket <sup>*</sup></span>
        <PackageSearchSelect
          value={selectedPackageId}
          onChange={(pid) => setSelectedPackageId(pid)}
          packages={packages.filter((pkg) => pkg.tipe_paket !== 'bundling')}
          placeholder="Cari nama paket..."
        />
      </label>

      {!selectedPackageId ? (
        <div className="admin-question-groups-empty">Pilih paket untuk melihat/mengelola grup soalnya.</div>
      ) : (
        <>
          {loadError ? <div className="admin-user-message error">{loadError}</div> : null}
          {rowError ? <div className="admin-user-message error">{rowError}</div> : null}
          {isLoading ? <div className="admin-user-message">Memuat grup soal...</div> : null}

          <form className="admin-question-groups-add-row" onSubmit={handleAddGroup}>
            <input
              type="text"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="Nama grup baru, misal: Kompetensi Teknis"
              maxLength={100}
              disabled={isSavingNew}
            />
            <button type="submit" className="admin-primary-action" disabled={isSavingNew || !newGroupName.trim()}>
              {isSavingNew ? 'Menyimpan...' : '＋ Tambah Grup'}
            </button>
          </form>
          {addError ? <p className="admin-question-group-hint admin-question-group-hint-error">{addError}</p> : null}

          <table className="admin-question-groups-table">
            <thead>
              <tr>
                <th>Nama Grup</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>
                    {editingGroupId === group.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        maxLength={100}
                        disabled={busyGroupId === group.id}
                      />
                    ) : (
                      group.name
                    )}
                  </td>
                  <td>
                    {editingGroupId === group.id ? (
                      <div className="admin-question-groups-row-actions">
                        <button type="button" className="admin-outline-action" onClick={() => handleRename(group)} disabled={busyGroupId === group.id || !editingName.trim()}>Simpan</button>
                        <button type="button" className="admin-outline-action" onClick={cancelEditing} disabled={busyGroupId === group.id}>Batal</button>
                      </div>
                    ) : (
                      <div className="admin-question-groups-row-actions">
                        <button type="button" className="admin-outline-action" onClick={() => startEditing(group)} disabled={busyGroupId === group.id}>Ubah Nama</button>
                        <button type="button" className="admin-danger-action admin-question-groups-delete-button" onClick={() => handleDelete(group)} disabled={busyGroupId === group.id}>Hapus</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !groups.length ? (
                <tr>
                  <td colSpan={2} className="admin-question-groups-empty-row">Belum ada grup untuk paket ini.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
