export default function QuizzesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Quizzes</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse through our collection of exciting quizzes and test your knowledge!
          </p>
        </div>

        {/* Placeholder for quiz list */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl">📝</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes Available</h3>
          <p className="text-gray-600 mb-6">
            Quizzes will appear here once they are created by the admin. Check back soon!
          </p>
          <div className="text-sm text-gray-500">
            Admin can create quizzes from the{' '}
            <a href="/admin" className="text-blue-600 hover:underline">
              Admin Panel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
