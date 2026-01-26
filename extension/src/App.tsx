import { useState } from 'react';
import './App.css';
import { searchNearby, type Place } from './api';

function App() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setPlaces([]);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const results = await searchNearby(query, latitude, longitude);
          setPlaces(results);
        } catch (err: any) {
          setError(err.message || "Failed to fetch results");
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        console.error(geoError);
        setError("Unable to retrieve your location. Please allow access.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="container">
      <h1>Product Finder</h1>
      <div className="search-box">
        <input
          type="text"
          placeholder="What are you looking for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Find'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="results">
        {places.map((place, index) => (
          <div key={index} className="place-card">
            <h3>{place.displayName.text}</h3>
            <p className="address">{place.formattedAddress}</p>
            {place.businessStatus && <span className="status">{place.businessStatus}</span>}
            <div className="actions">
              <a href={place.googleMapsUri} target="_blank" rel="noreferrer">
                Open in Maps
              </a>
            </div>
          </div>
        ))}
        {places.length === 0 && !loading && !error && query && (
          <p className="no-results">No results found. Try a different query.</p>
        )}
      </div>
    </div>
  );
}

export default App;
