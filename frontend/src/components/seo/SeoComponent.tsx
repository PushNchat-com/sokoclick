import React from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "../../store/LanguageContext";

export interface SeoProps {
  title: string | { en: string; fr: string };
  description: string | { en: string; fr: string };
  canonicalUrl?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: "summary" | "summary_large_image";
  jsonLd?: Record<string, any>; // For structured data
  noindex?: boolean;
}

const SeoComponent: React.FC<SeoProps> = ({
  title,
  description,
  canonicalUrl,
  ogType = "website",
  ogImage,
  ogImageAlt,
  twitterCard = "summary_large_image",
  jsonLd,
  noindex = false,
}) => {
  const { language } = useLanguage();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  // Handle multilingual content
  const resolvedTitle = typeof title === "string" ? title : title[language];
  const resolvedDescription =
    typeof description === "string" ? description : description[language];

  // Format JSON-LD for structured data
  const structuredData = jsonLd ? JSON.stringify(jsonLd) : null;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots directives */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonicalUrl || currentUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Add language meta tag */}
      <meta httpEquiv="Content-Language" content={language} />
      <html lang={language} />

      {/* JSON-LD structured data */}
      {structuredData && (
        <script type="application/ld+json">{structuredData}</script>
      )}
    </Helmet>
  );
};

export default SeoComponent;
