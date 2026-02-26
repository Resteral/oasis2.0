import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/oasis-header.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.4)' // Darken for text readability
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 w-96 h-auto drop-shadow-2xl hover:scale-105 transition transform">
            <img src="/oasis-logo.png" alt="Oasis Logo" className="w-full h-auto object-contain" />
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-oasis-teal via-oasis-green to-oasis-yellow bg-clip-text text-transparent drop-shadow-lg">
            Oasis
          </h1>
          <p className="text-2xl md:text-3xl text-gray-200 mb-8 max-w-3xl drop-shadow-md font-medium">
            The Social Marketplace. Connect, Hire, Spend, and Grow.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/auth" className="bg-oasis-teal text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-oasis-teal-dark hover:scale-105 transition transform shadow-lg">
              Join Now
            </Link>
            <Link href="/auth" className="bg-gray-900/80 border border-oasis-sand backdrop-blur-sm font-bold px-8 py-4 rounded-full text-lg hover:bg-gray-800 text-oasis-sand transition shadow-lg">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-900 py-20 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-2xl font-bold mb-2">Social Feed</h3>
            <p className="text-gray-400">Share updates, gain followers, and earn tokens for every post.</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">🛠️</div>
            <h3 className="text-2xl font-bold mb-2">Hire Pros</h3>
            <p className="text-gray-400">Find local Carpenters, Plumbers, and Electricians instantly.</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold mb-2">Promote Yourself</h3>
            <p className="text-gray-400">Spend your tokens to boost your business to the top of the marketplace.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} United Oasis. Built for the Community.
      </footer>
    </main>
  );
}
