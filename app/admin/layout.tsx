"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { canAccessPortalPreview } from "@/lib/portal/access";
import { adminSections } from "@/components/admin/navigation";
import { AdminFeedback } from "@/components/admin/AdminTools";
import "./admin.css";

export default function AdminLayout({children}: {children: React.ReactNode}) {
  const {data: session, status} = useSession();
  const router = useRouter();
  const pathname = usePathname() || '/admin';
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const current = adminSections.flatMap(s => s.items).filter(i => pathname === i.href || (i.href !== '/admin' && pathname.startsWith(i.href + '/'))).at(-1);
  useEffect(() => { if(status === 'unauthenticated' && pathname !== '/admin/login') router.replace('/admin/login'); }, [status, pathname, router]);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if(open) menu.current?.showModal(); else menu.current?.close();
    if(!open) return;
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => {document.body.style.overflow = old;};
  }, [open]);
  if(pathname === '/admin/login') return <>{children}</>;
  if(status === 'loading') return <div className="admin-loading" role="status">Opening your workspace…</div>;
  if(!session) return null;
  const navigation = <>
    <Link className="workspace-brand" href="/admin"><span className="workspace-monogram">SBD</span><span>Senior By Design<small>STUDIO WORKSPACE</small></span></Link>
    <label className="workspace-nav-search"><span className="sr-only">Find a section</span><input type="search" placeholder="Find a section…" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <nav aria-label="Site management">{adminSections.map(section => {
      const items = section.items.filter(i => (i.href !== '/admin/users' || session.user?.role === 'admin') && (i.label + ' ' + i.description).toLowerCase().includes(query.toLowerCase()));
      return items.length > 0 && <div className="workspace-nav-group" key={section.label}><p>{section.label}</p>{items.map(item => <Link key={item.href} href={item.href} className={`workspace-nav-link ${current?.href === item.href ? 'active' : ''}`} aria-current={current?.href === item.href ? 'page' : undefined} onClick={() => setOpen(false)}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</div>;
    })}</nav>
    <div className="workspace-sidebar-footer">{canAccessPortalPreview(session.user) && <a className="workspace-portal-link" href="https://clients.seniorbydesign.com/portal" target="_blank" rel="noopener noreferrer">Client portal <span aria-hidden="true">↗</span></a>}<span className="workspace-account">{session.user?.email}</span><button className="workspace-signout" onClick={() => signOut({callbackUrl:'/admin/login'})}>Sign out</button></div>
  </>;
  return <AdminFeedback><div className="admin-workspace">
    <a className="workspace-skip" href="#admin-content">Skip to content</a>
    <aside className="workspace-sidebar">{navigation}</aside>
    <dialog ref={menu} className="workspace-mobile-menu" onCancel={() => setOpen(false)}><button className="workspace-close" aria-label="Close navigation" onClick={() => setOpen(false)}>×</button>{navigation}</dialog>
    <div className="workspace-body"><header className="workspace-topbar"><button className="workspace-menu-button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>☰</button><div className="workspace-breadcrumb"><Link href="/admin">Workspace</Link><span>/</span><strong>{current?.label || 'Editor'}</strong></div><a href="/v2" target="_blank" rel="noopener noreferrer">Preview v2 <span aria-hidden="true">↗</span></a><a href="/" target="_blank" rel="noopener noreferrer">Live site <span aria-hidden="true">↗</span></a></header>
    <main id="admin-content" className="admin-content"><div className="workspace-context"><span>SENIOR BY DESIGN / {current?.label?.toUpperCase() || 'EDITOR'}</span><p>{current?.description}</p></div>{children}</main>
    <footer className="workspace-footer">Senior By Design <span>Content & brand management</span></footer></div>
  </div></AdminFeedback>;
}
