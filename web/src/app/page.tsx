import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Product Finder
        </h1>
        <p className="text-2xl text-gray-300 mb-12">
          Find products and stores near you instantly with our Chrome Extension.
        </p>

        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-2xl mx-auto">
          <h2 className="text-3xl font-semibold mb-6 text-white">How it works</h2>
          <div className="grid gap-6 text-left">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600/20 p-3 rounded-lg text-blue-400 font-bold text-xl">1</div>
              <div>
                <h3 className="font-bold text-lg">Install Extension</h3>
                <p className="text-gray-400">Load the extension in your browser.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-blue-600/20 p-3 rounded-lg text-blue-400 font-bold text-xl">2</div>
              <div>
                <h3 className="font-bold text-lg">Enter Query</h3>
                <p className="text-gray-400">Type what you are looking for (e.g. "Nike Shoes", "Coffee").</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-blue-600/20 p-3 rounded-lg text-blue-400 font-bold text-xl">3</div>
              <div>
                <h3 className="font-bold text-lg">Get Results</h3>
                <p className="text-gray-400">We use Google Places API to find the best matches near your location.</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-full font-bold text-lg transition transform hover:scale-105">
              Download Extension (Coming Soon)
            </button>
          </div>
        </div>

        <div className="mt-16 text-gray-500 text-sm">
          <p>Powered by Google Places API</p>
        </div>
      </div>
    </main>
  );
}
