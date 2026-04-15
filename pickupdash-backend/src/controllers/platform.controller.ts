import { Request, Response } from 'express';
import { PlatformService } from '../services/platform.service';
import { AuthenticatedRequest } from '../types/request.types';
import { linkPlatformSchema } from '../dto/platform.dto';

export const linkPlatform = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  const data = linkPlatformSchema.parse(req.body);
  
  const result = await PlatformService.linkPlatform(userId, data.accessToken, data.refreshToken);
  res.status(200).json(result);
};

export const unlinkPlatform = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user['id'];
  
  const result = await PlatformService.unlinkPlatform(userId);
  res.status(200).json(result);
};