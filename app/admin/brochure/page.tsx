'use client';

import { useState, useEffect } from 'react';

interface BrochureSettings {
  _id?: string;
  allowMailRequests: boolean;
  updatedAt?: string;
}

function buildPoints(values: number[], maxValue: number, width: number, height: number, padding: number) {
  if (values.length === 0) return '';
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  return values
    .map((value, index) => {
      const x = padding + (usableWidth * index) / Math.max(values.length - 1, 1);
      const y = padding + (usableHeight * (1 - value / Math.max(maxValue, 1)));
      return `${x},${y}`;
    })
    .join(' ');
}

function BrochureRequestsChart({
  labels,
  digital,
  physical,
}: {
  labels: string[];
  digital: number[];
  physical: number[];
}) {
  const width = 600;
  const height = 240;
  const padding = 30;
  const maxValue = Math.max(1, ...digital, ...physical);
  const digitalPoints = buildPoints(digital, maxValue, width, height, padding);
  const physicalPoints = buildPoints(physical, maxValue, width, height, padding);
  const firstLabel = labels[0];
  const lastLabel = labels[labels.length - 1];

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Brochure requests chart">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#D6D1CA" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#D6D1CA" />
        {digitalPoints && (
          <polyline
            points={digitalPoints}
            fill="none"
            stroke="var(--sbd-gold)"
            strokeWidth="3"
          />
        )}
        {physicalPoints && (
          <polyline
            points={physicalPoints}
            fill="none"
            stroke="var(--sbd-brown)"
            strokeWidth="3"
          />
        )}
      </svg>
      <div className="chart-axis">
        <span>{firstLabel}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
}

export default function BrochureManagement() {
  const [settings, setSettings] = useState<BrochureSettings>({
    allowMailRequests: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState('');
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [datePreset, setDatePreset] = useState<'today' | '7' | '30' | '90' | 'ytd' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [chartData, setChartData] = useState<{ labels: string[]; digital: number[]; physical: number[] }>({
    labels: [],
    digital: [],
    physical: [],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const now = new Date();
    if (datePreset === 'today') {
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const todayStr = today.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (datePreset === 'ytd') {
      const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (datePreset === '7' || datePreset === '30' || datePreset === '90') {
      const days = parseInt(datePreset, 10);
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      start.setUTCDate(start.getUTCDate() - (days - 1));
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  }, [datePreset]);

  useEffect(() => {
    if (!startDate || !endDate) return;
    fetchChartData();
  }, [period, startDate, endDate]);

  const fetchChartData = async () => {
    setIsChartLoading(true);
    setChartError('');
    try {
      const response = await fetch(
        `/api/admin/brochure/requests?period=${period}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch brochure requests');
      }
      const data = await response.json();
      setChartData({
        labels: data.labels || [],
        digital: data.digital || [],
        physical: data.physical || [],
      });
    } catch (error) {
      setChartError('Unable to load brochure request data.');
    } finally {
      setIsChartLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/brochure');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching brochure settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Brochure settings saved successfully!');
        fetchSettings();
      } else {
        alert('Error saving brochure settings');
      }
    } catch (error) {
      console.error('Error saving brochure settings:', error);
      alert('Error saving brochure settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      allowMailRequests: e.target.checked,
    });
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h1>Brochure Settings</h1>
        <a href="/brochure/view" target="_blank" rel="noopener noreferrer" className="btn" style={{ textDecoration: 'none' }}>
          View Brochure
        </a>
      </div>
      
      <div className="admin-form">
        <div className="form-section">
          <h2>Brochure Requests</h2>

          <div className="chart-controls">
            <div className="control-group">
              <label htmlFor="period">Period</label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month' | 'year')}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="preset">Date Range</label>
              <select
                id="preset"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as 'today' | '7' | '30' | '90' | 'ytd' | 'custom')}
              >
                <option value="today">Today</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="ytd">Year to date</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {datePreset === 'custom' && (
              <div className="control-group date-range">
                <label htmlFor="startDate">Start</label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <label htmlFor="endDate">End</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {chartError && <p className="chart-error">{chartError}</p>}

          {isChartLoading ? (
            <p>Loading chart...</p>
          ) : (
            <div className="chart-wrapper">
              {chartData.labels.length === 0 ? (
                <p className="empty-state">No brochure requests for this range yet.</p>
              ) : (
                <>
                  <BrochureRequestsChart
                    labels={chartData.labels}
                    digital={chartData.digital}
                    physical={chartData.physical}
                  />
                  <div className="chart-legend">
                    <span className="legend-item">
                      <span className="legend-dot legend-digital" />
                      Digital ({chartData.digital.reduce((sum, value) => sum + value, 0)})
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot legend-physical" />
                      Mail ({chartData.physical.reduce((sum, value) => sum + value, 0)})
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-section">
          <h2>Brochure Request Options</h2>
          
          <div className="form-group">
            <label htmlFor="allowMailRequests" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="allowMailRequests"
                checked={settings.allowMailRequests}
                onChange={handleToggle}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span>Allow users to request brochure by mail</span>
            </label>
            <p style={{ marginTop: '0.5rem', fontSize: '14px', color: 'var(--warm-grey-3)', marginLeft: '28px' }}>
              {settings.allowMailRequests 
                ? 'Users can choose to download the brochure digitally or request a physical copy by mail.'
                : 'Users can only download the brochure digitally. The mail request option will be hidden.'}
            </p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>

      <style jsx>{`
        .admin-form {
          background: #fff;
          padding: var(--spacing-xl);
          border-radius: 8px;
          margin-bottom: var(--spacing-xl);
        }

        .form-section {
          margin-bottom: var(--spacing-xl);
        }

        .form-section h2 {
          margin-bottom: var(--spacing-md);
          color: var(--sbd-brown);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .chart-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-group select,
        .control-group input[type='date'] {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          font-family: inherit;
        }

        .date-range {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          align-items: center;
        }

        .chart-wrapper {
          background: #fff;
          border: 1px solid var(--warm-grey-1);
          border-radius: 8px;
          padding: var(--spacing-md);
        }

        .chart svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .chart-axis {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--warm-grey-3);
          margin-top: 0.5rem;
        }

        .chart-legend {
          display: flex;
          gap: var(--spacing-md);
          margin-top: var(--spacing-sm);
          flex-wrap: wrap;
          font-size: 14px;
          color: var(--warm-grey-3);
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .legend-digital {
          background: var(--sbd-gold);
        }

        .legend-physical {
          background: var(--sbd-brown);
        }

        .chart-error {
          color: #dc3545;
          margin-bottom: var(--spacing-sm);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          background-color: var(--sbd-gold);
          color: #fff;
        }

        .btn:hover:not(:disabled) {
          background-color: var(--sbd-brown);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
