import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import Papa from 'papaparse';

interface DistrictMetric {
  state_name: string;
  district_name: string;
  area_sq_km: number;
  perimeter_km: number;
  compactness: number;
  bbox_xmin: number;
  bbox_ymin: number;
  bbox_xmax: number;
  bbox_ymax: number;
  centroid_lon: number;
  centroid_lat: number;
  num_vertices: number;
}

type SortField = 'state_name' | 'district_name' | 'area_sq_km' | 'perimeter_km' | 'compactness';
type SortDirection = 'asc' | 'desc' | null;

interface DistrictStatsProps {
  darkMode?: boolean;
}

const SHAPEFILE_OPTIONS = [
  { id: 'LGD_Districts', name: 'LGD Districts (Current)', description: '785 districts' },
  { id: 'India-soi-districts', name: 'Survey of India Districts', description: '742 districts' },
  { id: 'India-bhuvan-districts', name: 'Bhuvan Districts', description: '663 districts' },
  { id: 'India-2011-districts', name: 'India 2011 Census', description: '641 districts' },
  { id: 'India_NFHS5_districts', name: 'NFHS-5 Districts', description: '711 districts' },
  { id: 'India_NFHS4_districts', name: 'NFHS-4 Districts', description: '642 districts' },
  { id: 'India-2001-districts', name: 'India 2001 Census', description: '594 districts' },
  { id: 'India-1991-districts', name: 'India 1991 Census', description: '478 districts' },
  { id: 'India-1981-districts', name: 'India 1981 Census', description: '413 districts' },
  { id: 'India-1961-districts', name: 'India 1961 Census', description: '382 districts' },
  { id: 'India-1971-districts', name: 'India 1971 Census', description: '357 districts' },
  { id: 'India-1951-districts', name: 'India 1951 Census', description: '348 districts' },
  { id: 'India-1941-districts', name: 'India 1941 Census', description: '431 districts' },
];

export const DistrictStats: React.FC<DistrictStatsProps> = ({ darkMode = false }) => {
  const [selectedShapefile, setSelectedShapefile] = useState<string>('LGD_Districts');
  const [data, setData] = useState<DistrictMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Load CSV data when shapefile selection changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const csvPath = `/district-stats/${selectedShapefile}_metrics.csv`;
        const response = await fetch(csvPath);

        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }

        const csvText = await response.text();

        Papa.parse<DistrictMetric>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data as DistrictMetric[]);
            setLoading(false);
            setCurrentPage(1); // Reset to first page
          },
          error: (err) => {
            setError(`Error parsing CSV: ${err.message}`);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadData();
  }, [selectedShapefile]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (row) =>
          row.state_name?.toLowerCase().includes(query) ||
          row.district_name?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return result;
  }, [data, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 ml-1" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4 ml-1" />;
    }
    return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredAndSortedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedShapefile}_filtered_metrics.csv`;
    link.click();
  };

  // Format number with commas
  const formatNumber = (num: number, decimals: number = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className={`p-6 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          District Statistics
        </h2>
        <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Explore geometric metrics for Indian districts across different shapefiles.
          Metrics include area, perimeter, compactness score, and geographic coordinates.
        </p>

        {/* Shapefile Selector */}
        <div className="mb-4">
          <Label htmlFor="shapefile-select" className="text-sm font-medium mb-2 block">
            Select Shapefile
          </Label>
          <Select value={selectedShapefile} onValueChange={setSelectedShapefile}>
            <SelectTrigger id="shapefile-select" className="w-full max-w-lg">
              <SelectValue placeholder="Select a shapefile" />
            </SelectTrigger>
            <SelectContent>
              {SHAPEFILE_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.name}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <Label htmlFor="search" className="text-sm font-medium mb-2 block">
            Search
          </Label>
          <div className="relative max-w-lg">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <Input
              id="search"
              type="text"
              placeholder="Search by state or district name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Summary */}
        {!loading && data.length > 0 && (
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {paginatedData.length} of {filteredAndSortedData.length} districts
              {searchQuery && ` (filtered from ${data.length} total)`}
            </div>
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className={`p-12 text-center border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333] text-gray-400' : 'bg-white border-gray-200 text-gray-600'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Loading district metrics...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`p-6 border rounded-lg ${darkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <p className="font-semibold mb-2">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && data.length > 0 && (
        <div className={`border rounded-lg overflow-hidden ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    onClick={() => handleSort('state_name')}
                  >
                    <div className="flex items-center">
                      State
                      {getSortIcon('state_name')}
                    </div>
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    onClick={() => handleSort('district_name')}
                  >
                    <div className="flex items-center">
                      District
                      {getSortIcon('district_name')}
                    </div>
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    onClick={() => handleSort('area_sq_km')}
                  >
                    <div className="flex items-center justify-end">
                      Area (km²)
                      {getSortIcon('area_sq_km')}
                    </div>
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    onClick={() => handleSort('perimeter_km')}
                  >
                    <div className="flex items-center justify-end">
                      Perimeter (km)
                      {getSortIcon('perimeter_km')}
                    </div>
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    onClick={() => handleSort('compactness')}
                  >
                    <div className="flex items-center justify-end">
                      Compactness
                      {getSortIcon('compactness')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                {paginatedData.map((row, idx) => (
                  <tr
                    key={`${row.state_name}-${row.district_name}-${idx}`}
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className={`px-4 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {row.state_name || 'N/A'}
                    </td>
                    <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                      {row.district_name || 'N/A'}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-mono ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                      {formatNumber(row.area_sq_km, 2)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-mono ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                      {formatNumber(row.perimeter_km, 2)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-mono ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                      {formatNumber(row.compactness, 4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-4 py-3 border-t flex items-center justify-between ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border text-sm transition-colors ${
                    currentPage === 1
                      ? darkMode
                        ? 'border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : darkMode
                      ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border text-sm transition-colors ${
                    currentPage === totalPages
                      ? darkMode
                        ? 'border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : darkMode
                      ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
