import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
      }

      const result = await authService.login(username, password);

      return res.status(200).json({
        status: 'success',
        data: result
      });

    } catch (error: any) {
      return res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
  }
}