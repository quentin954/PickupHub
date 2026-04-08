import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterInput, LoginInput, RefreshInput, LogoutInput } from '../dto/auth.dto';

export const register = async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body as RegisterInput);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body as LoginInput);
  res.status(200).json(result);
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshInput;
  const result = await AuthService.refresh(refreshToken);
  res.status(200).json(result);
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as LogoutInput;
  const result = await AuthService.logout(refreshToken);
  res.status(200).json(result);
};