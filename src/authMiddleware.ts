import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();
const secret = 'mysecretkey'; 

// Estendendo a interface Request para incluir a propriedade user
declare global {
  namespace Express {
    interface Request {
      user?: User; // Ou qualquer outro tipo que represente seu usuário
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Formato: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token not found' });
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: number };

    // Verificar se o usuário existe no banco de dados
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Adicionar o usuário ao objeto de requisição para uso posterior nas rotas
    req.user = user;

    next();
  } catch (error) {
    console.error('Error authenticating token:', error);
    return res.status(403).json({ error: 'Forbidden' });
  }
};
