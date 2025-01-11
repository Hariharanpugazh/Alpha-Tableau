import React, { useState } from "react";

const DataProfile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilingResults, setProfilingResults] = useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
        setError("Please select a file to upload.");
        return;
    }

    const formData = new FormData();
    formData.append("dataset", file); // Ensure the key matches the backend ('dataset').

    try {
        const response = await fetch("http://localhost:8000/api/tableau/upload_data/", {
            method: "POST",
            body: formData,
            headers: {
                // Remove 'Content-Type' so the browser sets it as `multipart/form-data`.
                // Otherwise, the boundary might be missing.
            },
            credentials: "include", // Include cookies if needed.
        });

        const data = await response.json();
        if (!response.ok) {
            setError(data.error || "Failed to upload the file.");
        } else {
            setError(null);
            alert("File uploaded successfully!");
        }
    } catch (err) {
        setError("An error occurred during the upload.");
    }
};

  const fetchProfilingResults = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/tableau/get_profiling_results/", {
        method: "GET",
        credentials: "include", // Include JWT cookie
      });

      const data = await response.json();
      if (response.ok) {
        setProfilingResults(data.data);
      } else {
        setError(data.error || "Failed to fetch profiling results.");
      }
    } catch (err) {
      setError("An error occurred while fetching profiling results.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">Data Profiling</h1>

      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Upload a Data File</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <input
            type="file"
            accept=".csv, .xlsx"
            onChange={handleFileChange}
            className="border rounded-lg p-2 w-full"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`bg-indigo-600 text-white px-4 py-2 rounded-lg ${
            isUploading ? "opacity-50" : "hover:bg-indigo-700"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {profilingResults && (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-4xl mt-6">
          <h2 className="text-xl font-semibold mb-4">Profiling Results</h2>
          <table className="table-auto w-full text-left border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Column</th>
                <th className="border border-gray-300 px-4 py-2">Data Type</th>
                <th className="border border-gray-300 px-4 py-2">Null Count</th>
                <th className="border border-gray-300 px-4 py-2">Unique Values</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(profilingResults).map((column) => (
                <tr key={column}>
                  <td className="border border-gray-300 px-4 py-2">{column}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {profilingResults[column].type || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {profilingResults[column].null_count || 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {profilingResults[column].unique_values || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataProfile;
