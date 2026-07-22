'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const padding = 40;
  const bottomPadding = 50;
  const leftPadding = 50;
  const chartWidth = width - leftPadding - padding;
  const chartHeight = height - padding - bottomPadding;
  const maxValue = Math.max(1, ...digital, ...physical);
  
  // Build points with adjusted padding
  const digitalPoints = labels.length > 0 ? labels.map((_, index) => {
    const x = leftPadding + (chartWidth * index) / Math.max(labels.length - 1, 1);
    const y = padding + (chartHeight * (1 - digital[index] / Math.max(maxValue, 1)));
    return `${x},${y}`;
  }).join(' ') : '';
  
  const physicalPoints = labels.length > 0 ? labels.map((_, index) => {
    const x = leftPadding + (chartWidth * index) / Math.max(labels.length - 1, 1);
    const y = padding + (chartHeight * (1 - physical[index] / Math.max(maxValue, 1)));
    return `${x},${y}`;
  }).join(' ') : '';

  // Y-axis tick marks and labels
  const yTicks = 5;
  const yTickValues: number[] = [];
  for (let i = 0; i <= yTicks; i++) {
    yTickValues.push(Math.round((maxValue * i) / yTicks));
  }

  // X-axis labels (show all if 7 or fewer, otherwise show every nth)
  const maxXLabels = 7;
  const xLabelInterval = labels.length > maxXLabels ? Math.ceil(labels.length / maxXLabels) : 1;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Brochure requests chart">
        {/* Y-axis line */}
        <line 
          x1={leftPadding} 
          y1={padding} 
          x2={leftPadding} 
          y2={height - bottomPadding} 
          stroke="#D6D1CA" 
          strokeWidth="2"
        />
        
        {/* X-axis line */}
        <line 
          x1={leftPadding} 
          y1={height - bottomPadding} 
          x2={width - padding} 
          y2={height - bottomPadding} 
          stroke="#D6D1CA" 
          strokeWidth="2"
        />
        
        {/* Y-axis tick marks and labels */}
        {yTickValues.map((value, i) => {
          const y = padding + (chartHeight * (1 - value / Math.max(maxValue, 1)));
          return (
            <g key={`y-tick-${i}`}>
              <line
                x1={leftPadding - 5}
                y1={y}
                x2={leftPadding}
                y2={y}
                stroke="#D6D1CA"
                strokeWidth="1"
              />
              <text
                x={leftPadding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#666"
                fontFamily="var(--font-body)"
              >
                {value}
              </text>
            </g>
          );
        })}
        
        {/* X-axis tick marks and labels */}
        {labels.map((label, index) => {
          if (index % xLabelInterval !== 0 && index !== labels.length - 1) return null;
          const x = leftPadding + (chartWidth * index) / Math.max(labels.length - 1, 1);
          return (
            <g key={`x-tick-${index}`}>
              <line
                x1={x}
                y1={height - bottomPadding}
                x2={x}
                y2={height - bottomPadding + 5}
                stroke="#D6D1CA"
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - bottomPadding + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
                fontFamily="var(--font-body)"
                transform={label.length > 10 ? `rotate(-45 ${x} ${height - bottomPadding + 20})` : ''}
              >
                {label}
              </text>
            </g>
          );
        })}
        
        {/* Data lines */}
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
  const [datePreset, setDatePreset] = useState<'today' | '7' | '30' | '90' | 'ytd' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [chartData, setChartData] = useState<{ labels: string[]; digital: number[]; physical: number[] }>({
    labels: [],
    digital: [],
    physical: [],
  });
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    name: '',
    message: '',
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');

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

  // Determine period based on date range
  const getPeriod = (start: string, end: string): 'day' | 'week' | 'month' | 'year' => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'day';
    if (diffDays <= 7) return 'day';
    if (diffDays <= 30) return 'day';
    if (diffDays <= 90) return 'week';
    if (diffDays <= 365) return 'month';
    return 'year';
  };

  const fetchChartData = useCallback(async () => {
    setIsChartLoading(true);
    setChartError('');
    try {
      const period = getPeriod(startDate, endDate);
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
  }, [startDate, endDate]);

  useEffect(() => {
    if (!startDate || !endDate) return;
    fetchChartData();
  }, [startDate, endDate, fetchChartData]);

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

  const handleEmailFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear status when user starts typing
    if (emailStatus !== 'idle') {
      setEmailStatus('idle');
      setEmailError('');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate email
    if (!emailFormData.email || !emailFormData.email.includes('@')) {
      setEmailStatus('error');
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus('idle');
    setEmailError('');

    try {
      const response = await fetch('/api/admin/brochure/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailFormData.email.trim(),
          name: emailFormData.name.trim() || undefined,
          message: emailFormData.message.trim() || undefined,
        }),
      });

      if (response.ok) {
        setEmailStatus('success');
        setEmailFormData({ email: '', name: '', message: '' });
        // Clear success message after 5 seconds
        setTimeout(() => setEmailStatus('idle'), 5000);
      } else {
        const error = await response.json();
        setEmailStatus('error');
        setEmailError(error.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending brochure email:', error);
      setEmailStatus('error');
      setEmailError('An error occurred while sending the email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1>Brochure Requests & Settings</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a href="/admin/design-guide" className="btn" style={{ textDecoration: 'none' }}>
            Edit Design Brochure Content
          </a>
          <a href="/experience" target="_blank" rel="noopener noreferrer" className="btn" style={{ textDecoration: 'none', background: 'var(--sbd-brown)' }}>
            View Digital Brochure
          </a>
        </div>
      </div>
      
      <div className="admin-form">
        <div className="form-section">
          <h2>Brochure Requests</h2>

          <div className="chart-controls">
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

      <form onSubmit={handleEmailSubmit} className="admin-form">
        <div className="form-section">
          <h2>Email Brochure</h2>
          <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--warm-grey-3)', fontSize: '14px' }}>
            Send the brochure directly to someone via email. The PDF will be attached and a download link will be included in the email.
          </p>
          
          <div className="form-group">
            <label htmlFor="emailRecipient">Recipient Email *</label>
            <input
              type="email"
              id="emailRecipient"
              name="email"
              value={emailFormData.email}
              onChange={handleEmailFormChange}
              required
              placeholder="recipient@example.com"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--warm-grey-3)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '16px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emailName">Recipient Name (Optional)</label>
            <input
              type="text"
              id="emailName"
              name="name"
              value={emailFormData.name}
              onChange={handleEmailFormChange}
              placeholder="John Doe"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--warm-grey-3)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '16px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emailMessage">Personal Message (Optional)</label>
            <textarea
              id="emailMessage"
              name="message"
              value={emailFormData.message}
              onChange={handleEmailFormChange}
              placeholder="Add a personal note to include in the email..."
              rows={4}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--warm-grey-3)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '16px', resize: 'vertical' }}
            />
          </div>

          {emailStatus === 'success' && (
            <div style={{ padding: '12px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', color: '#155724', marginBottom: 'var(--spacing-md)' }}>
              Brochure sent successfully!
            </div>
          )}

          {emailStatus === 'error' && (
            <div style={{ padding: '12px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', color: '#721c24', marginBottom: 'var(--spacing-md)' }}>
              {emailError || 'Failed to send email. Please try again.'}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn" disabled={isSendingEmail}>
              {isSendingEmail ? 'Sending...' : 'Send Brochure'}
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

        @media (max-width: 768px) {
          .admin-form {
            padding: var(--spacing-xs);
            border-radius: 4px;
            margin-bottom: var(--spacing-md);
          }

          .chart-wrapper {
            padding: var(--spacing-xs);
          }
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

        @media (max-width: 768px) {
          .chart-controls {
            grid-template-columns: 1fr;
          }

          .control-group select,
          .control-group input[type='date'] {
            min-height: 44px;
            font-size: 16px;
            width: 100%;
          }

          .date-range {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
          }
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
