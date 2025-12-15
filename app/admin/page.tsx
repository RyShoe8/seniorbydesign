export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to the Senior By Design admin panel.</p>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Portfolio Items</h3>
          <p className="stat-number">-</p>
        </div>
        <div className="stat-card">
          <h3>Services</h3>
          <p className="stat-number">-</p>
        </div>
        <div className="stat-card">
          <h3>Team Members</h3>
          <p className="stat-number">-</p>
        </div>
        <div className="stat-card">
          <h3>Projects</h3>
          <p className="stat-number">-</p>
        </div>
      </div>

      <style jsx>{`
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
        }

        .stat-card {
          background: #fff;
          padding: var(--spacing-md);
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .stat-card h3 {
          font-size: 18px;
          margin-bottom: var(--spacing-sm);
          color: var(--warm-grey-3);
        }

        .stat-number {
          font-size: 36px;
          font-weight: bold;
          color: var(--sbd-brown);
        }
      `}</style>
    </div>
  );
}

