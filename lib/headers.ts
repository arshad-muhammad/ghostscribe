import { headers } from 'next/headers';

interface HeadersList {
  get(name: string): string | null;
}

export function getAuthHeader(): string | null {
  try {
    const headersList = headers() as unknown as HeadersList;
    return headersList.get('Authorization');
  } catch (error) {
    console.error('Error getting headers:', error);
    return null;
  }
} 