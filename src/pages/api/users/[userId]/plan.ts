import { clerkClient } from '@clerk/clerk-sdk-node';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const { plan } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Update the user's public metadata in Clerk
    await clerkClient.users.updateUser(userId as string, {
      publicMetadata: { plan },
    });

    return res.status(200).json({ message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Error updating user plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 