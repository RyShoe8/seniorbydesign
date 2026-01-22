'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface DashboardStats {
  portfolio: number;
  services: number;
  teamMembers: number;
  projects: number;
  blogPosts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    portfolio: 0,
    services: 0,
    teamMembers: 0,
    projects: 0,
    blogPosts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [portfolioRes, servicesRes, teamRes, projectsRes, blogRes] = await Promise.all([
        fetch('/api/admin/portfolio'),
        fetch('/api/admin/services'),
        fetch('/api/admin/team'),
        fetch('/api/admin/projects'),
        fetch('/api/admin/blog'),
      ]);

      const portfolio = portfolioRes.ok ? (await portfolioRes.json()).length : 0;
      const services = servicesRes.ok ? (await servicesRes.json()).length : 0;
      const teamMembers = teamRes.ok ? (await teamRes.json()).length : 0;
      const projects = projectsRes.ok ? (await projectsRes.json()).length : 0;
      const blogPosts = blogRes.ok ? (await blogRes.json()).length : 0;

      setStats({
        portfolio,
        services,
        teamMembers,
        projects,
        blogPosts,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to the Senior By Design admin panel.</p>
      
      <div className={styles.dashboardStats}>
        <div className={styles.statCard}>
          <h3>Portfolio Items</h3>
          <p className={styles.statNumber}>{isLoading ? '-' : stats.portfolio}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Services</h3>
          <p className={styles.statNumber}>{isLoading ? '-' : stats.services}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Team Members</h3>
          <p className={styles.statNumber}>{isLoading ? '-' : stats.teamMembers}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Projects</h3>
          <p className={styles.statNumber}>{isLoading ? '-' : stats.projects}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Blog Posts</h3>
          <p className={styles.statNumber}>{isLoading ? '-' : stats.blogPosts}</p>
        </div>
      </div>
    </div>
  );
}

