export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About QWinHub</h1>
          <p className="text-xl text-gray-600">
            Your gateway to knowledge, competition, and exciting prizes
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is QWinHub?</h2>
            <p className="text-gray-700 leading-relaxed">
              QWinHub is an interactive quiz platform designed to make learning fun and rewarding. 
              We believe that knowledge should be accessible, engaging, and worth celebrating. 
              Our platform allows users to participate in carefully crafted quizzes across various 
              topics while competing for exciting prizes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🎯 Our Mission</h3>
              <p className="text-gray-700">
                To create an engaging platform where curiosity meets competition, 
                making learning enjoyable while rewarding knowledge and quick thinking.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ How It Works</h3>
              <p className="text-gray-700">
                Simply browse available quizzes, answer questions correctly, and get a chance 
                to win prizes. No registration required - just your name and phone number!
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">No Registration Required</h4>
                  <p className="text-gray-600">Jump straight into quizzes without lengthy sign-up processes.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Fair Winner Selection</h4>
                  <p className="text-gray-600">Winners are randomly selected from participants who answered correctly.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">One Chance Per Quiz</h4>
                  <p className="text-gray-600">Each phone number can participate once per quiz, ensuring fairness.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Time-Limited Quizzes</h4>
                  <p className="text-gray-600">Each quiz has a deadline, adding excitement and urgency to participation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 mb-6">
              Join our community of quiz enthusiasts and start your journey to knowledge and prizes!
            </p>
            <a
              href="/quizzes"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-block"
            >
              Browse Quizzes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
