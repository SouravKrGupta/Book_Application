
const Reviews = () => {
  // No books for now, ready for backend
  const books = []

  return (
    <div className="space-y-6">
      {books.length === 0 && (
        <div className="text-center text-gray-400">No reviews to display.</div>
      )}
    </div>
  )
}

export default Reviews