export const API_BASE_URL = 'http://localhost:8000/api/v1'
export const BASE_URL = 'http://localhost:8000'

async function fetchJson(url, opts={}){
  const res = await fetch(url, opts)
  if (!res.ok) {
    const text = await res.text().catch(()=>null)
    const err = new Error(res.statusText || 'HTTP error')
    err.status = res.status
    err.body = text
    throw err
  }
  return res.json().catch(()=>null)
}

export async function fetchWithAuth(pathOrUrl, opts={}){
  const token = localStorage.getItem('hiday_pet_token')
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE_URL}${pathOrUrl}`
  const headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  console.log('Request:', opts.method || 'GET', url, { headers: {...headers, Authorization: headers.Authorization ? '[PRESENT]' : '[MISSING]'} })
  
  return fetchJson(url, Object.assign({}, opts, { headers }))
}
