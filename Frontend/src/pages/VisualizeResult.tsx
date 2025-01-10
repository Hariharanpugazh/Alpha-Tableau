import React, { useEffect, useState } from "react";

interface ProfilingResult {
  filename: string;
  results: {
    columns: string[];
    row_count: number;
    summary: Record<string, any>;
  };
}

const VisualizeResult: React.FC = () => {
  const [profilingResult, setProfilingResult] = useState<ProfilingResult | null>(null);

  const fetchVisualizationData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/tableau/results/");
      const data = await response.json();

      if (response.ok && data.data && data.data.length > 0) {
        setProfilingResult(data.data[0]); // Display the first profiling result
      } else {
        alert(data.error || "No profiling data available.");
      }
    } catch (error) {
      console.error("Error fetching profiling data:", error);
    }
  };

  useEffect(() => {
    fetchVisualizationData();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Visualization of Profiling Result
        </h2>

        {!profilingResult ? (
          <p className="text-center text-gray-500">No data to visualize.</p>
        ) : (
          <div className="space-y-6">
            {/* Filename */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Filename:</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                {profilingResult.filename}
              </p>
            </div>

            {/* Columns */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Columns:</h3>
              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-gray-600">#</th>
                    <th className="border border-gray-300 px-4 py-2 text-gray-600">Column Name</th>
                  </tr>
                </thead>
                <tbody>
                  {profilingResult.results.columns.map((col, index) => (
                    <tr key={index} className="odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-600">
                        {col}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Row Count */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Row Count:</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                {profilingResult.results.row_count}
              </p>
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Summary:</h3>
              <div className="overflow-x-auto bg-gray-50 p-4 rounded-lg">
                <table className="w-full table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-gray-600">Column</th>
                      <th className="border border-gray-300 px-4 py-2 text-gray-600">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(profilingResult.results.summary).map(([column, details], index) => (
                      <tr key={index} className="odd:bg-white even:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 text-gray-600">
                          {column}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-600">
                          <pre className="text-sm">{JSON.stringify(details, null, 2)}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizeResult;
