import { prisma } from '../config/database';
import { PackageQueryInput, UpdatePackageInput } from '../dto/packages.dto';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors/errors';
import { log } from '../utils/logger';
import { decrypt, encrypt } from '../utils/crypto';
import { PlatformService } from './platform.service';
import jwt from 'jsonwebtoken';

export class PackageService {
  static async getPackages(userId: string, query: PackageQueryInput) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              conversationId: true,
              transactionId: true,
              title: true,
              priceAmount: true,
              priceCurrency: true,
              itemPhotoUrl: true,
            },
          },
        },
      }),
      prisma.package.count({ where }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSyncedAt: true },
    });

    const data = packages.map((pkg: any) => ({
      id: pkg.id,
      orderId: pkg.orderId,
      trackingCode: pkg.trackingCode,
      carrierCode: pkg.carrierCode,
      trackingUrl: pkg.trackingUrl,
      carrierLogoUrl: pkg.carrierLogoUrl,
      lockerName: pkg.lockerName,
      lockerAddress: pkg.lockerAddress,
      lockerPostalCode: pkg.lockerPostalCode,
      lockerCity: pkg.lockerCity,
      retrievalCode: pkg.retrievalCode,
      qrCodeData: pkg.qrCodeData,
      status: pkg.status,
      expiryDate: pkg.expiryDate,
      order: pkg.order ? {
        id: pkg.order.id,
        conversationId: pkg.order.conversationId.toString(),
        transactionId: pkg.order.transactionId.toString(),
        title: pkg.order.title,
        priceAmount: Number(pkg.order.priceAmount),
        priceCurrency: pkg.order.priceCurrency,
        itemPhotoUrl: pkg.order.itemPhotoUrl,
      } : null,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        lastSync: user?.lastSyncedAt?.toISOString() || null,
      },
    };
  }

  static async synchronize(userId: string) {
    const platformAccount = await prisma.platformAccount.findUnique({
      where: { userId },
    });

    if (!platformAccount) {
      throw new BadRequestError('Platform account not linked.');
    }

    log('info', 'Starting package synchronization', { userId });

    let accessToken = decrypt(platformAccount.encryptedAccessToken);
    const decodedToken = jwt.decode(accessToken) as { exp?: number } | null;

    if (decodedToken?.exp && decodedToken.exp * 1000 < Date.now()) {
      log('info', 'Access token expired, refreshing', { userId });
      const refreshedTokens = await PlatformService.refreshToken(
        decrypt(platformAccount.encryptedRefreshToken || '')
      );
      accessToken = refreshedTokens.access_token;

      await prisma.platformAccount.update({
        where: { userId },
        data: {
          encryptedAccessToken: encrypt(accessToken),
          encryptedRefreshToken: encrypt(refreshedTokens.refresh_token),
        },
      });
    }

    let orders;
    try {
      orders = await PlatformService.getOrders(accessToken);
      log('info', `Received ${orders.my_orders?.length || 0} orders from platform`, { userId });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('401')) {
        log('info', '401 received, refreshing token and retrying', { userId });
        const refreshedTokens = await PlatformService.refreshToken(
          decrypt(platformAccount.encryptedRefreshToken || '')
        );
        accessToken = refreshedTokens.access_token;

        await prisma.platformAccount.update({
          where: { userId },
          data: {
            encryptedAccessToken: encrypt(accessToken),
            encryptedRefreshToken: encrypt(refreshedTokens.refresh_token),
          },
        });

        orders = await PlatformService.getOrders(accessToken);
        log('info', `Received ${orders.my_orders?.length || 0} orders after retry`, { userId });
      } else {
        throw error;
      }
    }

    for (const order of orders.my_orders || []) {
      let existingOrder = await prisma.order.findUnique({
        where: { transactionId: BigInt(order.transaction_id) },
      });

      if (!existingOrder) {
        existingOrder = await prisma.order.create({
          data: {
            userId,
            conversationId: BigInt(order.conversation_id),
            transactionId: BigInt(order.transaction_id),
            title: order.title,
            priceAmount: order.price.amount,
            priceCurrency: order.price.currency_code,
            itemPhotoUrl: order.photo?.url ?? null,
          },
        });
      }

      let shipmentInfo;
      try {
        shipmentInfo = await PlatformService.getShipmentInformation(
          accessToken,
          order.transaction_id.toString()
        );
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('401')) {
          log('info', '401 received for shipment, refreshing token', { userId });
          const refreshedTokens = await PlatformService.refreshToken(
            decrypt(platformAccount.encryptedRefreshToken || '')
          );
          accessToken = refreshedTokens.access_token;

          await prisma.platformAccount.update({
            where: { userId },
            data: {
              encryptedAccessToken: encrypt(accessToken),
              encryptedRefreshToken: encrypt(refreshedTokens.refresh_token),
            },
          });

          shipmentInfo = await PlatformService.getShipmentInformation(
            accessToken,
            order.transaction_id.toString()
          );
        } else {
          throw error;
        }
      }

      const existingPackage = await prisma.package.findFirst({
        where: { orderId: existingOrder.id },
      });

      if (
        existingPackage &&
        shipmentInfo.journey_summary?.status === 'delivered' &&
        existingPackage.status !== 'delivered'
      ) {
        await prisma.package.update({
          where: { id: existingPackage.id },
          data: { status: 'delivered' },
        });
      }

      if (shipmentInfo.journey_summary?.status === 'available_for_pickup') {
        const trackingCode = shipmentInfo.journey_summary.current_carrier?.tracking_code?.slice(0, -2) ||
          shipmentInfo.journey_summary.current_carrier?.tracking_code ||
          '';
        const carrierCode = shipmentInfo.journey_summary.current_carrier?.code;

        if (!trackingCode || !carrierCode) {
          continue;
        }

        log('info', `Order ${order.transaction_id} is available for pickup`, {
          trackingCode,
          carrierCode,
          userId,
        });

        if (existingPackage && existingPackage.status === 'available_for_pickup') {
          continue;
        }

        //

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncedAt: new Date() },
    });

    log('info', 'Package synchronization completed', { userId });

    return {
      message: 'Sync completed successfully.',
      lastSync: new Date().toISOString(),
    };
  }

  static async updatePackage(userId: string, packageId: string, data: UpdatePackageInput) {
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundError('Package');
    }

    if (pkg.userId !== userId) {
      throw new ForbiddenError('Access denied.');
    }

    const allowedStatuses = ['AVAILABLE_FOR_PICKUP', 'DELIVERED', 'EXPIRED', 'IN_TRANSIT'];
    if (!allowedStatuses.includes(data.status)) {
      throw new BadRequestError('Invalid status. Allowed: AVAILABLE_FOR_PICKUP, DELIVERED, EXPIRED, IN_TRANSIT');
    }

    const updated = await prisma.package.update({
      where: { id: packageId },
      data: { status: data.status },
    });

    log('info', 'Package updated', { packageId, status: data.status });

    return { status: updated.status };
  }
}