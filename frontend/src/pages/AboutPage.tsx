import React from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "../store/LanguageContext";

const AboutPage: React.FC = () => {
  const { t } = useLanguage();

  const content = {
    title: {
      en: "About Us | SokoClick",
      fr: "À Propos | SokoClick",
    },
    heading: {
      en: "Discover Unmissable Deals Every Day on SokoClick",
      fr: "Découvrez des Offres Immanquables Chaque Jour sur SokoClick",
    },
    intro: {
      en: "Welcome to SokoClick, your go-to mobile-first platform for uncovering exceptional deals across Cameroon. We're passionate about connecting you with trusted vendors offering their best products, available nationwide.",
      fr: "Bienvenue sur SokoClick, votre plateforme mobile privilégiée pour découvrir des offres exceptionnelles à travers le Cameroun. Nous sommes passionnés par la connexion avec des vendeurs de confiance offrant leurs meilleurs produits, disponibles dans tout le pays.",
    },
    paragraph1: {
      en: "At SokoClick, we bring you a fresh selection of incredible offers daily. We understand that great opportunities don't last forever, which is why we focus on bringing you a curated collection of high-value items that are available for a limited time. This ensures that every visit to SokoClick presents a new chance to snag fantastic deals you won't want to miss.",
      fr: "Chez SokoClick, nous vous proposons chaque jour une nouvelle sélection d'offres incroyables. Nous comprenons que les grandes opportunités ne durent pas éternellement, c'est pourquoi nous nous concentrons sur une collection soignée d'articles de grande valeur disponibles pour une durée limitée. Cela garantit que chaque visite sur SokoClick présente une nouvelle chance de saisir des offres fantastiques à ne pas manquer.",
    },
    paragraph2: {
      en: "We believe in direct and easy communication. That's why we've integrated seamless WhatsApp connectivity, allowing you to effortlessly reach out to sellers to discuss product specifics, arrange convenient delivery, and complete your purchase using the trusted Cash on Delivery method.",
      fr: "Nous croyons en une communication directe et facile. C'est pourquoi nous avons intégré une connectivité WhatsApp transparente, vous permettant de contacter facilement les vendeurs pour discuter des spécificités du produit, organiser une livraison pratique et finaliser votre achat en utilisant la méthode fiable de paiement à la livraison.",
    },
    paragraph3: {
      en: "SokoClick is designed for you, the mobile-savvy Cameroonian shopper. Our bilingual platform ensures everyone can easily navigate and discover the latest offers. We're committed to creating a trusted and user-friendly environment for both buyers and sellers.",
      fr: "SokoClick est conçu pour vous, le consommateur camerounais à l'aise avec les technologies mobiles. Notre plateforme bilingue garantit que tout le monde peut facilement naviguer et découvrir les dernières offres. Nous nous engageons à créer un environnement de confiance et convivial pour les acheteurs comme pour les vendeurs.",
    },
    conclusion: {
      en: "Make SokoClick a part of your daily routine and never miss out on the latest incredible deals!",
      fr: "Faites de SokoClick une partie de votre routine quotidienne et ne manquez jamais les dernières offres incroyables!",
    },
  };

  return (
    <>
      <Helmet>
        <title>{t(content.title)}</title>
        <meta name="description" content={t(content.intro)} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-6">
            {t(content.heading)}
          </h1>

          <div className="space-y-6 text-gray-700">
            <p className="text-lg font-medium">{t(content.intro)}</p>

            <p>{t(content.paragraph1)}</p>

            <p>{t(content.paragraph2)}</p>

            <p>{t(content.paragraph3)}</p>

            <p className="text-lg font-semibold text-indigo-700">
              {t(content.conclusion)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
