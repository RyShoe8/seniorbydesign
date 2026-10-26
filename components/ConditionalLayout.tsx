"use client";
import {usePathname} from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import PreviewHeader from "./v2/Header";
import PreviewFooter from "./v2/Footer";
import ScrollReveal from "./ScrollReveal";
import "./v2/marketing.css";
export default function ConditionalLayout({children}:{children:React.ReactNode}) {
 const pathname=usePathname() || '/';
 const preview=pathname==='/v2'||pathname.startsWith('/v2/');
 const path=preview ? pathname.slice(3)||'/' : pathname;
 if (/^\/(admin|portal|account)(\/|$)/.test(path)||path==='/experience'||path.startsWith('/brochure/view')) return <>{children}</>;
 if(preview) return <div className="sbd-marketing"><a className="sbd-skip-link" href="#main-content">Skip to content</a><ScrollReveal/><PreviewHeader/><main id="main-content">{children}</main><PreviewFooter/></div>;
 return <><ScrollReveal/><Header/><main>{children}</main><Footer/></>;
}
