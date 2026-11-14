import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from './store'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { MobileNav, WhatsAppFab } from './components/MobileNav'
import { Toast } from './components/Toast'
import { Home } from './pages/Home'
import { Browse } from './pages/Browse'
import { ListingDetail } from './pages/ListingDetail'
import { ListItem } from './pages/ListItem'
import { Dashboard } from './pages/Dashboard'
import { CheckoutReturn } from './pages/CheckoutReturn'
import { NotFound } from './pages/NotFound'

function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

function Shell() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <ScrollManager />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/item/:id" element={<ListingDetail />} />
        <Route path="/list" element={<ListItem />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkout/return" element={<CheckoutReturn />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <MobileNav />
      <WhatsAppFab />
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  )
}
