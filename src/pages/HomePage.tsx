import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { HowItWorks } from '../components/home/HowItWorks';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { PricingPreview } from '../components/home/PricingPreview';
import { CtaSection } from '../components/home/CtaSection';

const HomePage: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingPreview />
      <CtaSection />
    </div>
  );
};

export default HomePage;