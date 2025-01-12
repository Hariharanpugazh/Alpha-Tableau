import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const VisualizeResult: React.FC = () => {
  const { upload_id } = useParams<{ upload_id: string }>(); // Extract upload_id from URL
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("overview"); // Default tab
  const [currentPage, setCurrentPage] = useState<number>(1); // Pagination

  const itemsPerPage = 10; // Number of rows per page

  useEffect(() => {
    const fetchVisualizationData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/tableau/visualize/${upload_id}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to fetch data");
        }

        const result = await response.json();
        setData(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisualizationData();
  }, [upload_id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  // Pagination Logic
  const paginate = (array: any[]) => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return array.slice(start, end);
  };

  const renderTable = (headers: string[], rows: any[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-2 border bg-gray-200 text-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginate(rows).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, colIndex) => (
                <td key={colIndex} className="px-4 py-2 border">
                  {row[header] || "N/A"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderFormattedJSON = (jsonData: any) => (
    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
      {JSON.stringify(jsonData, null, 2)}
    </pre>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div>
            <p>
              <strong>Columns:</strong> {data.data_overview.columns.join(", ")}
            </p>
            <p>
              <strong>Row Count:</strong> {data.data_overview.row_count}
            </p>
            <p>
              <strong>Data Types:</strong>{" "}
              {renderFormattedJSON(data.data_overview.data_types)}
            </p>
          </div>
        );
      case "summary":
        return renderTable(
          Object.keys(data.summary),
          Object.values(data.summary)
        );
      case "relationships":
        return renderTable(
          Object.keys(data.relationships),
          Object.values(data.relationships).map((row: any) =>
            Object.fromEntries(
              Object.entries(row).map(([key, value]) => [
                key,
                (value as number).toFixed(2),
              ])
            )
          )
        );
      case "quality":
        return (
          <div>
            <p>
              <strong>Duplicates:</strong> {data.data_quality.duplicates}
            </p>
            <p>
              <strong>Null Values:</strong>{" "}
              {renderFormattedJSON(data.data_quality.null_values)}
            </p>
            <p>
              <strong>Outliers:</strong>{" "}
              {renderFormattedJSON(data.data_quality.outliers)}
            </p>
          </div>
        );
      case "preview":
        return renderTable(
          Object.keys(data.data_preview[0]),
          data.data_preview
        );
      default:
        return <p>Select a tab to view content.</p>;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <header className="w-full max-w-6xl flex items-center justify-between bg-white shadow p-4 rounded-md">
        <h1 className="text-xl font-semibold text-gray-700">
          Visualization Results
        </h1>
      </header>

      {/* Tab Navigation */}
      <nav className="w-full max-w-6xl flex justify-around bg-white shadow p-4 mt-6 rounded-md">
        {["overview", "summary", "relationships", "quality", "preview"].map(
          (tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-gray-700 ${
                activeTab === tab ? "border-b-2 border-blue-500" : ""
              }`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1); // Reset pagination on tab change
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </nav>

      <div className="w-full max-w-6xl bg-white rounded-lg shadow-md p-6 mt-6">
        {renderContent()}
      </div>

      {/* Pagination Controls */}
      {["summary", "relationships", "preview"].includes(activeTab) && (
        <div className="flex justify-between w-full max-w-6xl mt-4">
          <button
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </button>
          <button
            disabled={currentPage * itemsPerPage >= (data[activeTab]?.length || 0)}
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualizeResult;

