import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate, Link } from 'react-router-dom';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { RecentHistory } from '../components/dashboard/RecentHistory';
import { Button } from '../components/ui/Button';
import { Wand2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            Welcome back{user?.email ? `, ${user.email}` : ''}
          </h1>
          <p className="mt-1 text-lg text-gray-600">
            Here's an overview of your GhostScribe account
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link to="/humanizer">
            <Button
              leftIcon={<Wand2 className="h-5 w-5" />}
            >
              Humanize Content
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="space-y-6">
        <DashboardStats />
        <RecentHistory />
      </div>
    </div>
  );
};

export default DashboardPage;