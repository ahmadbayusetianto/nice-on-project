const SNAP_SCRIPT_URL = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'

let snapScriptPromise = null

export function loadMidtransSnap() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.snap) return Promise.resolve(window.snap)
  if (snapScriptPromise) return snapScriptPromise

  snapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SNAP_SCRIPT_URL
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? '')
    script.onload = () => resolve(window.snap)
    script.onerror = () => {
      snapScriptPromise = null
      reject(new Error('Gagal memuat Midtrans Snap.'))
    }
    document.body.appendChild(script)
  })

  return snapScriptPromise
}
