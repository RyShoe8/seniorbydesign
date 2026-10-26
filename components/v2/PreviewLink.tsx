import Link from "next/link";
import type { ComponentProps } from "react";
export function previewHref(href: string): string {
 if (!href.startsWith('/') || href.startsWith('//') || /^\/(v2|api|admin|portal|account|images|files|email-assets|_next)(\/|$|[?#])/.test(href)) return href;
 return '/v2' + (href === '/' ? '' : href);
}
export default function PreviewLink({href,...props}: ComponentProps<typeof Link>) {
 const target = typeof href === 'string' ? previewHref(href) : {...href, pathname: href.pathname ? previewHref(href.pathname) : href.pathname};
 return <Link {...props} href={target}/>;
}
