import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBooks, fetchTopReviews } from '../data/api';
import { useApp } from '../context/AppContext';

const Home = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useApp();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const booksData = await fetchBooks();
        setFeaturedBooks(booksData.slice(0, 3));
        const reviewsData = await fetchTopReviews();
        setReviews(reviewsData);
      } catch (err) {
        setError('Failed to load data');
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-indigo-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-50"
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
            alt="Library background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Discover Your Next Favorite Book
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
            Join our community of readers and explore thousands of books across all genres. Start your reading journey today.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              to="/books"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 transition-colors duration-200"
            >
              Browse Books
            </Link>
            <Link
                to={user ? "/profile" : "/register"}
                className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-indigo-800 transition-colors duration-200"
              >
                {user ? (user.name ? ` ${user.name}` : "Profile") : "Join Now"}
              </Link>
          </div>
        </div>
      </div>

      {/* Featured Books Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Featured Books
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Discover our handpicked selection of the most popular books this month
          </p>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="relative">
                  <img
                    className="w-full h-56 object-cover"
                    src={book.cover_image_url || (book.cover_image && book.cover_image)}
                    alt={book.title}
                  />
                  <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-medium text-indigo-600">
                    {book.genre}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{book.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{book.author}</p>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{book.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{book.published_year}</span>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/books/${book.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Read more →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Recent Reviews
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              See what our readers are saying about their favorite books
            </p>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-50 rounded-xl shadow-lg p-8 transform transition duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {review.book_name}
                      </h4>
                      <p className="text-sm text-gray-500">{review.user_name}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 text-gray-600 italic">"{review.review_text}"</p>
                  <p className="mt-2 text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start reading?</span>
            <span className="block text-indigo-200">
              Join our community today.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-4">
            <div className="inline-flex rounded-md shadow">
              <Link
                to={user ? "/profile" : "/register"}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors duration-200"
              >
                {user ? "Profile" : "Get started"}
              </Link>
            </div>
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/books"
                className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-indigo-800 transition-colors duration-200"
              >
                Browse books
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 