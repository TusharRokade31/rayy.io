import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEOHead Component
 * Dynamically updates meta tags, title, and structured data for SEO
 */
const SEOHead = ({ 
  title, 
  description, 
  keywords,
  image,
  type = 'website',
  structuredData,
  canonical
}) => {
  const location = useLocation();
  const baseUrl = process.env.REACT_APP_BACKEND_URL?.replace('/api', '') || 'https://rayy-partner-flow.preview.emergentagent.com';
  
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | rayy - Kids Classes & Activities`;
    }
    
    // Update meta description
    if (description) {
      updateMetaTag('name', 'description', description);
      updateMetaTag('property', 'og:description', description);
      updateMetaTag('name', 'twitter:description', description);
    }
    
    // Update meta keywords
    if (keywords) {
      updateMetaTag('name', 'keywords', keywords);
    }
    
    // Update OG image
    if (image) {
      updateMetaTag('property', 'og:image', image);
      updateMetaTag('name', 'twitter:image', image);
    }
    
    // Update OG title
    if (title) {
      updateMetaTag('property', 'og:title', title);
      updateMetaTag('name', 'twitter:title', title);
    }
    
    // Update OG type
    updateMetaTag('property', 'og:type', type);
    
    // Update canonical URL
    const currentUrl = `${baseUrl}${location.pathname}${location.search}`;
    updateMetaTag('property', 'og:url', currentUrl);
    updateMetaTag('name', 'twitter:url', currentUrl);
    
    const canonicalLink = document.getElementById('canonical-link');
    if (canonicalLink) {
      canonicalLink.href = canonical || currentUrl;
    }
    
    // Add structured data if provided
    if (structuredData) {
      addStructuredData(structuredData);
    }
    
  }, [title, description, keywords, image, type, structuredData, canonical, location]);
  
  return null; // This is a headless component
};\n\n// Helper function to update meta tags\nconst updateMetaTag = (attribute, attributeValue, content) => {\n  let element = document.querySelector(`meta[${attribute}=\"${attributeValue}\"]`);\n  if (element) {\n    element.setAttribute('content', content);\n  } else {\n    element = document.createElement('meta');\n    element.setAttribute(attribute, attributeValue);\n    element.setAttribute('content', content);\n    document.head.appendChild(element);\n  }\n};\n\n// Helper function to add structured data\nconst addStructuredData = (data) => {\n  // Remove existing structured data for this page\n  const existingScripts = document.querySelectorAll('script[type=\"application/ld+json\"][data-dynamic=\"true\"]');\n  existingScripts.forEach(script => script.remove());\n  \n  // Add new structured data\n  const script = document.createElement('script');\n  script.type = 'application/ld+json';\n  script.setAttribute('data-dynamic', 'true');\n  script.textContent = JSON.stringify(data);\n  document.head.appendChild(script);\n};\n\nexport default SEOHead;\n\n// Preset SEO configurations for common pages\nexport const SEOPresets = {\n  home: {\n    title: 'rayy – Discover Kids Classes & Activities Near You',\n    description: 'Find the best enrichment classes for children aged 1-18. From dance, art, coding, sports to life skills – explore 1000+ trusted programs, book trials in 3 taps.',\n    keywords: 'kids classes, children activities, dance classes for kids, coding classes, art classes, sports activities, summer camps, weekend workshops'\n  },\n  search: {\n    title: 'Search Kids Classes & Activities',\n    description: 'Browse thousands of enrichment programs for kids. Filter by age, category, location, and price. Book trial classes instantly.',\n    keywords: 'search kids classes, find children activities, kids classes near me, children enrichment programs'\n  },\n  trial: {\n    title: 'Trial Classes for Kids - Book Free Trial Sessions',\n    description: 'Try before you commit! Book trial classes for ₹99-₹199. Experience the best kids activities risk-free.',\n    keywords: 'trial classes, free trial, kids activities trial, children classes trial, test classes'\n  }\n};\n"}
