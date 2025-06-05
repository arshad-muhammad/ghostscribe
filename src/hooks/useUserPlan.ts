import { useUser } from '@clerk/clerk-react';

export type UserPlan = 'free' | 'pro';

export const useUserPlan = () => {
  const { user } = useUser();
  
  const isPro = user?.publicMetadata?.plan === 'pro';
  const userPlan: UserPlan = isPro ? 'pro' : 'free';

  const getAvailableModels = () => {
    if (isPro) {
      return ['ninja', 'ghost', 'generator'];
    }
    return ['ninja'];
  };

  return {
    isPro,
    userPlan,
    getAvailableModels,
  };
}; 