import { Product } from '../services/products';

// Type for minimal product data needed for schema
export interface ProductSchemaData {
  id: string;
  name: string | { en: string; fr: string };
  description?: string | { en: string; fr: string };
  price?: number;
  currency?: string;
  images?: string[];
  mainImage?: string;
  url?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  brand?: string;
  seller?: {
    name: string;
    url?: string;
  };
  category?: string;
}

/**
 * Generates Product schema markup in JSON-LD format for SEO
 */
export const generateProductSchema = (
  product: ProductSchemaData, 
  language: 'en' | 'fr' = 'en'
): Record<string, any> => {
  // Resolve multilingual fields
  const productName = typeof product.name === 'string' 
    ? product.name 
    : product.name[language];
  
  const productDescription = !product.description 
    ? undefined 
    : typeof product.description === 'string' 
      ? product.description 
      : product.description[language];

  // Map condition values to schema.org format
  const conditionMap: Record<string, string> = {
    'new': 'NewCondition',
    'used': 'UsedCondition',
    'refurbished': 'RefurbishedCondition'
  };
  
  // Build the structured data
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    productID: product.id,
    name: productName,
    description: productDescription,
    url: product.url || (typeof window !== 'undefined' ? window.location.href : ''),
    image: product.images || [product.mainImage].filter(Boolean),
    ...(product.brand && { brand: {
      '@type': 'Brand',
      name: product.brand
    }}),
    ...(product.category && { category: product.category }),
    ...(product.condition && { itemCondition: `https://schema.org/${product.condition}` })
  };
  
  // Add offer data if price exists
  if (product.price) {
    schema.offers = {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'XAF',
      availability: product.availability 
        ? `https://schema.org/${product.availability}` 
        : 'https://schema.org/InStock',
      url: product.url || (typeof window !== 'undefined' ? window.location.href : ''),
      ...(product.seller && { seller: {
        '@type': 'Organization',
        name: product.seller.name,
        ...(product.seller.url && { url: product.seller.url })
      }})
    };
  }
  
  return schema;
};

/**
 * Generates BreadcrumbList schema markup in JSON-LD format for SEO
 */
export const generateBreadcrumbSchema = (
  items: Array<{ name: string | { en: string; fr: string }; url: string }>,
  language: 'en' | 'fr' = 'en'
): Record<string, any> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: typeof item.name === 'string' ? item.name : item.name[language],
      item: item.url
    }))
  };
};

/**
 * Generates Organization schema markup in JSON-LD format for SEO
 */
export const generateOrganizationSchema = (): Record<string, any> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SokoClick',
    url: 'https://sokoclick.com',
    logo: 'https://sokoclick.com/logo.png',
    sameAs: [
      'https://facebook.com/sokoclicka',
      'https://twitter.com/sokoclick',
      'https://instagram.com/sokoclick'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+237673870377',
      contactType: 'customer service'
    }
  };
};

/**
 * Generates WebSite schema markup in JSON-LD format for SEO
 */
export const generateWebsiteSchema = (
  languages: string[] = ['en', 'fr']
): Record<string, any> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SokoClick',
    url: 'https://sokoclick.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://sokoclick.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    },
    inLanguage: languages
  };
}; 