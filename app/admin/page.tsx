'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true); setError('');
    try {
      const [portfolioRes, servicesRes, teamRes, projectsRes, blogRes] = await Promise.all([
        fetch('/api/admin/portfolio'),
        fetch('/api/admin/services'),
        fetch('/api/admin/team'),
        fetch('/api/admin/projects'),
        fetch('/api/admin/blog'),
      ]);

      if ([portfolioRes, servicesRes, teamRes, projectsRes, blogRes].some(r => !r.ok)) throw new Error('Dashboard data could not be loaded.');
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
      setError('Dashboard data could not be loaded. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const counts = [
    {key:'portfolio', label:'Portfolio categories', href:'/admin/portfolio'},
    {key:'services', label:'Services', href:'/admin/services'},
    {key:'teamMembers', label:'Team profiles', href:'/admin/team'},
    {key:'projects', label:'Map locations', href:'/admin/projects'},
    {key:'blogPosts', label:'Journal posts', href:'/admin/blog'},
  ] as const;
  return <div className="admin-dashboard">
    <div className={styles.welcome}><div><span className={styles.eyebrow}>THE SBD WORKSPACE</span><h1>A thoughtful space<br/>to manage your brand.</h1><p>Keep your stories, spaces, and people up to date.<br/>Everything you need is right here.</p></div><Link href="/admin/design-guide" className={styles.featureLink}><span>FEATURED WORKSPACE</span><h2>The digital brochure</h2><p>Shape the story, refine the details,<br/>and bring the SBD experience to life.</p><strong>Open brochure builder ↗</strong></Link></div>
    {error && <p role="alert">{error} <button className="btn-secondary" onClick={fetchStats}>Retry</button></p>}
    <div className={styles.sectionHeading}><h2>Your website at a glance</h2><span>Live content totals</span></div>
    <div className={styles.dashboardStats}>{counts.map(item => <Link href={item.href} className={styles.statCard} key={item.key}><span>{item.label}</span><strong>{isLoading || error ? '—' : stats[item.key]}</strong><small>Manage <span aria-hidden="true">↗</span></small></Link>)}</div>
    <div className={styles.sectionHeading}><h2>Make your next update</h2><span>Start with a task</span></div>
    <div className={styles.taskGrid}>{[
      {href:'/admin/portfolio',icon:'01',title:'Showcase your work',text:'Organize portfolio photography and add descriptive image captions.'},
      {href:'/admin/blog',icon:'02',title:'Share a new story',text:'Draft a journal post, preview it, and publish when you are ready.'},
      {href:'/admin/homepage',icon:'03',title:'Refresh the homepage',text:'Update partner logos and the client testimonials visitors see first.'},
      {href:'/admin/brochure',icon:'04',title:'Connect with a prospect',text:'Review brochure requests and prepare a personal brochure email.'},
      {href:'/admin/media',icon:'05',title:'Find the right image',text:'Search the library, upload new imagery, and add accessible descriptions.'},
      {href:'/admin/signature',icon:'06',title:'Create your signature',text:'Build a polished email signature using the SBD brand template.'},
    ].map(task => <Link href={task.href} className={styles.taskCard} key={task.href}><span>{task.icon}</span><div><h3>{task.title}</h3><p>{task.text}</p></div><b aria-hidden="true">↗</b></Link>)}</div>
    <div className={styles.note}><strong>A note about publishing</strong><p>Saved website content may appear on the live site immediately. Use journal drafts for unpublished posts, and use the v2 preview to review the refreshed design.</p></div>
  </div>;
}
