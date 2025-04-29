import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "../store/LanguageContext";
import SeoComponent from "../components/seo/SeoComponent";

type FaqItem = {
  question: { en: string; fr: string };
  answer: { en: string; fr: string };
};

const FaqPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FaqItem[] = [
    {
      question: {
        en: "What is SokoClick?",
        fr: "Qu'est-ce que SokoClick?",
      },
      answer: {
        en: "SokoClick is a mobile-first ecommerce platform in Cameroon offering a curated selection of products with limited-time deals from verified vendors nationwide.",
        fr: "SokoClick est une plateforme de commerce électronique axée sur le mobile au Cameroun, proposant une sélection soignée de produits avec des offres à durée limitée de vendeurs vérifiés dans tout le pays.",
      },
    },
    {
      question: {
        en: "How often are new products listed on SokoClick?",
        fr: "À quelle fréquence de nouveaux produits sont-ils listés sur SokoClick?",
      },
      answer: {
        en: "We feature a new selection of exciting deals every day, so be sure to check back regularly to discover what's available.",
        fr: "Nous présentons chaque jour une nouvelle sélection d'offres passionnantes, alors n'oubliez pas de revenir régulièrement pour découvrir ce qui est disponible.",
      },
    },
    {
      question: {
        en: "How long are products typically listed on SokoClick?",
        fr: "Combien de temps les produits sont-ils généralement listés sur SokoClick?",
      },
      answer: {
        en: "Each product listing has a specific start and end time, creating a sense of urgency. Visit our website daily to ensure you don't miss out on any opportunities.",
        fr: "Chaque annonce de produit a une heure de début et de fin spécifique, créant un sentiment d'urgence. Visitez notre site web quotidiennement pour vous assurer de ne manquer aucune opportunité.",
      },
    },
    {
      question: {
        en: "How do I buy a product on SokoClick?",
        fr: "Comment acheter un produit sur SokoClick?",
      },
      answer: {
        en: "When you find a product that interests you, click on it to find the seller's WhatsApp contact information. You can then connect directly with the seller to discuss details, arrange delivery, and make payment via Cash on Delivery.",
        fr: "Lorsque vous trouvez un produit qui vous intéresse, cliquez dessus pour trouver les coordonnées WhatsApp du vendeur. Vous pouvez ensuite vous connecter directement avec le vendeur pour discuter des détails, organiser la livraison et effectuer le paiement via Cash à la livraison.",
      },
    },
    {
      question: {
        en: "How does delivery and payment work?",
        fr: "Comment fonctionnent la livraison et le paiement?",
      },
      answer: {
        en: "Delivery and payment are handled directly between you and the seller through WhatsApp. SokoClick facilitates the initial connection, and the payment method is Cash on Delivery for your convenience and security.",
        fr: "La livraison et le paiement sont gérés directement entre vous et le vendeur via WhatsApp. SokoClick facilite la connexion initiale, et le mode de paiement est le paiement à la livraison pour votre confort et votre sécurité.",
      },
    },
    {
      question: {
        en: "How do I sell my products on SokoClick?",
        fr: "Comment vendre mes produits sur SokoClick?",
      },
      answer: {
        en: "SokoClick offers a dynamic platform for vendors to showcase their best deals. Please contact our admin team via the contact details on our website to learn about becoming a verified seller and listing your products.",
        fr: "SokoClick offre une plateforme dynamique aux vendeurs pour présenter leurs meilleures offres. Veuillez contacter notre équipe d'administration via les coordonnées sur notre site web pour savoir comment devenir un vendeur vérifié et lister vos produits.",
      },
    },
    {
      question: {
        en: "Is SokoClick available in English and French?",
        fr: "SokoClick est-il disponible en anglais et en français?",
      },
      answer: {
        en: "Yes, SokoClick provides full support for both English and French languages.",
        fr: "Oui, SokoClick offre un support complet pour les langues anglaise et française.",
      },
    },
    {
      question: {
        en: "How do I know if a seller is trustworthy?",
        fr: "Comment savoir si un vendeur est digne de confiance?",
      },
      answer: {
        en: 'SokoClick employs a seller verification process to enhance trust within our community. Look for the "Verified Seller" badge on product listings.',
        fr: 'SokoClick utilise un processus de vérification des vendeurs pour renforcer la confiance au sein de notre communauté. Recherchez le badge "Vendeur vérifié" sur les annonces de produits.',
      },
    },
    {
      question: {
        en: "What if I have more questions?",
        fr: "Que faire si j'ai d'autres questions?",
      },
      answer: {
        en: 'Please visit our "Contact Us" section on the home page for further assistance or to get in touch with our support team.',
        fr: "Veuillez visiter notre section \"Contactez-nous\" sur la page d'accueil pour obtenir de l'aide supplémentaire ou pour contacter notre équipe d'assistance.",
      },
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Generate FAQ structured data
  const faqSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((faq) => ({
        "@type": "Question",
        name: faq.question[language as "en" | "fr"],
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer[language as "en" | "fr"],
        },
      })),
    };
  }, [faqItems, language]);

  const seoTitle = {
    en: "Frequently Asked Questions | SokoClick",
    fr: "Questions Fréquemment Posées | SokoClick",
  };

  const seoDescription = {
    en: "Find answers to common questions about SokoClick, the mobile-first ecommerce platform in Cameroon.",
    fr: "Trouvez des réponses aux questions courantes sur SokoClick, la plateforme de commerce électronique mobile au Cameroun.",
  };

  return (
    <>
      <SeoComponent
        title={seoTitle}
        description={seoDescription}
        ogType="website"
        jsonLd={faqSchema}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-6">
            {t({
              en: "Frequently Asked Questions (FAQ)",
              fr: "Questions Fréquemment Posées (FAQ)",
            })}
          </h1>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  className="flex justify-between items-center w-full p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="font-medium text-indigo-700">
                    {t(faq.question)}
                  </span>
                  <span className="ml-4">
                    {openIndex === index ? (
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </span>
                </button>

                {openIndex === index && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <p className="text-gray-700">{t(faq.answer)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FaqPage;
