export interface ResumePhoto {
  blob: Blob
  name: string
  type: string
  size: number
}

export function getResumePhotoBlob(photo: ResumePhoto | null | undefined): Blob | null {
  const candidate = photo?.blob
  if (!candidate || typeof Blob === 'undefined') return null
  if (candidate instanceof Blob) return candidate

  // Some browsers return a cross-realm Blob from IndexedDB.
  if (Object.prototype.toString.call(candidate) === '[object Blob]') {
    return candidate as Blob
  }

  return null
}
