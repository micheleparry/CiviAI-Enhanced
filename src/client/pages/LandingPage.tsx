import React from 'react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            CiviAI Enhanced
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Planning & Permitting Management for Rural Communities
          </p>
          <div className="space-y-4">
            <a
              href="/dashboard"
              className="inline-block bg-forest-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-forest-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Advanced Document Analysis
            </h3>
            <p className="text-gray-600">
              AI-powered analysis of planning documents with compliance scoring and missing information detection.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Conversational AI Assistant
            </h3>
            <p className="text-gray-600">
              24/7 support for citizens and planning staff with intelligent guidance and answers.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Rural Community Focus
            </h3>
            <p className="text-gray-600">
              Designed specifically for small communities with limited resources and technical expertise.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 