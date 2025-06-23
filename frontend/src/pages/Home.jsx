import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Welcome to BookApp</h1>
      <p className="text-lg text-gray-600">Browse books, view your library, and more. All features will be available after backend integration.</p>
    </div>
  )
}

export default Home