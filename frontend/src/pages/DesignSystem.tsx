import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/ui/Container';
import { H1, H2, H3, H4, H5, H6, Text } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import Logo from '../components/ui/Logo';

const DesignSystem = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <Container>
          <div className="bg-white shadow-md rounded-lg p-8 mb-8">
            <H1 className="mb-4">SokoClick Design System</H1>
            <Text variant="body-lg" className="mb-8">
              This page showcases the components, typography, colors, and spacing guidelines 
              used throughout the SokoClick application.
            </Text>
            
            <div className="border-b border-gray-200 pb-8 mb-8">
              <H2 className="mb-4">Colors</H2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <H3 className="mb-4">Primary Colors</H3>
                  <div className="grid grid-cols-2 gap-2">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                      <div key={`primary-${shade}`} className="flex items-center">
                        <div 
                          className={`w-10 h-10 rounded mr-2`} 
                          style={{ backgroundColor: `var(--color-primary-${shade})` }}
                        ></div>
                        <span className="text-sm text-gray-600">primary-{shade}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <H3 className="mb-4">Accent Colors</H3>
                  <div className="grid grid-cols-2 gap-2">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                      <div key={`accent-${shade}`} className="flex items-center">
                        <div 
                          className={`w-10 h-10 rounded mr-2`} 
                          style={{ backgroundColor: `var(--color-accent-${shade})` }}
                        ></div>
                        <span className="text-sm text-gray-600">accent-{shade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-8 mb-8">
              <H2 className="mb-4">Typography</H2>
              
              <div className="mb-6">
                <H3 className="mb-4">Headings</H3>
                <div className="space-y-4">
                  <H1>Heading 1</H1>
                  <H2>Heading 2</H2>
                  <H3>Heading 3</H3>
                  <H4>Heading 4</H4>
                  <H5>Heading 5</H5>
                  <H6>Heading 6</H6>
                </div>
              </div>
              
              <div>
                <H3 className="mb-4">Body Text</H3>
                <div className="space-y-4">
                  <Text variant="body-lg">
                    Body Large: This is larger body text often used for introductions or emphasized paragraphs.
                  </Text>
                  <Text variant="body-md">
                    Body Medium: This is the standard body text used throughout the application.
                  </Text>
                  <Text variant="body-sm">
                    Body Small: Smaller text used for less important information or in compact layouts.
                  </Text>
                  <Text variant="body-xs">
                    Body Extra Small: Very small text for footnotes, disclaimers, or metadata.
                  </Text>
                  <Text variant="caption">
                    Caption: Italicized text typically used for image captions or supplementary information.
                  </Text>
                  <Text variant="overline">
                    Overline: Small uppercase text used for labels or section titles.
                  </Text>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-8 mb-8">
              <H2 className="mb-4">Buttons</H2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <H3 className="mb-4">Button Variants</H3>
                  <div className="space-y-4">
                    <div>
                      <Button variant="primary" className="mr-2">Primary Button</Button>
                      <Button variant="secondary" className="mr-2">Secondary Button</Button>
                      <Button variant="accent">Accent Button</Button>
                    </div>
                    <div>
                      <Button variant="outline" className="mr-2">Outline Button</Button>
                      <Button variant="ghost" className="mr-2">Ghost Button</Button>
                      <Button variant="link">Link Button</Button>
                    </div>
                    <div>
                      <Button variant="danger">Danger Button</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <H3 className="mb-4">Button Sizes</H3>
                  <div className="space-y-4">
                    <div>
                      <Button variant="primary" size="sm" className="mr-2">Small Button</Button>
                      <Button variant="primary" className="mr-2">Default Size</Button>
                      <Button variant="primary" size="lg">Large Button</Button>
                    </div>
                    <div>
                      <Button variant="primary" isLoading className="mr-2">Loading</Button>
                      <Button variant="primary" disabled>Disabled</Button>
                    </div>
                    <div>
                      <Button variant="primary" fullWidth>Full Width Button</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-8 mb-8">
              <H2 className="mb-4">Cards</H2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardBody>
                    <Text>Basic card with body only</Text>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader>Card Header</CardHeader>
                  <CardBody>
                    <Text>Card with header and body</Text>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader>Complete Card</CardHeader>
                  <CardBody>
                    <Text>Card with all sections</Text>
                  </CardBody>
                  <CardFooter>Card Footer</CardFooter>
                </Card>
                
                <Card variant="hover">
                  <CardBody>
                    <Text>Hover variant card</Text>
                  </CardBody>
                </Card>
                
                <Card variant="bordered">
                  <CardBody>
                    <Text>Bordered variant card</Text>
                  </CardBody>
                </Card>
              </div>
            </div>
            
            <div>
              <H2 className="mb-4">Logo</H2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <Logo variant="default" />
                  <Text variant="body-sm" className="mt-2">Default Logo</Text>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <Logo variant="small" />
                  <Text variant="body-sm" className="mt-2">Small Logo</Text>
                </div>
                
                <div className="p-4 bg-gray-900 rounded-lg shadow-sm">
                  <Logo variant="white" />
                  <Text variant="body-sm" className="mt-2 text-white">White Logo (for dark backgrounds)</Text>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <Logo variant="default" showTagline={true} />
                  <Text variant="body-sm" className="mt-2">Logo with Tagline</Text>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignSystem; 