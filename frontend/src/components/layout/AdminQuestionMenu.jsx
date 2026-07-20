export default function AdminQuestionMenu({ currentPath, navigate }) {
  const isQuestionPage = currentPath.startsWith('/dashboard-admin/questions')

  return (
    <div className="admin-question-menu-wrap">
      <button
        type="button"
        className={`admin-question-parent${isQuestionPage ? ' active' : ''}`}
        onClick={() => navigate('/dashboard-admin/questions')}
        aria-label="Buka Bank Soal"
      >
        <span className="admin-sidebar-icon" aria-hidden="true">Q</span>
        <span className="admin-question-parent-label">Bank Soal</span>
        <span className="admin-system-parent-indicator" aria-hidden="true">›</span>
      </button>
    </div>
  )
}
