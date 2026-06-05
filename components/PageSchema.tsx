import { JSONLDSchema } from '@/components/SEO';

type PageSchemaProps = {
  schemas: Record<string, unknown>[];
};

/** Page-level JSON-LD blocks (breadcrumbs, Service, FAQ, etc.). */
export default function PageSchema({ schemas }: PageSchemaProps) {
  if (schemas.length === 0) return null;

  if (schemas.length === 1) {
    return <JSONLDSchema schema={schemas[0]} />;
  }

  return (
    <JSONLDSchema
      schema={{
        '@context': 'https://schema.org',
        '@graph': schemas.map((node) => {
          const { '@context': _ctx, ...rest } = node as Record<string, unknown>;
          return rest;
        }),
      }}
    />
  );
}
