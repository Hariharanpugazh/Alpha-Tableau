import React, { useEffect, useState } from "react";

interface ColumnSummary {
  count: number;
  unique: number;
  top: string;
  freq: number;
  mean?: number;
  std?: number;
}

interface ProfilingResult {
  filename: string;
  results: {
    columns: string[];
    row_count: number;
    summary: Record<string, ColumnSummary>;
  };
}

const VisualizeResult: React.FC = () => {
  const [profilingResult, setProfilingResult] = useState<ProfilingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisualizationData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8000/api/tableau/results/");
      const text = await response.text();
      
      // Replace NaN with null to make it valid JSON
      const validJSONString = text.replace(/:\s*NaN/g, ': null');
      const data = JSON.parse(validJSONString);

      if (response.ok && data.data && data.data.length > 0) {
        setProfilingResult(data.data[0]); // Display the first profiling result
      } else {
        setError(data.error || "No profiling data available.");
      }
    } catch (error) {
      console.error("Error fetching profiling data:", error);
      setError("An error occurred while fetching the data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualizationData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-red-600">{error}</div>
      </div>
    );
  }

  if (!profilingResult) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-600">No data available.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Profiling Results</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">File Information</h2>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Filename</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profilingResult.filename}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Row Count</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profilingResult.results.row_count}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Columns</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {profilingResult.results.columns.join(", ")}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Column Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Value</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mean</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Std Dev</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(profilingResult.results.summary).map(([column, details]) => (
                  <tr key={column}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{column}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{details.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{details.unique}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs overflow-hidden overflow-ellipsis">{details.top}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{details.freq}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {details.mean !== null ? details.mean?.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {details.std !== null ? details.std?.toFixed(2) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizeResult;
