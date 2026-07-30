import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchAdminPackages } from '../../../api/adminPackagesApi'
import {
  deleteQuestion,
  fetchQuestionDetail,
  fetchQuestions,
  fetchSandboxPaket,
  restoreQuestion,
  saveQuestion,
  startSandboxTryout,
} from '../../../api/adminQuestionsApi'
import AdminBrandBlock from '../../../components/layout/AdminBrandBlock'
import AdminLogoutModal from '../../../components/layout/AdminLogoutModal'
import AdminQuestionMenu from '../../../components/layout/AdminQuestionMenu'
import AdminSystemMenu from '../../../components/layout/AdminSystemMenu'
import AdminTopbar from '../../../components/layout/AdminTopbar'
import AdminUserMenu from '../../../components/layout/AdminUserMenu'
import { getFriendlyFetchError } from '../../../utils/fetchError'
import { PAGE_SIZE_OPTIONS } from '../../../utils/format'
import { formatQuestionGroupLabel, formatQuestionTypeLabel } from '../../../utils/questionLabels'
import { clearAuthUser, readStoredAdminSidebarState, readStoredUser, storeAdminSidebarState, storeSandboxAdminMode } from '../../../utils/storage'
import AdminQuestionDetailModal from './AdminQuestionDetailModal'
import AdminQuestionFormModal from './AdminQuestionFormModal'
import AdminQuestionGroupsPanel from './AdminQuestionGroupsPanel'

const QUESTION_IMAGE_MAX_BYTES = 2 * 1024 * 1024
const QUESTION_IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png']

function createQuestionOptionForm(index = 0, option = {}) {
  return {
    key: option.id ?? `option-${Date.now()}-${index}`,
    choise: option.choise ?? '',
    answer: Boolean(option.answer),
    istext: option.istext !== undefined ? Boolean(option.istext) : true,
    nilai_tkp: option.nilai_tkp !== undefined && option.nilai_tkp !== null ? String(option.nilai_tkp) : '',
    image: null,
    image_preview: null,
    existing_image_path: option.image_path ?? null,
    existing_image_url: option.image_url ?? null,
  }
}

function createQuestionFormFromDetail(detail = {}) {
  const normalizedType = String(detail.question_type ?? 'SKD').toUpperCase() === 'SINGLE'
    ? 'SKD'
    : String(detail.question_type ?? 'SKD').toUpperCase() === 'SKB'
      ? 'SKB'
      : 'SKD'

  const options = Array.isArray(detail.options) && detail.options.length
    ? detail.options.map((option, index) => createQuestionOptionForm(index, option))
    : [
      createQuestionOptionForm(0, { answer: true }),
      createQuestionOptionForm(1),
      createQuestionOptionForm(2),
      createQuestionOptionForm(3),
      createQuestionOptionForm(4),
    ]

  while (options.length < 5) {
    options.push(createQuestionOptionForm(options.length, { answer: options.length === 0 }))
  }

  if (!options.some((option) => option.answer) && options.length) {
    options[0].answer = true
  }

  return {
    question: detail.question ?? '',
    question_type: normalizedType,
    question_group: detail.question_group ? Number(detail.question_group) : '',
    package_id: detail.package_id ?? '',
    istext: detail.istext !== undefined ? Boolean(detail.istext) : true,
    options_istext: options.length ? Boolean(options[0].istext) : true,
    information: detail.information ?? '',
    pembahasan: detail.pembahasan ?? '',
    question_image: null,
    question_image_preview: null,
    existing_question_image_path: detail.image_path ?? null,
    existing_question_image_url: detail.image_url ?? null,
    options,
  }
}

function validateQuestionImageFile(file) {
  if (!file) return 'File gambar tidak valid.'
  if (!QUESTION_IMAGE_ACCEPTED_TYPES.includes(file.type)) return 'Format gambar harus JPG atau PNG.'
  if (file.size > QUESTION_IMAGE_MAX_BYTES) return 'Ukuran gambar maksimal 2MB.'
  return null
}

function revokeQuestionFormPreviews(form) {
  if (form?.question_image_preview) URL.revokeObjectURL(form.question_image_preview)
  form?.options?.forEach((option) => {
    if (option.image_preview) URL.revokeObjectURL(option.image_preview)
  })
}

