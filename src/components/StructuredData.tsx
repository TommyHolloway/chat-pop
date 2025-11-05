import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type: 'Organization' | 'SoftwareApplication' | 'FAQPage' | 'Article' | 'WebPage' | 'BreadcrumbList';
  data: any;
}

export const StructuredData = ({ type, data }: StructuredDataProps) => {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};
