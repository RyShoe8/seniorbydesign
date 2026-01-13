import Script from 'next/script';

export default function Analytics() {
  return (
    <>
      {/* Analytics Tracking Codes */}
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-0DW324N5VE"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-0DW324N5VE');
        `}
      </Script>
      {/* Ahrefs Analytics */}
      <Script
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="SFC+ff7C2Znl/GxFtNhNBw"
        strategy="afterInteractive"
      />
    </>
  );
}
