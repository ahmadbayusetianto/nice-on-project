export default function MaterialEmptyState({ title, description, actionLabel, onAction, accent = 'blue' }) {
  return (
    <div className={`material-empty-state ${accent}`}>
      <div className="material-empty-icon" aria-hidden="true">📄</div>
      <div className="material-empty-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {actionLabel ? (
        <button type="button" className="dashboard-primary-action material-empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
