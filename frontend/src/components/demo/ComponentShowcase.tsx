import React from 'react';
import StandardIcon from '../ui/StandardIcon';
import ResponsiveImage from '../ui/ResponsiveImage';
import Button from '../ui/Button';
import WhatsAppButton from '../product/WhatsAppButton';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';

const ComponentShowcase: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Component Showcase</h1>
      
      {/* Icon Showcase */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Icons</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium mb-3">Standard Icon Sizes</h3>
          <div className="flex flex-wrap items-end gap-8">
            <div className="flex flex-col items-center">
              <StandardIcon name="Location" size="xs" />
              <span className="text-xs mt-2">xs (12px)</span>
            </div>
            <div className="flex flex-col items-center">
              <StandardIcon name="Location" size="sm" />
              <span className="text-xs mt-2">sm (16px)</span>
            </div>
            <div className="flex flex-col items-center">
              <StandardIcon name="Location" size="md" />
              <span className="text-xs mt-2">md (24px)</span>
            </div>
            <div className="flex flex-col items-center">
              <StandardIcon name="Location" size="lg" />
              <span className="text-xs mt-2">lg (32px)</span>
            </div>
            <div className="flex flex-col items-center">
              <StandardIcon name="Location" size="xl" />
              <span className="text-xs mt-2">xl (40px)</span>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-3 mt-8">Common Icons</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col items-center">
              <StandardIcon name="WhatsApp" size="md" className="text-whatsapp" />
              <span className="text-xs mt-2">WhatsApp</span>
            </div>
            <div className="flex flex-col items-center">
              <StandardIcon name="Location" size="md" className="text-primary-500" />
              <span className="text-xs mt-2">Location</span>
            </div>
            <div className="flex flex-col items-center">
              <StandardIcon name="Clock" size="md" className="text-secondary-500" />
              <span className="text-xs mt-2">Clock</span>
            </div>
            <div className="flex flex-col items-center">
              <StandardIcon name="VerifiedBadge" size="md" className="text-verify-500" />
              <span className="text-xs mt-2">VerifiedBadge</span>
            </div>
            <div className="flex flex-col items-center">
              <StandardIcon name="Payment" size="md" />
              <span className="text-xs mt-2">Payment</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Image Showcase */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Images</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium mb-3">Standard Image Sizes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <ResponsiveImage 
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
                alt="Product Image - XS"
                imageSize="xs"
                aspectRatio="square"
                className="w-full"
              />
              <span className="text-xs mt-2">XS (120px)</span>
            </div>
            <div className="flex flex-col items-center">
              <ResponsiveImage 
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
                alt="Product Image - SM"
                imageSize="sm"
                aspectRatio="square"
                className="w-full"
              />
              <span className="text-xs mt-2">SM (160px)</span>
            </div>
            <div className="flex flex-col items-center">
              <ResponsiveImage 
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
                alt="Product Image - MD"
                imageSize="md"
                aspectRatio="square"
                className="w-full"
              />
              <span className="text-xs mt-2">MD (192px)</span>
            </div>
            <div className="flex flex-col items-center">
              <ResponsiveImage 
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
                alt="Product Image - LG"
                imageSize="lg"
                aspectRatio="square"
                className="w-full"
              />
              <span className="text-xs mt-2">LG (240px)</span>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-3 mt-8">Aspect Ratios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <ResponsiveImage 
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
                alt="Product Image - Square"
                imageSize="md"
                aspectRatio="square"
                className="w-full"
              />
              <span className="text-xs mt-2">Square (1:1)</span>
            </div>
            <div className="flex flex-col items-center">
              <ResponsiveImage 
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
                alt="Product Image - 16:9"
                imageSize="md"
                aspectRatio="16:9"
                className="w-full"
              />
              <span className="text-xs mt-2">16:9 (Video)</span>
            </div>
            <div className="flex flex-col items-center">
              <ResponsiveImage 
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
                alt="Product Image - 4:3"
                imageSize="md"
                aspectRatio="4:3"
                className="w-full"
              />
              <span className="text-xs mt-2">4:3 (Standard)</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Card Showcase */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Card Components</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium mb-3">Product Card</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Standard Product Card */}
            <div className="product-card relative flex flex-col overflow-hidden rounded-card border border-ui-border bg-ui-card w-full md:w-card-md lg:w-card-lg shadow-card">
              <div className="relative overflow-hidden">
                <ResponsiveImage 
                  src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
                  alt="PlayStation 5"
                  imageSize="product"
                  objectFit="cover"
                />
                
                <div className="absolute top-2 right-2 bg-primary-500 text-white py-1 px-2 rounded-md font-semibold z-10">
                  385,000 XAF
                </div>
                
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                  <Badge variant="primary">New</Badge>
                </div>
              </div>
              
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-base font-medium line-clamp-2 mb-1">
                  Sony PlayStation 5 Disc Edition
                </h3>
                
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <StandardIcon name="Location" size="xs" className="mr-1 flex-shrink-0" /> 
                  <span className="truncate">Yaoundé</span>
                </div>
                
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <StandardIcon name="Clock" size="xs" className="mr-1 flex-shrink-0" /> 
                  <span>5d 12h left</span>
                </div>
                
                <div className="mt-auto pt-2 space-y-1.5">
                  <Badge 
                    variant="payment" 
                    icon={<StandardIcon name="Payment" size="xs" />}
                  >
                    Cash on Delivery Only
                  </Badge>
                </div>
              </div>
              
              <WhatsAppButton
                phoneNumber="+237623456789"
                message="Hello, I'm interested in your PlayStation 5 on SokoClick."
                variant="corner"
                className="absolute bottom-0 right-0"
              />
            </div>
            
            {/* Loading Card (Skeleton) */}
            <Skeleton
              variant="productCard"
              className="w-full md:w-card-md lg:w-card-lg"
            />
          </div>
        </div>
      </section>
      
      {/* Button Showcase */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium mb-3">Standard Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="md">Primary Button</Button>
            <Button variant="secondary" size="md">Secondary Button</Button>
            <Button variant="outline" size="md">Outline Button</Button>
            <Button variant="ghost" size="md">Ghost Button</Button>
          </div>
          
          <h3 className="text-lg font-medium mb-3 mt-8">WhatsApp Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <WhatsAppButton
              phoneNumber="+237612345678"
              message="Hello, I'm interested in your product on SokoClick."
              variant="default"
              buttonText="Contact Seller"
            />
            
            <WhatsAppButton
              phoneNumber="+237612345678"
              message="Hello, I'm interested in your product on SokoClick."
              variant="large"
              buttonText="Contact via WhatsApp"
            />
            
            <div className="relative h-16 w-32 bg-gray-100">
              <WhatsAppButton
                phoneNumber="+237612345678"
                message="Hello, I'm interested in your product on SokoClick."
                variant="corner"
                className="absolute bottom-0 right-0"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ComponentShowcase; 