import Script from 'next/script';

export default function Analytics() {
  return (
    <>
      {/* Analytics Tracking Codes */}
      {/* Ahrefs Analytics */}
      <Script
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="SFC+ff7C2Znl/GxFtNhNBw"
        strategy="afterInteractive"
      />
    </>
  );
}
