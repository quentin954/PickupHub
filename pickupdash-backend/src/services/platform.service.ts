import { prisma } from '../config/database';
import { encrypt } from '../utils/crypto';
import { fetchWithRetry } from '../utils/fetch';
import { PLATFORM_API_URL, PLATFORM_USER_AGENT, PLATFORM_DEVICE_UUID } from '../config/config';
import { NotFoundError } from '../errors/errors';

const PLATFORM_HEADERS = {
  'User-Agent': PLATFORM_USER_AGENT,
  'X-Device-UUID': PLATFORM_DEVICE_UUID,
};

interface Order {
  transaction_id: number;
  conversation_id: number;
  title: string;
  price: { amount: number; currency_code: string };
  photo?: { url: string };
}

interface ShipmentInfo {
  journey_summary?: {
    status: string;
    current_carrier?: { code: string; tracking_code: string };
  };
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export const PlatformService = {
  async login(username: string, password: string) {
    const response = await fetchWithRetry(`${PLATFORM_API_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...PLATFORM_HEADERS,
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'android',
        scope: 'user',
        username,
        password,
      }),
    });
    return response;
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetchWithRetry(`${PLATFORM_API_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...PLATFORM_HEADERS,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'android',
        refresh_token: refreshToken,
      }),
    }) as Promise<TokenResponse>;
    return response;
  },

  async getOrders(accessToken: string): Promise<{ my_orders?: Order[] }> {
    const response = await fetchWithRetry(
      `${PLATFORM_API_URL}/api/v2/my_orders?per_page=500&page=1&type=purchased&status=in_progress`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...PLATFORM_HEADERS,
        },
      }
    ) as Promise<{ my_orders?: Order[] }>;
    return response;
  },

  async getShipmentInformation(accessToken: string, transactionId: string): Promise<ShipmentInfo> {
    const response = await fetchWithRetry(
      `${PLATFORM_API_URL}/api/v2/transactions/${transactionId}/shipment/journey_summary`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...PLATFORM_HEADERS,
        },
      }
    ) as Promise<ShipmentInfo>;
    return response;
  },

  async linkPlatform(userId: string, accessToken: string, refreshToken: string) {
    const existing = await prisma.platformAccount.findUnique({
      where: { userId },
    });

    if (existing) {
      await prisma.platformAccount.update({
        where: { userId },
        data: {
          encryptedAccessToken: encrypt(accessToken),
          encryptedRefreshToken: encrypt(refreshToken),
        },
      });
    } else {
      await prisma.platformAccount.create({
        data: {
          userId,
          encryptedAccessToken: encrypt(accessToken),
          encryptedRefreshToken: encrypt(refreshToken),
        },
      });
    }

    return { message: 'Platform account linked successfully.' };
  },

  async unlinkPlatform(userId: string) {
    const existing = await prisma.platformAccount.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundError('Platform account');
    }

    await prisma.platformAccount.delete({
      where: { userId },
    });

    return { message: 'Platform account unlinked successfully.' };
  },
};