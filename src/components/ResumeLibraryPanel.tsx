import { memo } from 'react'
import type { StoredResume } from '../utils/resumeStorage'
import './ResumeLibraryPanel.css'

interface ResumeLibraryPanelProps {
  resumes: StoredResume[]
  activeResumeId: string | null
  loading: boolean
  onCreate: () => void
  onSelect: (resume: StoredResume) => void
  onRename: (resume: StoredResume) => void
  onDelete: (resume: StoredResume) => void
  onClose: () => void
}

function ResumeLibraryPanel({
  resumes,
  activeResumeId,
  loading,
  onCreate,
  onSelect,
  onRename,
  onDelete,
  onClose,
}: ResumeLibraryPanelProps) {
  return (
    <aside className="resume-library-panel" aria-label="简历管理">
      <div className="resume-library-header">
        <div>
          <h3>简历管理</h3>
          <span>本地 IndexedDB 自动保存</span>
        </div>
        <button type="button" className="resume-library-close" onClick={onClose} aria-label="关闭简历管理">
          ×
        </button>
      </div>

      <button type="button" className="resume-library-create" onClick={onCreate} disabled={loading}>
        + 新建简历
      </button>

      <div className="resume-library-list">
        {loading ? <div className="resume-library-empty">正在读取本地简历...</div> : null}
        {!loading && resumes.length === 0 ? <div className="resume-library-empty">暂无本地简历</div> : null}
        {resumes.map(resume => (
          <div key={resume.id} className={`resume-library-item${resume.id === activeResumeId ? ' active' : ''}`}>
            <button type="button" className="resume-library-select" onClick={() => onSelect(resume)}>
              <strong>{resume.name}</strong>
              <span>更新于 {formatDate(resume.updatedAt)}</span>
            </button>
            <div className="resume-library-actions">
              <button type="button" onClick={() => onRename(resume)} disabled={loading}>重命名</button>
              <button type="button" className="danger" onClick={() => onDelete(resume)} disabled={loading || resumes.length <= 1}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

export default memo(ResumeLibraryPanel)
