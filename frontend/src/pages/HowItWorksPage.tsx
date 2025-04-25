import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../store/LanguageContext';
import SeoComponent from '../components/seo/SeoComponent';

const HowItWorksPage: React.FC = () => {
  const { t } = useLanguage();

  const content = {
    title: {
      en: 'How It Works | SokoClick',
      fr: 'Comment Ça Marche | SokoClick'
    },
    heading: {
      en: 'Connecting Buyers and Sellers with Great Deals on SokoClick!',
      fr: 'Connecter Acheteurs et Vendeurs avec de Bonnes Affaires sur SokoClick!'
    },
    intro: {
      en: 'SokoClick is designed to be a simple and effective platform, directly linking buyers with fantastic, time-sensitive deals offered by trusted vendors across Cameroon. Here\'s how it works for both buyers and sellers:',
      fr: 'SokoClick est conçu comme une plateforme simple et efficace, reliant directement les acheteurs à des offres fantastiques à durée limitée proposées par des vendeurs de confiance à travers le Cameroun. Voici comment cela fonctionne pour les acheteurs et les vendeurs:'
    },
    forBuyers: {
      title: {
        en: 'For Buyers:',
        fr: 'Pour les Acheteurs:'
      },
      steps: [
        {
          title: {
            en: 'Visit SokoClick Daily',
            fr: 'Visitez SokoClick Quotidiennement'
          },
          description: {
            en: 'New and exciting deals are posted regularly, so make it a habit to check our website each day to ensure you don\'t miss out on incredible offers!',
            fr: 'De nouvelles offres passionnantes sont publiées régulièrement, alors prenez l\'habitude de consulter notre site web chaque jour pour ne pas manquer des offres incroyables!'
          }
        },
        {
          title: {
            en: 'Explore the Latest Deals',
            fr: 'Explorez les Dernières Offres'
          },
          description: {
            en: 'Browse our curated selection of products available for a limited time. Each listing provides a clear description and a competitive price. Don\'t hesitate – these deals won\'t last forever!',
            fr: 'Parcourez notre sélection de produits disponibles pour une durée limitée. Chaque annonce fournit une description claire et un prix compétitif. N\'hésitez pas - ces offres ne dureront pas éternellement!'
          }
        },
        {
          title: {
            en: 'Connect with the Seller via WhatsApp',
            fr: 'Connectez-vous avec le Vendeur via WhatsApp'
          },
          description: {
            en: 'When you find a product you\'re interested in, simply click on the listing to access the seller\'s direct WhatsApp contact information. This allows you to easily inquire about the product, request more details, or express your interest.',
            fr: 'Lorsque vous trouvez un produit qui vous intéresse, cliquez simplement sur l\'annonce pour accéder aux coordonnées WhatsApp directes du vendeur. Cela vous permet de vous renseigner facilement sur le produit, de demander plus de détails ou d\'exprimer votre intérêt.'
          }
        },
        {
          title: {
            en: 'Discuss Delivery and Payment',
            fr: 'Discutez de la Livraison et du Paiement'
          },
          description: {
            en: 'Communicate directly with the seller on WhatsApp to arrange convenient delivery options. SokoClick prioritizes the trusted Cash on Delivery method, offering a secure and familiar payment process.',
            fr: 'Communiquez directement avec le vendeur sur WhatsApp pour organiser des options de livraison pratiques. SokoClick privilégie la méthode fiable de paiement à la livraison, offrant un processus de paiement sécurisé et familier.'
          }
        },
        {
          title: {
            en: 'Receive Your Product and Pay on Delivery',
            fr: 'Recevez Votre Produit et Payez à la Livraison'
          },
          description: {
            en: 'Once you and the seller have agreed on the terms, simply await the arrival of your product and complete the payment upon delivery. It\'s a straightforward and reliable process.',
            fr: 'Une fois que vous et le vendeur avez convenu des conditions, attendez simplement l\'arrivée de votre produit et effectuez le paiement à la livraison. C\'est un processus simple et fiable.'
          }
        }
      ]
    },
    forSellers: {
      title: {
        en: 'For Sellers:',
        fr: 'Pour les Vendeurs:'
      },
      steps: [
        {
          title: {
            en: 'Become a Verified SokoClick Vendor',
            fr: 'Devenez un Vendeur Vérifié SokoClick'
          },
          description: {
            en: 'If you\'re a business or individual in Cameroon with exciting products and competitive deals to offer nationwide, reach out to our admin team through the "Contact Us" page to learn about becoming a verified seller on SokoClick.',
            fr: 'Si vous êtes une entreprise ou un particulier au Cameroun avec des produits intéressants et des offres compétitives à proposer à l\'échelle nationale, contactez notre équipe d\'administration via la page "Contactez-nous" pour en savoir plus sur la façon de devenir un vendeur vérifié sur SokoClick.'
          }
        },
        {
          title: {
            en: 'List Your Products and Pay a Small Daily Fee',
            fr: 'Listez Vos Produits et Payez des Frais Quotidiens Modiques'
          },
          description: {
            en: 'As a verified seller, you can list your products on our platform for a nominal fee of $5 per listing per day. This small investment gives you access to a targeted audience of eager buyers across Cameroon.',
            fr: 'En tant que vendeur vérifié, vous pouvez lister vos produits sur notre plateforme pour des frais modiques de 5$ par annonce par jour. Ce petit investissement vous donne accès à un public ciblé d\'acheteurs enthousiastes à travers le Cameroun.'
          }
        },
        {
          title: {
            en: 'Engage Directly with Interested Buyers',
            fr: 'Engagez Directement avec les Acheteurs Intéressés'
          },
          description: {
            en: 'When a buyer is interested in your listed product, they will contact you directly via WhatsApp. Be ready to provide them with the information they need and answer their questions.',
            fr: 'Lorsqu\'un acheteur est intéressé par votre produit listé, il vous contactera directement via WhatsApp. Soyez prêt à leur fournir les informations dont ils ont besoin et à répondre à leurs questions.'
          }
        },
        {
          title: {
            en: 'Arrange Delivery and Receive Payment',
            fr: 'Organisez la Livraison et Recevez le Paiement'
          },
          description: {
            en: 'Coordinate the delivery of your product directly with the buyer through WhatsApp. Payment is conveniently handled through Cash on Delivery, ensuring a smooth transaction.',
            fr: 'Coordonnez la livraison de votre produit directement avec l\'acheteur via WhatsApp. Le paiement est facilement géré via le paiement à la livraison, assurant une transaction fluide.'
          }
        }
      ]
    },
    conclusion: {
      en: 'Join the SokoClick Community Today! Whether you\'re a buyer looking for amazing daily deals or a seller wanting to reach a wider market, SokoClick provides a simple and effective solution. Start exploring the opportunities now!',
      fr: 'Rejoignez la Communauté SokoClick Aujourd\'hui! Que vous soyez un acheteur à la recherche d\'offres quotidiennes incroyables ou un vendeur souhaitant atteindre un marché plus large, SokoClick offre une solution simple et efficace. Commencez à explorer les opportunités maintenant!'
    }
  };

  return (
    <>
      <SeoComponent
        title={content.title}
        description={content.intro}
        ogType="website"
        ogImage="/images/how-it-works-social.jpg"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-6">
            {t(content.heading)}
          </h1>
          
          <div className="space-y-8 text-gray-700">
            <p className="text-lg">
              {t(content.intro)}
            </p>
            
            {/* Buyers Section */}
            <div className="bg-indigo-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-indigo-800 mb-4">
                {t(content.forBuyers.title)}
              </h2>
              
              <div className="space-y-4">
                {content.forBuyers.steps.map((step, index) => (
                  <div key={`buyer-${index}`} className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-indigo-700">{t(step.title)}</h3>
                      <p className="mt-1">{t(step.description)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sellers Section */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-800 mb-4">
                {t(content.forSellers.title)}
              </h2>
              
              <div className="space-y-4">
                {content.forSellers.steps.map((step, index) => (
                  <div key={`seller-${index}`} className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-700">{t(step.title)}</h3>
                      <p className="mt-1">{t(step.description)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Conclusion */}
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-lg font-semibold text-yellow-800">
                {t(content.conclusion)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItWorksPage; 