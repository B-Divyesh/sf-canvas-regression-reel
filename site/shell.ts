import './styles.css'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }) })
}

document.querySelectorAll<HTMLButtonElement>('.copy-code').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copyTarget ?? '')
    const status = document.getElementById(button.getAttribute('aria-describedby') ?? '')
    try { await navigator.clipboard.writeText(target?.textContent ?? ''); if (status) status.textContent = 'Commands copied.' }
    catch { if (status) status.textContent = 'Copy was blocked. Select the commands and copy them manually.' }
  })
})
