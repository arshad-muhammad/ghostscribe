import { UserPlan } from '../hooks/useUserPlan';

// Function to update user's plan in Clerk
export const updateUserPlan = async (userId: string, plan: UserPlan) => {
  try {
    const response = await fetch(`/api/users/${userId}/plan`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user plan');
    }

    return true;
  } catch (error) {
    console.error('Error updating user plan:', error);
    return false;
  }
};

// Function to check if a feature is available for the user's plan
export const isFeatureAvailable = (userPlan: UserPlan, feature: string): boolean => {
  const planFeatures = {
    free: ['ninja'],
    pro: ['ninja', 'ghost', 'generator'],
  };

  return planFeatures[userPlan].includes(feature);
}; 