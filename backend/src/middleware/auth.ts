import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import type { User, UserRole } from '../types/index.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'nawi-verify-oiml-sih-2026-super-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = db.getUserById(decoded.id);
      if (user && user.active) {
        req.user = user;
        return next();
      }
    } catch (err) {
      // Invalid JWT token
    }
  }

  // Fallback for seamless hackathon role switcher / dev mode header
  const roleHeader = req.headers['x-user-role'] as UserRole | undefined;
  const idHeader = req.headers['x-user-id'] as string | undefined;

  if (idHeader) {
    const user = db.getUserById(idHeader);
    if (user && user.active) {
      req.user = user;
      return next();
    }
  }

  if (roleHeader) {
    const user = db.getUsers().find((u) => u.role === roleHeader);
    if (user && user.active) {
      req.user = user;
      return next();
    }
  }

  // Default fallback user for easy demonstration if not provided
  const defaultUser = db.getUsers().find((u) => u.role === 'technician') || db.getUsers()[0];
  if (defaultUser) {
    req.user = defaultUser;
    return next();
  }

  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication token required.',
    },
  });
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized. Allowed roles: ${allowedRoles.join(', ')}.`,
        },
      });
    }

    next();
  };
}