export default function AdminQuestionManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredAdminSidebarState())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [questionRows, setQuestionRows] = useState([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [questionError, setQuestionError] = useState(null)
  const [questionSearch, setQuestionSearch] = useState('')
  const [selectedQuestionGroup, setSelectedQuestionGroup] = useState('Semua Grup')
  const [selectedQuestionType, setSelectedQuestionType] = useState('Semua Tipe')
  const [selectedQuestionStatus, setSelectedQuestionStatus] = useState('Aktif')
  const [questionCurrentPage, setQuestionCurrentPage] = useState(1)
  const [questionPageSize, setQuestionPageSize] = useState(10)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showQuestionDetailModal, setShowQuestionDetailModal] = useState(false)
  const [questionDetail, setQuestionDetail] = useState(null)
  const [questionModalMode, setQuestionModalMode] = useState('create')
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [questionSubmitError, setQuestionSubmitError] = useState(null)
  const [questionSubmitSuccess, setQuestionSubmitSuccess] = useState(null)
  const [isSavingQuestion, setIsSavingQuestion] = useState(false)
  const [questionForm, setQuestionForm] = useState(() => createQuestionFormFromDetail())
  const [packageRows, setPackageRows] = useState([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)
  const [packageError, setPackageError] = useState(null)
  const [packageSearch, setPackageSearch] = useState('')
  const [sandboxTryoutType, setSandboxTryoutType] = useState('SKD')
  const [startingSandboxPackageId, setStartingSandboxPackageId] = useState(null)
  const [sandboxStartError, setSandboxStartError] = useState(null)
  const [sandboxPaketRows, setSandboxPaketRows] = useState([])
  const [isLoadingSandboxPaket, setIsLoadingSandboxPaket] = useState(false)
  const [sandboxPaketError, setSandboxPaketError] = useState(null)
  const questionSuccessTimerRef = useRef(null)
  const storedUser = readStoredUser()
  const user = location.state?.user ?? storedUser

  if (!user || Number(user?.is_admin ?? 0) !== 1) {
    return <Navigate to="/login" replace state={{ from: '/dashboard-admin/questions' }} />
  }

  const currentPath = location.pathname
  const currentSearchParams = new URLSearchParams(location.search)
  const activeAdminTabParam = currentSearchParams.get('tab')
  const activeAdminTab = activeAdminTabParam === 'tryout' ? 'tryout' : activeAdminTabParam === 'groups' ? 'groups' : 'questions'
  const displayName = user?.email?.split('@')?.[0] || 'Admin'
  const currentDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase())

  const visibleSandboxPackages = sandboxPaketRows.filter((row) => {
    if (String(row.program || '').toUpperCase() !== sandboxTryoutType) return false

    const search = packageSearch.trim().toLowerCase()
    if (!search) return true

    return [row.name, row.program, row.type]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })

  const adminMainMenu = [
    { label: 'Dashboard', href: '/dashboard-admin' },
    { label: 'User', href: '/dashboard-admin/users' },
    { label: 'Paket', href: '/dashboard-admin/packages' },
    { label: 'Materi', href: '/dashboard-admin/materials' },
    { label: 'Transaksi', href: '/dashboard-admin/transactions' },
    { label: 'Konten', href: '#' },
    { label: 'Laporan', href: '#' },
  ]

  const questionSummaryCards = [
    { label: 'Total Soal', value: String(questionRows.filter((row) => !row.deleted_at).length), delta: 'Soal aktif', accent: 'blue', icon: '📝' },
    { label: 'TWK', value: String(questionRows.filter((row) => !row.deleted_at && Number(row.question_group) === 1).length), delta: 'Grup 1', accent: 'green', icon: '🏛️' },
    { label: 'TIU', value: String(questionRows.filter((row) => !row.deleted_at && Number(row.question_group) === 2).length), delta: 'Grup 2', accent: 'purple', icon: '🧠' },
    { label: 'TKP', value: String(questionRows.filter((row) => !row.deleted_at && Number(row.question_group) === 3).length), delta: 'Grup 3', accent: 'orange', icon: '🤝' },
  ]

  const tryoutSummaryCards = [
    { label: 'Total Paket', value: String(sandboxPaketRows.length), delta: 'Siap sandbox', accent: 'blue', icon: '📦' },
    { label: 'SKD', value: String(sandboxPaketRows.filter((row) => String(row.program || '').toUpperCase() === 'SKD').length), delta: 'Tipe SKD', accent: 'green', icon: '🇮🇩' },
    { label: 'SKB', value: String(sandboxPaketRows.filter((row) => String(row.program || '').toUpperCase() === 'SKB').length), delta: 'Tipe SKB', accent: 'purple', icon: '🧾' },
    { label: 'Draft Session', value: 'Sandbox', delta: 'Tidak masuk statistik', accent: 'orange', icon: '🧪' },
  ]

  const loadQuestions = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingQuestions(true)
    }

    setQuestionError(null)

    try {
      const payload = await fetchQuestions({
        search: questionSearch.trim(),
        group: selectedQuestionGroup,
        type: selectedQuestionType,
        includeTrashed: selectedQuestionStatus !== 'Aktif',
      })

      if (!cancelled()) {
        setQuestionRows(Array.isArray(payload?.data) ? payload.data : [])
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data soal gagal dimuat.')
        setQuestionError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingQuestions(false)
      }
    }
  }

  const loadSandboxPackages = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingPackages(true)
    }

    setPackageError(null)

    try {
      const payload = await fetchAdminPackages()

      if (!cancelled()) {
        setPackageRows(Array.isArray(payload?.data) ? payload.data : [])
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data paket gagal dimuat.')
        setPackageError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingPackages(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadQuestions({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [questionSearch, selectedQuestionGroup, selectedQuestionType, selectedQuestionStatus])

  useEffect(() => {
    let cancelled = false

    void loadSandboxPackages({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [])

  const loadSandboxPaket = async ({ cancelled = () => false, showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoadingSandboxPaket(true)
    }

    setSandboxPaketError(null)

    try {
      const payload = await fetchSandboxPaket()

      if (!cancelled()) {
        setSandboxPaketRows(Array.isArray(payload?.data) ? payload.data : [])
      }
    } catch (error) {
      if (!cancelled()) {
        const message = getFriendlyFetchError(error, 'Data paket sandbox gagal dimuat.')
        setSandboxPaketError(message.includes('<!DOCTYPE') ? 'Backend mengembalikan halaman HTML, periksa koneksi database/server.' : message)
      }
    } finally {
      if (showLoading && !cancelled()) {
        setIsLoadingSandboxPaket(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    void loadSandboxPaket({ cancelled: () => cancelled, showLoading: true })

    return () => {
      cancelled = true
    }
  }, [])

  const openAddQuestionModal = () => {
    if (questionSuccessTimerRef.current) {
      window.clearTimeout(questionSuccessTimerRef.current)
      questionSuccessTimerRef.current = null
    }

    setQuestionModalMode('create')
    setEditingQuestionId(null)
    setQuestionSubmitError(null)
    setQuestionSubmitSuccess(null)
    setQuestionForm((current) => {
      revokeQuestionFormPreviews(current)
      return createQuestionFormFromDetail({
        question_group: selectedQuestionGroup !== 'Semua Grup' ? Number(selectedQuestionGroup) : 1,
        question_type: 'SKD',
        istext: true,
      })
    })
    setShowQuestionModal(true)
  }

  const resetQuestionForm = () => {
    setQuestionForm((current) => {
      revokeQuestionFormPreviews(current)
      return createQuestionFormFromDetail({
        question_group: Number(current.question_group) || (selectedQuestionGroup !== 'Semua Grup' ? Number(selectedQuestionGroup) : 1),
        question_type: 'SKD',
        istext: true,
      })
    })
    setQuestionSubmitError(null)
  }

  useEffect(() => {
    if (!location.state?.openQuestionModal) return

    openAddQuestionModal()
    navigate(location.pathname, { replace: true, state: { user } })
  }, [location.pathname, location.state, navigate, user])

  const openEditQuestionModal = async (row) => {
    if (questionSuccessTimerRef.current) {
      window.clearTimeout(questionSuccessTimerRef.current)
      questionSuccessTimerRef.current = null
    }

    setQuestionModalMode('edit')
    setEditingQuestionId(row?.id ?? null)
    setQuestionSubmitError(null)
    setQuestionSubmitSuccess(null)
    setQuestionForm((current) => {
      revokeQuestionFormPreviews(current)
      return createQuestionFormFromDetail(row ?? {})
    })
    setShowQuestionModal(true)

    try {
      const payload = await fetchQuestionDetail(row?.id)

      setQuestionForm((current) => {
        revokeQuestionFormPreviews(current)
        return createQuestionFormFromDetail(payload?.data ?? {})
      })
    } catch {
      // Keep modal usable even if detail fetch fails.
    }
  }

  const openQuestionDetailModal = (row) => {
    setQuestionDetail(row)
    setShowQuestionDetailModal(true)
  }

  const closeQuestionModal = () => {
    if (isSavingQuestion) return

    if (questionSuccessTimerRef.current) {
      window.clearTimeout(questionSuccessTimerRef.current)
      questionSuccessTimerRef.current = null
    }

    setShowQuestionModal(false)
    setQuestionSubmitError(null)
    setQuestionSubmitSuccess(null)
  }

  const handleQuestionFieldChange = (field, value) => {
    setQuestionForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleQuestionOptionChange = (index, field, value) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (
        optionIndex === index ? { ...option, [field]: value } : option
      )),
    }))
  }

  const handleQuestionImageChange = (file) => {
    const validationError = validateQuestionImageFile(file)
    if (validationError) {
      setQuestionSubmitError(validationError)
      return
    }

    setQuestionForm((current) => {
      if (current.question_image_preview) {
        URL.revokeObjectURL(current.question_image_preview)
      }
      return {
        ...current,
        question_image: file,
        question_image_preview: URL.createObjectURL(file),
      }
    })
  }

  const handleQuestionImageClear = () => {
    setQuestionForm((current) => {
      if (current.question_image_preview) {
        URL.revokeObjectURL(current.question_image_preview)
      }
      return {
        ...current,
        question_image: null,
        question_image_preview: null,
        existing_question_image_path: null,
        existing_question_image_url: null,
      }
    })
  }

  const handleQuestionOptionImageChange = (index, file) => {
    const validationError = validateQuestionImageFile(file)
    if (validationError) {
      setQuestionSubmitError(validationError)
      return
    }

    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => {
        if (optionIndex !== index) return option
        if (option.image_preview) URL.revokeObjectURL(option.image_preview)
        return { ...option, image: file, image_preview: URL.createObjectURL(file) }
      }),
    }))
  }

  const handleQuestionOptionImageClear = (index) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => {
        if (optionIndex !== index) return option
        if (option.image_preview) URL.revokeObjectURL(option.image_preview)
        return { ...option, image: null, image_preview: null, existing_image_path: null, existing_image_url: null }
      }),
    }))
  }

  const handleQuestionAddOption = () => {
    setQuestionForm((current) => ({
      ...current,
      options: [...current.options, createQuestionOptionForm(current.options.length)],
    }))
  }

  const handleQuestionSetCorrectOption = (index) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({
        ...option,
        answer: optionIndex === index,
      })),
    }))
  }

  const handleQuestionSubmit = async (event) => {
    event.preventDefault()
    const submitMode = String(event.nativeEvent?.submitter?.value || 'save')

    const isEditMode = questionModalMode === 'edit' && editingQuestionId !== null
    const shouldKeepOpenForAddMore = submitMode === 'save-add' && !isEditMode
    const isTkpGroup = Number(questionForm.question_group) === 3
    const isText = Boolean(questionForm.istext)
    const optionsIsText = Boolean(questionForm.options_istext)

    if (!questionForm.package_id) {
      setQuestionSubmitError('Paket wajib dipilih.')
      return
    }

    if (questionForm.question_type !== 'SKB' && !questionForm.question_group) {
      setQuestionSubmitError('Grup Soal wajib dipilih.')
      return
    }

    if (isText && !questionForm.question.trim()) {
      setQuestionSubmitError('Isi soal wajib diisi.')
      return
    }

    if (!isText && !questionForm.question_image && !questionForm.existing_question_image_url) {
      setQuestionSubmitError('Gambar soal wajib diunggah.')
      return
    }

    const activeOptions = optionsIsText
      ? questionForm.options.filter((option) => option.choise.trim() !== '')
      : questionForm.options

    if (activeOptions.length < 1) {
      setQuestionSubmitError('Minimal 1 opsi wajib diisi.')
      return
    }

    if (!optionsIsText && activeOptions.some((option) => !option.image && !option.existing_image_url)) {
      setQuestionSubmitError('Gambar wajib diunggah untuk setiap opsi jawaban.')
      return
    }

    if (!isTkpGroup && activeOptions.filter((option) => option.answer).length !== 1) {
      setQuestionSubmitError('Harus ada tepat 1 jawaban benar.')
      return
    }

    if (isTkpGroup && activeOptions.some((option) => !Number.isInteger(Number(option.nilai_tkp)) || Number(option.nilai_tkp) < 1 || Number(option.nilai_tkp) > 5)) {
      setQuestionSubmitError('Nilai TKP (1-5) wajib diisi untuk setiap opsi.')
      return
    }

    setIsSavingQuestion(true)
    setQuestionSubmitError(null)
    setQuestionSubmitSuccess(null)

    try {
      const formData = new FormData()
      if (isEditMode) formData.append('_method', 'PUT')
      formData.append('question', isText ? questionForm.question.trim() : '')
      formData.append('question_type', questionForm.question_type)
      formData.append('question_group', String(Number(questionForm.question_group)))
      formData.append('package_id', String(Number(questionForm.package_id)))
      formData.append('istext', isText ? '1' : '0')
      formData.append('options_istext', optionsIsText ? '1' : '0')
      formData.append('information', questionForm.information.trim())
      formData.append('pembahasan', questionForm.pembahasan.trim())

      if (questionForm.question_image) {
        formData.append('question_image', questionForm.question_image)
      } else if (questionForm.existing_question_image_path) {
        formData.append('existing_question_image_path', questionForm.existing_question_image_path)
      }

      activeOptions.forEach((option, index) => {
        formData.append(`options[${index}][answer]`, option.answer ? '1' : '0')
        formData.append(`options[${index}][istext]`, optionsIsText ? '1' : '0')

        if (isTkpGroup && option.nilai_tkp !== '') {
          formData.append(`options[${index}][nilai_tkp]`, String(Number(option.nilai_tkp)))
        }

        if (optionsIsText) {
          formData.append(`options[${index}][choise]`, option.choise.trim())
        } else if (option.image) {
          formData.append(`options[${index}][image]`, option.image)
        } else if (option.existing_image_path) {
          formData.append(`options[${index}][existing_image_path]`, option.existing_image_path)
        }
      })

      await saveQuestion(formData, { isEditMode, id: editingQuestionId })

      setQuestionSubmitSuccess(isEditMode ? 'Soal berhasil diperbarui.' : 'Soal berhasil disimpan.')
      await loadQuestions({ cancelled: () => false, showLoading: false })

      if (questionSuccessTimerRef.current) {
        window.clearTimeout(questionSuccessTimerRef.current)
      }

      questionSuccessTimerRef.current = window.setTimeout(() => {
        setQuestionSubmitSuccess(null)
        questionSuccessTimerRef.current = null
      }, 2800)

      if (shouldKeepOpenForAddMore) {
        setQuestionForm((current) => {
          revokeQuestionFormPreviews(current)
          return createQuestionFormFromDetail({
            question_group: Number(current.question_group) || 1,
            question_type: 'SKD',
            package_id: current.package_id,
            istext: true,
          })
        })
        setShowQuestionModal(true)
        return
      }

      setShowQuestionModal(false)
      setEditingQuestionId(null)
      setQuestionForm((current) => {
        revokeQuestionFormPreviews(current)
        return createQuestionFormFromDetail()
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Soal gagal disimpan.'
      setQuestionSubmitError(message)
    } finally {
      setIsSavingQuestion(false)
    }
  }

  const handleDeleteQuestion = async (row) => {
    if (!row?.id) return

    const confirmed = window.confirm(`Hapus soal ini? Soal akan disembunyikan dari daftar.`)
    if (!confirmed) return

    try {
      await deleteQuestion(row.id)

      setShowQuestionDetailModal(false)
      setQuestionDetail(null)
      await loadQuestions({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Soal gagal dihapus.'
      setQuestionError(message)
    }
  }

  const handleRestoreQuestion = async (row) => {
    if (!row?.id) return

    try {
      await restoreQuestion(row.id)

      setShowQuestionDetailModal(false)
      setQuestionDetail(null)
      await loadQuestions({ cancelled: () => false, showLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Soal gagal dipulihkan.'
      setQuestionError(message)
    }
  }

  const switchAdminQuestionTab = (tab) => {
    const nextSearch = tab === 'tryout' || tab === 'groups' ? `?tab=${tab}` : ''
    navigate(`${currentPath}${nextSearch}`, { replace: true, state: { user } })
  }

  const startSandboxTryoutSession = async (packageRow) => {
    if (!packageRow?.pid || !user?.pid) return

    setStartingSandboxPackageId(packageRow.pid)
    setSandboxStartError(null)

    try {
      const payload = await startSandboxTryout({
        user_id: user.pid,
        package_id: packageRow.pid,
        jenis_tryout: packageRow.program || sandboxTryoutType,
      })

      storeSandboxAdminMode()

      navigate('/dashboard-user/tryout?sandbox=1&sandbox_admin=1', {
        state: { user, sandbox: true, sandboxAdmin: true, sandboxSession: payload?.data?.session ?? null },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sandbox tryout gagal dibuat.'
      setSandboxStartError(message)
    } finally {
      setStartingSandboxPackageId(null)
    }
  }

  useEffect(() => {
    return () => {
      if (questionSuccessTimerRef.current) {
        window.clearTimeout(questionSuccessTimerRef.current)
      }
    }
  }, [])

  const visibleQuestionRows = questionRows.filter((row) => {
    const search = questionSearch.trim().toLowerCase()
    const status = row.deleted_at ? 'terhapus' : 'aktif'

    if (selectedQuestionStatus === 'Aktif' && status !== 'aktif') return false
    if (selectedQuestionStatus === 'Terhapus' && status !== 'terhapus') return false

    if (selectedQuestionGroup !== 'Semua Grup' && Number(row.question_group) !== Number(selectedQuestionGroup)) {
      return false
    }

    if (selectedQuestionType !== 'Semua Tipe' && String(row.question_type || '').toLowerCase() !== selectedQuestionType.toLowerCase()) {
      return false
    }

    if (!search) return true

    return [row.question, row.information, row.pembahasan, row.question_group_label]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })

  const totalQuestionPages = Math.max(1, Math.ceil(visibleQuestionRows.length / questionPageSize))
  const safeQuestionCurrentPage = Math.min(questionCurrentPage, totalQuestionPages)
  const questionStartIndex = (safeQuestionCurrentPage - 1) * questionPageSize
  const questionPaginatedRows = visibleQuestionRows.slice(questionStartIndex, questionStartIndex + questionPageSize)

  useEffect(() => {
    setQuestionCurrentPage(1)
  }, [questionSearch, selectedQuestionGroup, selectedQuestionType, selectedQuestionStatus, questionPageSize])

  useEffect(() => {
    if (questionCurrentPage > totalQuestionPages) {
      setQuestionCurrentPage(totalQuestionPages)
    }
  }, [questionCurrentPage, totalQuestionPages])

  const renderQuestionPaginationPages = () => {
    if (totalQuestionPages <= 1) return [1]

    const pages = new Set([1, totalQuestionPages, safeQuestionCurrentPage])
    if (safeQuestionCurrentPage > 1) pages.add(safeQuestionCurrentPage - 1)
    if (safeQuestionCurrentPage < totalQuestionPages) pages.add(safeQuestionCurrentPage + 1)

    return Array.from(pages).sort((a, b) => a - b)
  }

  const openQuestionDetailFromRow = (row) => {
    setQuestionDetail(row)
    setShowQuestionDetailModal(true)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearAuthUser()

    navigate('/login', { replace: true })
  }

  useEffect(() => {
    storeAdminSidebarState(isSidebarCollapsed)
  }, [isSidebarCollapsed])

  const formatQuestionAnswerSummary = (row) => {
    const options = Array.isArray(row.options) ? row.options : []
    if (!options.length) return '-'

    if (Number(row.question_group) === 3) {
      return options
        .map((option, index) => `${String.fromCharCode(65 + index)}=${option.nilai_tkp ?? '-'}`)
        .join(', ')
    }

    const correctIndex = options.findIndex((option) => option.answer)
    if (correctIndex < 0) return '-'

    const correctOption = options[correctIndex]
    const letter = String.fromCharCode(65 + correctIndex)
    return correctOption.istext ? `${letter}. ${correctOption.choise}` : `${letter} (Gambar)`
  }

  const handleExportQuestions = () => {
    if (!visibleQuestionRows.length) return

    const headers = ['No', 'Soal', 'Grup', 'Tipe', 'Jenis', 'Paket', 'Jumlah Opsi', 'Jawaban Benar / Nilai TKP', 'Status', 'Informasi Tambahan', 'Pembahasan']
    const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csvRows = visibleQuestionRows.map((row, index) => [
      index + 1,
      row.istext ? row.question : 'Soal bergambar',
      row.question_group_label,
      formatQuestionTypeLabel(row.question_type),
      row.istext ? 'Teks' : 'Gambar',
      row.package_name || '-',
      row.options_count || 0,
      formatQuestionAnswerSummary(row),
      row.deleted_at ? 'Terhapus' : 'Aktif',
      row.information || '-',
      row.pembahasan || '-',
    ].map(escapeCsvValue).join(','))
    const csvContent = [headers.map(escapeCsvValue).join(','), ...csvRows].join('\r\n')

    const blob = new Blob([String.fromCharCode(0xfeff), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-soal-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-dashboard-page admin-question-page">
      <div className={`admin-dashboard-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <aside className={`admin-sidebar${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <AdminBrandBlock isCollapsed={isSidebarCollapsed} />

          <div className="admin-sidebar-group-label">Main</div>
          <nav className="admin-sidebar-nav" aria-label="Navigasi admin">
            {adminMainMenu.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`admin-sidebar-item${currentPath === item.href ? ' active' : ''}`}
                onClick={() => item.href !== '#' && navigate(item.href)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <AdminQuestionMenu currentPath={currentPath} navigate={navigate} />

          <AdminSystemMenu currentPath={currentPath} navigate={navigate} />

          <AdminUserMenu profileUser={user} displayName={displayName} onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })} onLogout={handleLogout} />
        </aside>

        <main className="admin-main admin-question-main">
          <AdminTopbar
            title="Bank Soal"
            searchPlaceholder="Cari soal..."
            currentDateLabel={currentDateLabel}
            displayName={displayName}
            profileUser={user}
            profileRoleLabel="Super Admin"
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            showSearch={false}
            onHomeClick={() => navigate('/')}
            onResumeProfile={(activeUser) => navigate('/account-profile', { state: { user: activeUser } })}
            onLogout={handleLogout}
            onNotificationItemClick={(item) => navigate(item.href, { state: { user } })}
          />

          <section className="admin-question-hero">
            <div>
              <h2>Manajemen Soal</h2>
              <div className="admin-breadcrumb">
                Dashboard <span>›</span> Bank Soal
              </div>
            </div>

            <div className="admin-package-actions admin-question-actions">
              {activeAdminTab === 'questions' ? (
                <>
                  <button type="button" className="admin-outline-action" onClick={handleExportQuestions} disabled={!visibleQuestionRows.length}>⬆ Export Soal</button>
                  <button type="button" className="admin-outline-action" aria-label="Muat ulang data soal" onClick={() => { void loadQuestions({ cancelled: () => false, showLoading: true }) }}>↻</button>
                  <button type="button" className="admin-primary-action" onClick={openAddQuestionModal}>＋ Tambah Soal</button>
                </>
              ) : activeAdminTab === 'tryout' ? (
                <>
                  <label className="admin-package-filter-group admin-question-tryout-type-filter">
                    <select className="admin-package-select" value={sandboxTryoutType} onChange={(event) => setSandboxTryoutType(event.target.value)}>
                      <option value="SKD">SKD</option>
                      <option value="SKB">SKB</option>
                    </select>
                  </label>
                  <button type="button" className="admin-outline-action" aria-label="Muat ulang data paket" onClick={() => { void loadSandboxPaket({ cancelled: () => false, showLoading: true }) }}>↻</button>
                </>
              ) : null}
            </div>
          </section>

          <section className="admin-question-tabs" aria-label="Tab manajemen soal">
            <button
              type="button"
              className={`admin-question-tab${activeAdminTab === 'questions' ? ' active' : ''}`}
              onClick={() => switchAdminQuestionTab('questions')}
            >
              <span aria-hidden="true">📝</span>
              <span>Manajemen Soal</span>
            </button>
            {/* Grup Soal tab sementara disembunyikan agar tidak membingungkan user */}
            <button
              type="button"
              className={`admin-question-tab${activeAdminTab === 'tryout' ? ' active' : ''}`}
              onClick={() => switchAdminQuestionTab('tryout')}
            >
              <span aria-hidden="true">🧪</span>
              <span>Tryout</span>
            </button>
          </section>

          {activeAdminTab === 'groups' ? (
            <AdminQuestionGroupsPanel packages={packageRows} />
          ) : activeAdminTab === 'questions' ? (
            <>
              <section className="admin-summary-grid admin-question-summary-grid">
                {questionSummaryCards.map((card) => (
                  <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                    <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                    <div className="admin-summary-copy">
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                      <p>{card.delta}</p>
                    </div>
                  </article>
                ))}
              </section>

              <section className="admin-card admin-question-filter-card">
                {questionError ? <div className="admin-user-message error">{questionError}</div> : null}
                {isLoadingQuestions ? <div className="admin-user-message">Memuat data soal...</div> : null}

                <div className="admin-package-filters admin-question-filters">
                  <label className="admin-package-search">
                    <span aria-hidden="true">⌕</span>
                    <input type="search" placeholder="Cari soal..." value={questionSearch} onChange={(event) => setQuestionSearch(event.target.value)} />
                  </label>

                  <div className="admin-package-filter-group admin-question-filter-group">
                    <select className="admin-package-select" value={selectedQuestionGroup} onChange={(event) => setSelectedQuestionGroup(event.target.value)}>
                      {['Semua Grup', '1', '2', '3'].map((option) => (
                        <option key={option} value={option}>
                          {option === 'Semua Grup' ? option : formatQuestionGroupLabel(option)}
                        </option>
                      ))}
                    </select>

                    <select className="admin-package-select" value={selectedQuestionType} onChange={(event) => setSelectedQuestionType(event.target.value)}>
                      {['Semua Tipe', 'SKD', 'SKB'].map((option) => (
                        <option key={option} value={option}>
                          {option === 'Semua Tipe' ? option : formatQuestionTypeLabel(option)}
                        </option>
                      ))}
                    </select>

                    <select className="admin-package-select" value={selectedQuestionStatus} onChange={(event) => setSelectedQuestionStatus(event.target.value)}>
                      {['Aktif', 'Terhapus', 'Semua Status'].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>

                    <button type="button" className="admin-user-filter-button admin-package-filter-button">Filter</button>
                    <label className="admin-page-size-control" aria-label="Jumlah data per halaman">
                      <select
                        className="admin-page-size-select"
                        value={questionPageSize}
                        onChange={(event) => setQuestionPageSize(Number(event.target.value))}
                      >
                        {PAGE_SIZE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option} / halaman</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="admin-package-reset"
                      onClick={() => {
                        setQuestionSearch('')
                        setSelectedQuestionGroup('Semua Grup')
                        setSelectedQuestionType('Semua Tipe')
                        setSelectedQuestionStatus('Aktif')
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </section>

              <section className="admin-card admin-question-table-card">
                {questionSubmitSuccess ? <div className="admin-package-banner success">{questionSubmitSuccess}</div> : null}
                <div className="admin-user-table-wrap">
                  <table className="admin-user-table admin-question-table">
                    <thead>
                      <tr>
                        <th>Soal</th>
                        <th>Grup</th>
                        <th>Tipe</th>
                        <th>Jenis</th>
                        <th>Opsi</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionPaginatedRows.map((row, index) => (
                        <tr key={row.id}>
                          <td>
                            <div className="admin-user-cell admin-question-cell">
                              <div className={`admin-user-avatar admin-question-avatar ${row.deleted_at ? 'inactive' : 'active'}`}>{String(index + 1).padStart(2, '0')}</div>
                              <div>
                                <strong>{row.istext ? row.question : '🖼 Soal bergambar'}</strong>
                                <span>{row.information || row.pembahasan || '-'}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="admin-question-group-pill">{row.question_group_label}</span></td>
                          <td>{formatQuestionTypeLabel(row.question_type)}</td>
                          <td><span className="admin-question-kind-pill">{row.istext ? 'Teks' : 'Gambar'}</span></td>
                          <td>{row.options_count || 0}</td>
                          <td><span className={`admin-status-pill ${row.deleted_at ? 'cancelled' : 'success'}`}>{row.deleted_at ? 'Terhapus' : 'Aktif'}</span></td>
                          <td>
                            <div className="admin-row-actions admin-question-row-actions">
                              <button type="button" className="admin-row-action" title="Lihat soal" aria-label={`Lihat soal ${row.question}`} onClick={() => openQuestionDetailFromRow(row)}>👁</button>
                              <button
                                type="button"
                                className="admin-row-action admin-row-action-edit"
                                title="Edit soal"
                                aria-label={`Edit soal ${row.question}`}
                                onClick={() => {
                                  void openEditQuestionModal(row)
                                }}
                              >
                                ✎
                              </button>
                              {row.deleted_at ? (
                                <button type="button" className="admin-row-action danger" title="Pulihkan soal" aria-label={`Pulihkan soal ${row.question}`} onClick={() => { void handleRestoreQuestion(row) }}>↺</button>
                              ) : (
                                <button type="button" className="admin-row-action danger" title="Hapus soal" aria-label={`Hapus soal ${row.question}`} onClick={() => { void handleDeleteQuestion(row) }}>🗑</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-package-footer admin-user-footer">
                  <p>Menampilkan {questionPaginatedRows.length} data dari {visibleQuestionRows.length} soal</p>
                  <div className="admin-pagination">
                    <button type="button" className="admin-pagination-arrow" disabled={safeQuestionCurrentPage === 1} onClick={() => setQuestionCurrentPage((current) => Math.max(1, current - 1))}>‹</button>
                    {renderQuestionPaginationPages().map((page, index, array) => {
                      const previousPage = array[index - 1]
                      const shouldShowDots = previousPage && page - previousPage > 1

                      return (
                        <span key={page}>
                          {shouldShowDots ? <span className="admin-pagination-dots">…</span> : null}
                          <button type="button" className={`admin-pagination-page${page === safeQuestionCurrentPage ? ' active' : ''}`} onClick={() => setQuestionCurrentPage(page)}>{page}</button>
                        </span>
                      )
                    })}
                    <button type="button" className="admin-pagination-arrow" disabled={safeQuestionCurrentPage === totalQuestionPages} onClick={() => setQuestionCurrentPage((current) => Math.min(totalQuestionPages, current + 1))}>›</button>
                  </div>
                </div>
              </section>

              <AdminQuestionFormModal
                open={showQuestionModal}
                onCancel={closeQuestionModal}
                onSubmit={handleQuestionSubmit}
                form={questionForm}
                onFieldChange={handleQuestionFieldChange}
                onOptionChange={handleQuestionOptionChange}
                onAddOption={handleQuestionAddOption}
                onSetCorrectOption={handleQuestionSetCorrectOption}
                onResetForm={resetQuestionForm}
                onQuestionImageChange={handleQuestionImageChange}
                onQuestionImageClear={handleQuestionImageClear}
                onOptionImageChange={handleQuestionOptionImageChange}
                onOptionImageClear={handleQuestionOptionImageClear}
                packages={packageRows}
                loading={isSavingQuestion}
                error={questionSubmitError}
                title={questionModalMode === 'edit' ? 'Edit Soal' : 'Tambah Soal'}
                submitLabel={questionModalMode === 'edit' ? 'Perbarui Soal' : 'Simpan Soal'}
                helpText={
                  Number(questionForm.question_group) === 3
                    ? (questionModalMode === 'edit' ? 'Ubah soal, opsi, dan nilai TKP lalu simpan perubahan.' : 'Isi soal, opsi jawaban, dan nilai 1-5 untuk tiap opsi.')
                    : (questionModalMode === 'edit' ? 'Ubah soal, opsi, dan jawaban benar lalu simpan perubahan.' : 'Isi soal, opsi jawaban, lalu pilih 1 jawaban benar.')
                }
                mode={questionModalMode}
              />

              <AdminQuestionDetailModal
                open={showQuestionDetailModal}
                question={questionDetail}
                onCancel={() => {
                  setShowQuestionDetailModal(false)
                  setQuestionDetail(null)
                }}
                onEdit={() => {
                  const current = questionDetail
                  setShowQuestionDetailModal(false)
                  setQuestionDetail(null)
                  if (current) {
                    void openEditQuestionModal(current)
                  }
                }}
                onDelete={() => {
                  const current = questionDetail
                  if (current) {
                    void handleDeleteQuestion(current)
                  }
                }}
                onRestore={() => {
                  const current = questionDetail
                  if (current) {
                    void handleRestoreQuestion(current)
                  }
                }}
              />
            </>
          ) : (
            <>
              <section className="admin-summary-grid admin-question-summary-grid">
                {tryoutSummaryCards.map((card) => (
                  <article className={`admin-summary-card ${card.accent}`} key={card.label}>
                    <div className={`admin-summary-icon ${card.accent}`}>{card.icon}</div>
                    <div className="admin-summary-copy">
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                      <p>{card.delta}</p>
                    </div>
                  </article>
                ))}
              </section>

              <section className="admin-card admin-question-tryout-card">
                {sandboxStartError ? <div className="admin-user-message error">{sandboxStartError}</div> : null}
                {sandboxPaketError ? <div className="admin-user-message error">{sandboxPaketError}</div> : null}
                {isLoadingSandboxPaket ? <div className="admin-user-message">Memuat data paket tryout...</div> : null}

                <div className="admin-question-tryout-intro">
                  <div>
                    <h3>Sandbox Tryout</h3>
                    <p>Pilih paket lalu jalankan simulasi di session draft. Data ini tidak masuk statistik user.</p>
                  </div>
                  <div className="admin-question-tryout-hint">
                    <span aria-hidden="true">ℹ</span>
                    <strong>Mode draft</strong>
                  </div>
                </div>

                <div className="admin-question-tryout-toolbar">
                  <label className="admin-package-search admin-question-tryout-search">
                    <span aria-hidden="true">⌕</span>
                    <input type="search" placeholder="Cari paket sandbox..." value={packageSearch} onChange={(event) => setPackageSearch(event.target.value)} />
                  </label>
                </div>

                <div className="admin-question-tryout-grid">
                  {visibleSandboxPackages.map((row) => (
                    <article className="admin-question-tryout-card-item" key={row.pid}>
                      <div className="admin-question-tryout-card-head">
                        <div>
                          <span className="admin-question-tryout-badge">{row.program || 'Paket'}</span>
                          <h4>{row.name}</h4>
                        </div>
                      </div>
                      <p>{row.type || '-'}</p>
                      <div className="admin-question-tryout-meta">
                        <span>Aktif</span>
                      </div>
                      <div className="admin-question-tryout-actions">
                        <button type="button" className="admin-primary-action" onClick={() => { void startSandboxTryoutSession(row) }} disabled={startingSandboxPackageId === row.pid}>
                          {startingSandboxPackageId === row.pid ? 'Menyiapkan...' : 'Jalankan Sandbox'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {!isLoadingSandboxPaket && !visibleSandboxPackages.length ? (
                  <div className="admin-question-tryout-empty">Tidak ada paket yang cocok dengan pencarian.</div>
                ) : null}
              </section>
            </>
          )}

          <AdminLogoutModal
            open={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        </main>
      </div>
    </div>
  )
}
