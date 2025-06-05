import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export const CtaSection: React.FC = () => {
  return (
    <section className="py-16 bg-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-white sm:text-4xl">
            Ready to Transform Your AI Content?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-primary-100">
            Start creating human-like content that bypasses AI detection tools today.
          </p>
          
          <div className="mt-8 flex justify-center">
            <Link to="/humanizer">
              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight />}
              >
                Try GhostScribe Free
              </Button>
            </Link>
          </div>
          
          <p className="mt-4 text-primary-200 text-sm">
            No credit card required. Start with 1,000 words for free.
          </p>
        </div>
      </div>
    </section>
  );
};