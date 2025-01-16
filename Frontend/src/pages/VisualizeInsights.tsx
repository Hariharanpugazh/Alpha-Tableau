import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header.tsx';
import { Chart as ChartJS, Tooltip, Legend, ArcElement, Title, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Sparklines, SparklinesLine } from 'react-sparklines-typescript';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement, Title);

const BasicInfo: React.FC<{ basicInfo: any; missingValues: any }> = ({ basicInfo, missingValues }) => {
    // Calculate missing data summary
    const missingDataSummary = Object.entries(missingValues || {}).filter(
      ([, value]: [string, unknown]) => typeof value === 'number' && value > 0
    );
  
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Rows */}
          <div className="bg-blue-100 p-4 rounded-lg shadow-md">
            <p className="text-gray-600 font-semibold">Total Rows</p>
            <p className="text-xl font-bold text-blue-800">{basicInfo?.row_count || 0}</p>
          </div>
          {/* Total Columns */}
          <div className="bg-green-100 p-4 rounded-lg shadow-md">
            <p className="text-gray-600 font-semibold">Total Columns</p>
            <p className="text-xl font-bold text-green-800">{basicInfo?.column_count || 0}</p>
          </div>
          {/* Missing Data */}
          <div className="bg-red-100 p-4 rounded-lg shadow-md col-span-1 sm:col-span-2">
            <p className="text-gray-600 font-semibold">Missing Information</p>
            {missingDataSummary.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-700">
                {missingDataSummary.map(([column, value]) => (
                  <li key={column}>
                    {column}: <span className="font-bold">{value as number}</span> missing values
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">No missing values found.</p>
            )}
          </div>
          {/* Column List */}
          <div className="col-span-1 sm:col-span-2">
            <p className="text-gray-600 font-semibold">Columns</p>
            <p className="text-sm text-gray-700">{basicInfo?.columns?.join(', ') || 'No data available'}</p>
          </div>
        </div>
      </div>
    );
  };

  const NumericSummary: React.FC<{ numericSummary: any }> = ({ numericSummary }) => (
    <div className="mb-8 overflow-y-auto max-h-64">
      <h3 className="text-lg font-semibold text-gray-700">Numeric Summary</h3>
      <table className="table-auto w-full text-sm text-gray-600 mt-2">
        <thead>
          <tr>
            <th className="border px-4 py-2">Column</th>
            <th className="border px-4 py-2">Mean</th>
            <th className="border px-4 py-2">Median</th>
            <th className="border px-4 py-2">Min</th>
            <th className="border px-4 py-2">Max</th>
            <th className="border px-4 py-2">Visualization</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(numericSummary || {}).map(([column, stats]: any) => (
            <tr key={column}>
              <td className="border px-4 py-2">{column}</td>
              <td className="border px-4 py-2">{stats?.mean?.toFixed(2) || 'N/A'}</td>
              <td className="border px-4 py-2">{stats?.median?.toFixed(2) || 'N/A'}</td>
              <td className="border px-4 py-2">{stats?.min || 'N/A'}</td>
              <td className="border px-4 py-2">{stats?.max || 'N/A'}</td>
              <td className="border px-4 py-2">
                <Sparklines data={[stats?.min || 0, stats?.mean || 0, stats?.median || 0, stats?.max || 0]}>
                  <SparklinesLine color="blue" />
                </Sparklines>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

const Correlations: React.FC<{ correlations: any }> = ({ correlations }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-700">Correlations</h3>
    <div className="overflow-x-auto">
      <Bar
        data={{
          labels: Object.keys(correlations),
          datasets: Object.entries(correlations).map(([key, value]: any) => ({
            label: key,
            data: Object.values(value),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          })),
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Correlations Matrix',
            },
          },
        }}
      />
    </div>
  </div>
);

const FrequentValues: React.FC<{ frequentValues: any }> = ({ frequentValues }) => (
    <div className="mb-8 overflow-y-auto max-h-64">
      <h3 className="text-lg font-semibold text-gray-700">Frequent Values</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(frequentValues || {}).map(([column, values]: any) => (
          <div key={column} className="w-full h-48">
            <h4 className="font-semibold text-gray-600 text-center">{column}</h4>
            <Pie
              data={{
                labels: Object.keys(values),
                datasets: [
                  {
                    data: Object.values(values),
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.2)',
                      'rgba(54, 162, 235, 0.2)',
                      'rgba(255, 206, 86, 0.2)',
                      'rgba(75, 192, 192, 0.2)',
                      'rgba(153, 102, 255, 0.2)',
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 10 } } },
                },
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
  

  const DataPreview: React.FC<{ dataPreview: any }> = ({ dataPreview }) => (
    <div className="mb-8 overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-700">Data Preview</h3>
      <table className="table-auto w-full text-sm text-gray-600 mt-2">
        <thead>
          <tr>
            {Object.keys(dataPreview?.[0] || {}).map((key) => (
              <th key={key} className="border px-4 py-2">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataPreview?.map((row: any, index: number) => (
            <tr key={index}>
              {Object.values(row).map((value, idx) => (
                <td key={idx} className="border px-4 py-2">{String(value) || 'N/A'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

const VisualizeInsights: React.FC = () => {
  const { upload_id } = useParams<{ upload_id: string }>();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tableau/get_insight_data/${upload_id}/`);
        if (!response.ok) {
          throw new Error('Failed to fetch insights.');
        }
        const data = await response.json();
        setInsights(data.data);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setError('Failed to fetch data insights.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [upload_id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100">
        <Header />
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mt-20"></div>
        <p className="mt-4 text-gray-600">Loading insights, please wait...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100">
        <Header />
        <p className="text-red-600 text-lg mt-20">{error}</p>
      </div>
    );
  }

  const { basic_info, numeric_summary, frequent_values, missing_values, correlations, data_preview } = insights;

  return (
    <div>
      <Header />
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Data Insights</h2>
          <BasicInfo basicInfo={basic_info} missingValues={missing_values} />
          <NumericSummary numericSummary={numeric_summary} />
          <FrequentValues frequentValues={frequent_values} />
          <Correlations correlations={correlations} />
          <DataPreview dataPreview={data_preview} />
        </div>
      </div>
    </div>
  );
};

export default VisualizeInsights;
