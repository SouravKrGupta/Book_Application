import { useState } from 'react'
import Overview from '../components/admin/Overview'
import Upload from '../components/admin/Upload'
import Manage from '../components/admin/Manage'
import Reviews from '../components/admin/Reviews'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'upload', label: 'Upload' },
    { id: 'manage', label: 'Manage' },
    { id: 'reviews', label: 'Reviews' }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="mt-2 text-gray-600">Admin features will be available after backend integration.</p>
      </div>
    </div>
  )
}

export default AdminDashboard