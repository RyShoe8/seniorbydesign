import { GlobalSchemaGraph } from '@/lib/schema/global-graph';
import { JSONLDSchema } from '@/components/SEO';

/** Global Organization + LocalBusiness + WebSite @graph on every page. */
export default function SchemaMarkup() {
  return <JSONLDSchema schema={GlobalSchemaGraph()} />;
}
