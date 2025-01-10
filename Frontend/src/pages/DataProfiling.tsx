import React, { useState, useEffect } from "react";

interface ProfilingResult {
  filename: string;
  results: {
    columns: string[];
    row_count: number;
    summary: Record<string, any>;
  };
}

const DataProfiling: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [profilingResults, setProfilingResults] = useState<ProfilingResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProfilingResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("dataset", file);

    try {
      const response = await fetch("http://localhost:8000/api/tableau/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        alert("File uploaded successfully!");
        fetchProfilingResults(); // Refresh results after upload
      } else {
        alert(data.error || "File upload failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const fetchProfilingResults = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/tableau/results/", {
        method: "GET",
      });
      const data = await response.json();
      if (response.ok) {
        setProfilingResults(data.data || []);
      } else {
        alert(data.error || "Failed to fetch profiling results.");
      }
    } catch (error) {
      console.error("Error fetching profiling results:", error);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/tableau/delete/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("File profiling result deleted successfully!");
        fetchProfilingResults(); // Refresh results after deletion
      } else {
        alert(data.error || "Failed to delete profiling result.");
      }
    } catch (error) {
      console.error("Error deleting profiling result:", error);
    }
  };

  const viewDetails = (result: ProfilingResult) => {
    setSelectedResult(result);
  };

  useEffect(() => {
    fetchProfilingResults(); // Fetch results on page load
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Data Profiling
        </h2>

        {/* Upload Section */}
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Upload File
          </button>
        </form>

        {/* Profiling Results */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Profiling Results</h3>
          {profilingResults.length === 0 ? (
            <p>No results available.</p>
          ) : (
            <ul className="space-y-2">
              {profilingResults.map((result, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow"
                >
                  <span className="font-medium text-gray-700">{result.filename}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewDetails(result)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(result.filename)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Display Selected Profiling Result */}
      {selectedResult && (
        <div className="w-full max-w-2xl mt-8 p-6 bg-white shadow-lg rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Details for: {selectedResult.filename}</h3>
          <div>
            <h4 className="text-lg font-semibold">Columns:</h4>
            <ul className="list-disc list-inside">
              {selectedResult.results.columns.map((col, index) => (
                <li key={index}>{col}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <h4 className="text-lg font-semibold">Row Count:</h4>
            <p>{selectedResult.results.row_count}</p>
          </div>
          <div className="mt-4">
            <h4 className="text-lg font-semibold">Summary:</h4>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(selectedResult.results.summary, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataProfiling;
