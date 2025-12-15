import styles from './page.module.css';

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to the Senior By Design admin panel.</p>
      
      <div className={styles.dashboardStats}>
        <div className={styles.statCard}>
          <h3>Portfolio Items</h3>
          <p className={styles.statNumber}>-</p>
        </div>
        <div className={styles.statCard}>
          <h3>Services</h3>
          <p className={styles.statNumber}>-</p>
        </div>
        <div className={styles.statCard}>
          <h3>Team Members</h3>
          <p className={styles.statNumber}>-</p>
        </div>
        <div className={styles.statCard}>
          <h3>Projects</h3>
          <p className={styles.statNumber}>-</p>
        </div>
      </div>
    </div>
  );
}

