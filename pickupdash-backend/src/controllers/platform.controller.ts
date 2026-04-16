import { Request, Response } from 'express';
import { PlatformService } from '../services/platform.service';
import { AuthenticatedRequest } from '../types/request.types';

export const linkPlatform = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  const result = await PlatformService.linkPlatform(userId, req.body.accessToken, req.body.refreshToken);
  res.status(200).json(result);
};

export const unlinkPlatform = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  const result = await PlatformService.unlinkPlatform(userId);
  res.status(200).json(result);
};