import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Tabs, Tab, Card, Pagination, Accordion } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from '../components/Header.tsx';

interface DataType {
  summary: {
    [column: string]: {
      [metric: string]: string | number; // Define the expected type of values in summary
    };
  };
  relationships: {
    [key: string]: {
      [subKey: string]: number | string; // Ensure number for correlations
    };
  };
  data_overview: {
    columns: string[];
    row_count: number;
    data_types: { Column: string; Type: string }[];
  };
  data_quality: {
    null_values: { Column: string; 'Null Count': number }[];
    outliers: { Column: string; 'Outlier Count': number }[];
  };
  data_preview: { [key: string]: string | number }[];
}

const VisualizeResult: React.FC = () => {
  const { upload_id } = useParams<{ upload_id: string }>();
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of rows per page

  useEffect(() => {
    if (!upload_id) {
      setError('Invalid upload_id. Please check the URL.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tableau/visualize/${upload_id}/`);
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch data');
        }
        const result = await response.json();
        setData(result.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [upload_id]);

  useEffect(() => {
    setCurrentPage(1); // Reset pagination when dataset changes
  }, [data]);

  const paginate = (array: any[], currentPage: number, itemsPerPage: number) => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return array.slice(start, end);
  };

  const renderPagination = (dataLength: number) => {
    const totalPages = Math.ceil(dataLength / itemsPerPage);
    if (totalPages <= 1) return null; // No pagination if data fits on one page
  
    return (
      <Pagination className="mt-3">
        <Pagination.First
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        />
        {[...Array(Math.min(totalPages, 10))].map((_, idx) => {
          const page = idx + 1;
          if (currentPage <= 6 || totalPages <= 10 || page <= 5 || page >= totalPages - 4) {
            return (
              <Pagination.Item
                key={page}
                active={page === currentPage}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Pagination.Item>
            );
          }
          if (page === 6 && totalPages > 10 && currentPage > 6) {
            return <Pagination.Ellipsis key="ellipsis-start" disabled />;
          }
        })}
        <Pagination.Next
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        />
        <Pagination.Last
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };
  

  const renderTable = (columns: string[], rows: any[], caption?: string) => (
    <div style={{ overflowX: 'auto' }}>
      <Table striped bordered hover responsive>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {typeof row[col] === 'object'
                    ? JSON.stringify(row[col]) // Handle objects gracefully
                    : row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const renderOverview = () => {
    if (!data) return null;
  
    return (
      <Card>
        <Card.Body>
          <h5>Columns</h5>
          <p>{data.data_overview.columns.join(', ')}</p>
          <h5>Row Count</h5>
          <p>{data.data_overview.row_count}</p>
          <h5>Data Types</h5>
          {renderTable(
            ['Column', 'Type'],
            paginate(
              data.data_overview.data_types.map((entry) => ({
                Column: entry.Column,
                Type: entry.Type,
              })),
              currentPage,
              itemsPerPage
            ),
            'Data Types for Each Column'
          )}
          {renderPagination(data.data_overview.data_types.length)}
        </Card.Body>
      </Card>
    );
  };
  
  

  const renderSummary = () => {
    if (!data) return null;
  
    const summaryData = Object.entries(data.summary).flatMap(([column, summary]) =>
      Object.entries(summary).map(([metric, value]) => ({
        Metric: `${column} - ${metric}`,
        Value: value,
      }))
    );
    const paginatedData = paginate(summaryData, currentPage, itemsPerPage);
  
    return (
      <Card>
        <Card.Body>
          {renderTable(
            ['Metric', 'Value'],
            paginatedData,
            'Statistical Summary (Paginated)'
          )}
          {renderPagination(summaryData.length)}
        </Card.Body>
      </Card>
    );
  };

  const renderRelationships = () => {
    if (!data) return null;
  
    const relationshipsData = Object.entries(data.relationships).flatMap(([key, values]) =>
      Object.entries(values).map(([subKey, subValue]) => ({
        Metric: `${key} ↔ ${subKey}`,
        Value: typeof subValue === 'number' ? subValue.toFixed(3) : subValue,
      }))
    );
    const paginatedData = paginate(relationshipsData, currentPage, itemsPerPage);
  
    return (
      <Card>
        <Card.Body>
          {renderTable(
            ['Metric', 'Value'],
            paginatedData,
            'Correlation between Numeric Columns'
          )}
          {renderPagination(relationshipsData.length)}
        </Card.Body>
      </Card>
    );
  };
  

  const renderQuality = () => {
    if (!data) return null;
  
    return (
      <Card>
        <Card.Body>
          <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>Null Values</Accordion.Header>
              <Accordion.Body>
                {renderTable(
                  ['Column', 'Null Count'],
                  paginate(
                    data.data_quality.null_values.map((entry) => ({
                      Column: entry.Column,
                      'Null Count': entry['Null Count'],
                    })),
                    currentPage,
                    itemsPerPage
                  ),
                  'Null Values in Each Column'
                )}
                {renderPagination(data.data_quality.null_values.length)}
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Outliers</Accordion.Header>
              <Accordion.Body>
                {renderTable(
                  ['Column', 'Outlier Count'],
                  paginate(
                    data.data_quality.outliers.map((entry) => ({
                      Column: entry.Column,
                      'Outlier Count': entry['Outlier Count'],
                    })),
                    currentPage,
                    itemsPerPage
                  ),
                  'Outliers Detected in Each Column'
                )}
                {renderPagination(data.data_quality.outliers.length)}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card.Body>
      </Card>
    );
  };
  
  const renderPreview = () => {
    if (!data || !data.data_preview.length) return null;
  
    return (
      <Card>
        <Card.Body>
          {renderTable(
            Object.keys(data.data_preview[0]), // Dynamically determine columns from the first row
            paginate(data.data_preview, currentPage, itemsPerPage),
            'Sample Data Preview (Paginated)'
          )}
          {renderPagination(data.data_preview.length)}
        </Card.Body>
      </Card>
    );
  };
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <Header />
    <div className="container">
      <h3>Visualization Results</h3>
      <Tabs
        id="controlled-tab-example"
        activeKey={activeTab}
        onSelect={(k) => {
          setActiveTab(k || 'Overview');
          setCurrentPage(1); // Reset pagination on tab change
        }}
        className="mb-3"
      >
        <Tab eventKey="Overview" title="Overview">
          {renderOverview()}
        </Tab>
        <Tab eventKey="Summary" title="Summary">
          {renderSummary()}
        </Tab>
        <Tab eventKey="Relationships" title="Relationships">
          {renderRelationships()}
        </Tab>
        <Tab eventKey="Quality" title="Quality">
          {renderQuality()}
        </Tab>
        <Tab eventKey="Preview" title="Preview">
          {renderPreview()}
        </Tab>
      </Tabs>
    </div>
    </div>
  );
};

export default VisualizeResult;

