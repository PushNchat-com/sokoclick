import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/ui/Container';
import { H1, H2, Text } from '../components/ui/Typography';
import Card from '../components/ui/Card';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-12 bg-gray-50">
        <Container>
          <div className="max-w-4xl mx-auto">
            <H1 className="mb-6 text-center">{t('about')}</H1>
            
            <Card className="mb-10">
              <div className="p-8">
                <H2 className="mb-4">About SokoClick</H2>
                <Text variant="body-lg" className="mb-6">
                  SokoClick is a revolutionary auction platform that connects buyers directly with 
                  sellers through WhatsApp, making it easier to negotiate and complete transactions.
                </Text>
                
                <Text variant="body-md" className="mb-4">
                  Our platform features a limited number of auction slots that rotate regularly,
                  ensuring that all featured products receive maximum visibility. Each auction slot 
                  showcases a single product with detailed information and high-quality images.
                </Text>
                
                <Text variant="body-md">
                  By integrating with WhatsApp, we eliminate the need for complex bidding systems.
                  Potential buyers can contact sellers directly to make offers, ask questions about
                  the product, and arrange payment and delivery details.
                </Text>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <H2 className="text-xl mb-2">Secure</H2>
                  <Text variant="body-sm">
                    All conversations and transactions are secured through WhatsApp's end-to-end encryption.
                  </Text>
                </div>
              </Card>
              
              <Card>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <H2 className="text-xl mb-2">Affordable</H2>
                  <Text variant="body-sm">
                    Direct communication means lower fees and better prices for both buyers and sellers.
                  </Text>
                </div>
              </Card>
              
              <Card>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <H2 className="text-xl mb-2">Fast</H2>
                  <Text variant="body-sm">
                    Real-time messaging allows for quick negotiations and faster completion of transactions.
                  </Text>
                </div>
              </Card>
            </div>
            
            <Card>
              <div className="p-8">
                <H2 className="mb-4">Our Mission</H2>
                <Text variant="body-md" className="mb-6">
                  At SokoClick, our mission is to revolutionize the online auction experience by prioritizing 
                  direct communication between buyers and sellers. We believe that the personal touch of 
                  WhatsApp communication builds trust and leads to more successful transactions.
                </Text>
                
                <Text variant="body-md">
                  Whether you're a seller looking to reach a wider audience or a buyer searching for unique 
                  items with the ability to negotiate directly, SokoClick provides the platform you need to 
                  connect and transact with confidence.
                </Text>
              </div>
            </Card>
          </div>
        </Container>
      </main>
      
      <Footer />
    </div>
  );
};

export default About; 