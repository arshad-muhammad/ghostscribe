import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Ghost, Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Ghost className="h-24 w-24 text-primary-300 animate-bounce" />
      <h1 className="mt-6 text-4xl font-display font-bold text-gray-900 text-center">
        404 - Page Not Found
      </h1>
      <p className="mt-3 text-lg text-gray-600 text-center max-w-md">
        Oops! It seems this page has vanished like a ghost.
      </p>
      <div className="mt-8">
        <Link to="/">
          <Button
            leftIcon={<Home className="h-5 w-5" />}
          >
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;