'use client';

import { useState, useEffect } from 'react';

interface Row {
  [key: string]: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const csvDescriptions: Record<Difficulty, string> = {
  easy: 'For easy rerolls!',
  medium: 'Meh',
  hard: 'These results have been recorded on a 750~ Monk. Your kills/hr may differ depending on your level, vocation and skill.',
};

export default function Home() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [data, setData] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    const loadCSV = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/easy.csv`);
        if (!response.ok) throw new Error('Failed to fetch CSV');
        
        const csv = await response.text();
        const lines = csv.trim().split('\n');
        
        if (lines.length === 0) throw new Error('CSV is empty');
        
        // Parse headers
        const headerRow = lines[0].split(',').map(h => h.trim());
        setHeaders(headerRow);
        
        // Parse data rows
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headerRow.reduce((obj: Row, header, idx) => {
            obj[header] = values[idx] || '';
            return obj;
          }, {} as Row);
        });
        
        setData(rows);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadCSV();
  }, [difficulty]);

  // Filter data based on search query
  const filteredData = data.filter(row =>
    row.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CSV Data Table</h1>
        
        {/* Difficulty Tabs */}
        <div className="flex gap-4 mb-6">
          {(['easy', 'medium', 'hard'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => {
                setDifficulty(diff);
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                difficulty === diff
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-900">{csvDescriptions[difficulty]}</p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <p className='text-blue-900'>Search by Creature:</p>
          <input
            type="text"
            placeholder="Search by Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">Loading CSV data...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-600">Error: {error}</p>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {headers.map((header) => (
                            <td
                              key={`${idx}-${header}`}
                              className="px-6 py-4 text-sm text-gray-700"
                            >
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={headers.length} className="px-6 py-4 text-center text-gray-500">
                          No results found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Info and Controls */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {paginatedData.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} rows
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}