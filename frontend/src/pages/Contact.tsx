import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/ui/Container';
import { H1, H2, Text } from '../components/ui/Typography';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';

const Contact = () => {
  const { t } = useTranslation();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data submitted:', formData);
    // In a real app, you would send the form data to your backend
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-12 bg-gray-50">
        <Container>
          <div className="max-w-4xl mx-auto">
            <H1 className="mb-6 text-center">{t('contact')}</H1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <Card>
                <div className="p-6 text-center">
                  <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <H2 className="text-xl mb-2">Email</H2>
                  <Text variant="body-sm">
                    info@sokoclick.com
                  </Text>
                </div>
              </Card>
              
              <Card>
                <div className="p-6 text-center">
                  <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <H2 className="text-xl mb-2">Phone</H2>
                  <Text variant="body-sm">
                    +237 655 123 456
                  </Text>
                </div>
              </Card>
              
              <Card>
                <div className="p-6 text-center">
                  <div className="w-14 h-14 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <H2 className="text-xl mb-2">Location</H2>
                  <Text variant="body-sm">
                    Douala, Cameroon
                  </Text>
                </div>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <H2>{t('contact')}</H2>
                <Text variant="body-sm" className="text-gray-600">
                  Please fill out the form below and we'll get back to you as soon as possible.
                </Text>
              </CardHeader>
              <CardBody>
                {formSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <H2 className="text-xl mb-2">Message Sent!</H2>
                    <Text variant="body-md" className="mb-6">
                      Thank you for contacting us. We'll respond to your message as soon as possible.
                    </Text>
                    <Button variant="primary" onClick={() => setFormSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="form-input"
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="form-input"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="form-select"
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="feedback">Feedback</option>
                        <option value="partnership">Partnership Opportunities</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="form-input"
                        placeholder="Your message..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <Button type="submit" variant="primary" fullWidth>
                        Send Message
                      </Button>
                    </div>
                  </form>
                )}
              </CardBody>
            </Card>
            
            <div className="mt-10">
              <Card>
                <div className="p-6">
                  <H2 className="mb-4">FAQ</H2>
                  <div className="space-y-4">
                    <div>
                      <H2 className="text-lg mb-1">How does SokoClick work?</H2>
                      <Text variant="body-sm">
                        SokoClick offers 25 auction slots where sellers can list their products. Buyers can browse 
                        these slots and contact sellers directly via WhatsApp to make offers and arrange purchases.
                      </Text>
                    </div>
                    
                    <div>
                      <H2 className="text-lg mb-1">How do I sell on SokoClick?</H2>
                      <Text variant="body-sm">
                        Contact our team to request a seller account. Once approved, you can list your products in 
                        available auction slots.
                      </Text>
                    </div>
                    
                    <div>
                      <H2 className="text-lg mb-1">Are there any fees?</H2>
                      <Text variant="body-sm">
                        We charge a small listing fee for sellers. Buyers can browse and contact sellers for free.
                      </Text>
                    </div>
                    
                    <div>
                      <H2 className="text-lg mb-1">Is my WhatsApp number shared publicly?</H2>
                      <Text variant="body-sm">
                        Your number is only shared with users who specifically click to contact you about a product.
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact; 