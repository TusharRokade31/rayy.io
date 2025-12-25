import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "rayy – Discover Kids Classes, Activities & Camps Near You | Learn • Play • Shine",
  description = "Find the best enrichment classes for children aged 1-18. From dance, art, coding, sports to life skills – explore 1000+ trusted programs, book trials in 3 taps. Join 10,000+ happy parents on rayy.",
  keywords = "kids classes, children activities, dance classes for kids, coding classes, art classes, sports activities, summer camps, weekend workshops, children enrichment programs, kids education, extracurricular activities, trial classes, kids learning, hobby classes, skill development",
  image = `${process.env.REACT_APP_BASE_URL}/icon-512.svg`,
  url,
  type = "website",
  structuredData,
  preloadImage = null // URL of image to preload (for hero images)
}) => {
  const siteUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullUrl} />

      {/* Preload critical images */}
      {preloadImage && (
        <link rel="preload" as="image" href={preloadImage} fetchpriority="high" />
      )}

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:secure_url" content={fullImage} />
      <meta property="og:image:type" content="image/svg+xml" />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content="rayy Logo – Kids Learning Platform" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="rayy" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content="rayy – Kids Learning Platform" />
      <meta name="twitter:site" content="@rrray" />
      <meta name="twitter:creator" content="@rrray" />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content="rayy" />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
