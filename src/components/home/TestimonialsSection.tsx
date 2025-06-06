import React, { useState, useEffect } from 'react';
import { testimonials } from '../../data/testimonials';

export const TestimonialsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-gray-900 sm:text-4xl">
            What Our Users Say
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Join thousands of satisfied users who've transformed their content.
          </p>
        </div>

        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-3xl">
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.id}
                className={`
                  absolute top-0 left-0 w-full transition-opacity duration-700 ease-in-out rounded-xl bg-white p-8 shadow-xl
                  ${index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 -z-10'}
                `}
              >
                <div className="flex items-center mb-6">
                  <img 
                    className="h-10 w-10 rounded-full bg-gray-50"
                    src={testimonial.avatar}
                    alt={testimonial.name}
                  />
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
                <blockquote>
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                </blockquote>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-8 space-x-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === activeIndex ? 'bg-primary-500' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};