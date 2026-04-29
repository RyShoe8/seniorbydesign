'use client';

type Props = {
  html: string;
};

export function SignaturePreview({ html }: Props) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        background: '#fff',
        minHeight: '120px',
        overflow: 'auto',
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
