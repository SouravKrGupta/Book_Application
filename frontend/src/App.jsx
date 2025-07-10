import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppProvider, useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import BookList from './pages/BookList'
import BookDetail from './pages/BookDetail'
import Library from './pages/Library'
import AdminDashboard from './pages/AdminDashboard'
import BookPDFViewer from './pages/BookPDFViewer';

// Protected Route component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useApp()

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="loading-spinner"></div>
    </div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requireAdmin && user.type !== 'admin') {
    return <Navigate to="/" />
  }

  return children
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<BookList />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/books/:id/pdf-viewer" element={
              <ProtectedRoute>
                <BookPDFViewer />
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </Router>
  )
}

export default App
