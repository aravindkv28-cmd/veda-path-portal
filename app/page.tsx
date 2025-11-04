// app/page.js
"use client";

import { useState } from 'react';

export default function Home() {
  // State for the search bar
  const [searchInput, setSearchInput] = useState('');
  // State to hold our search results
  const [results, setResults] = useState([]);
  // State to know if we are currently searching
  const [isLoading, setIsLoading] = useState(false);
  // State to track if a search has been performed
  const [hasSearched, setHasSearched] = useState(false);

  // This function now talks to our new API
  const handleSearch = async () => {
    if (!searchInput) return; // Don't search if the bar is empty

    setIsLoading(true); // Start the loading spinner
    setResults([]); // Clear old results
    setHasSearched(true); // Mark that a search has been attempted

    try {
      // 1. Call our new backend API route
      const response = await fetch(`/api/search?query=${searchInput}`);
      const data = await response.json();
      // 2. Store the results from the API
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch search results:", error);
    }

    setIsLoading(false); // Stop the loading spinner
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-12 sm:p-24">
      
      {/* 1. The Title (You can change this to your favorite name) */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8">
        VedaPath Portal
      </h1>
      
      {/* 2. The Search Area */}
      <div className="w-full max-w-2xl">
        <div className="relative flex rounded-md shadow-sm">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            // Allows pressing Enter to search
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="block w-full rounded-l-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            placeholder="Enter an Ayurvedic term or symptom (e.g., 'fever')"
          />
          <button
            onClick={handleSearch}
            className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Search
          </button>
        </div>
      </div>
      
      {/* 3. The Results Area */}
      <div className="w-full max-w-2xl mt-10">
        {/* Show a loading message while searching */}
        {isLoading && <p className="text-center text-gray-500">Loading...</p>}
        
        {/* Show the results once they are loaded */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Results:</h2>
            {/* Loop over each result and display it */}
            {results.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-indigo-700">{item.disease_name} / {item.ayurvedic_term}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>SNOMED CT Code:</strong> {item.snomed_code}
                </p>
                <p className="text-gray-700 mt-2">
                  {item.patient_explanation}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {/* Show a "no results" message if needed */}
        {!isLoading && results.length === 0 && hasSearched && (
          <p className="text-center text-gray-500">No results found for "{searchInput}"</p>
        )}
      </div>

    </main>
  );
}