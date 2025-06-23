
const Overview = () => {
  // All stats are zero, ready for backend
  const stats = {
    totalBooks: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalLibraryEntries: 0
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Books</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalBooks}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalUsers}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Reviews</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalReviews}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Library Entries</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalLibraryEntries}</p>
      </div>
    </div>
  )
}

export default Overview