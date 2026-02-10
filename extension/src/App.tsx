import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

// Initial Supabase Setup
const supabaseUrl = 'https://hsrcsmynfgendypscrbf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzcmNzbXluZmdlbmR5cHNjcmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzcwNDYsImV4cCI6MjA4NTAxMzA0Nn0.dL_z_BUkJqwR3qfKAQjhZB_M8zVz_hiE7m8dKTVMly0'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // 1. Get Session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    checkUser()

    // 2. Scan Page
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, { action: "scan" }, (response: any) => {
            setProduct(response)
            setLoading(false)
          })
        }
      })
    } else {
      setLoading(false) // Not running in extension
    }
  }, [])

  const handleLogin = async () => {
    const email = prompt("Enter your Oasis Email:")
    const password = prompt("Enter Password:")
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else setSession(data.session)
    }
  }

  const saveProduct = async () => {
    if (!product || !session) return
    setLoading(true)

    const { error } = await supabase.from('products').insert({
      name: product.title,
      description: product.description,
      price: parseFloat(product.price?.replace(/[^0-9.]/g, '') || '0'),
      image_url: product.image,
      profiles: { full_name: 'Wishlist Item' },
    })

    setLoading(false)
    if (error) alert('Error saving: ' + error.message)
    else alert('Saved to Oasis!')
  }

  if (!product && loading) return <div className="p-4">Scanning...</div>

  return (
    <div className="w-[300px] p-4 bg-gray-900 text-white font-sans">
      <h1 className="text-xl font-bold mb-4 text-blue-400">Oasis Finder 🔭</h1>

      {!session ? (
        <div className="text-center">
          <p className="mb-4">Please login to save items.</p>
          <button onClick={handleLogin} className="bg-blue-600 px-4 py-2 rounded">Login</button>
        </div>
      ) : (
        <>
          {product ? (
            <div className="space-y-3">
              {product.image && <img src={product.image} className="w-full h-32 object-cover rounded" />}
              <h3 className="font-bold leading-tight">{product.title}</h3>
              <p className="text-green-400 font-bold">{product.price || 'Price not detected'}</p>

              <button
                onClick={saveProduct}
                className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold mt-2"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Add to Oasis +'}
              </button>
            </div>
          ) : (
            <p>No product detected on this page.</p>
          )}
        </>
      )}
    </div>
  )
}

export default App
