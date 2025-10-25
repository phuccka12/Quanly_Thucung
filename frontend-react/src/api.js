export const API_BASE_URL = 'http://localhost:8000/api/v1'
export const BASE_URL = 'http://localhost:8000'

async function fetchJson(url, opts={}){
  const res = await fetch(url, opts)
  if (!res.ok) {
    let text
    try {
      text = await res.text()
    } catch {
      text = 'Unable to read response'
    }
    console.log('Response status:', res.status, 'body:', text?.substring(0, 200) + (text?.length > 200 ? '...' : ''))
    const err = new Error(res.statusText || 'HTTP error')
    err.status = res.status
    err.body = text
    throw err
  }
  try {
    const data = await res.json()
    console.log('Response data:', data)
    return data
  } catch (e) {
    console.error('JSON parse error:', e)
    return null
  }
}

export async function fetchWithAuth(pathOrUrl, opts={}){
  const token = localStorage.getItem('hiday_pet_token')
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE_URL}${pathOrUrl}`
  const headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  console.log('Request:', opts.method || 'GET', url, { headers: {...headers, Authorization: headers.Authorization ? '[PRESENT]' : '[MISSING]'} })
  
  try {
    const response = await fetchJson(url, Object.assign({}, opts, { headers }))
    return response
  } catch (err) {
    // If 401 Unauthorized, token is invalid/expired, logout user
    if (err.status === 401) {
      console.log('Token invalid/expired, logging out')
      localStorage.removeItem('hiday_pet_token')
      localStorage.removeItem('hiday_pet_saved_email')
      window.dispatchEvent(new Event('tokenChanged'))
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    throw err
  }
}
