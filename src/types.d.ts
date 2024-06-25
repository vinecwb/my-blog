import { PrismaClient, User } from '@prisma/client';
import { Request } from 'express';

// Sobrescreva a interface Request do Express para incluir a propriedade user
declare global {
  namespace Express {
    interface Request {
      user?: User; // Define a propriedade user opcional como um objeto do tipo User do Prisma
    }
  }
}