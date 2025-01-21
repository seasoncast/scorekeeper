import { createHmac } from 'crypto';

interface JwtHeader {
  alg: string;
  typ: string;
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '1h';

  static async generateToken(userId: string): Promise<string> {
    const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
    const payload: JwtPayload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.JWT_SECRET)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url');

    return `${base64Header}.${base64Payload}.${signature}`;
  }

  static verifyToken(token: string): JwtPayload | null {
    try {
      const [header, payload, signature] = token.split('.');
      const expectedSignature = createHmac('sha256', this.JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const decodedPayload = JSON.parse(
        Buffer.from(payload, 'base64url').toString()
      ) as JwtPayload;

      if (decodedPayload.exp < Date.now() / 1000) {
        return null;
      }

      return decodedPayload;
    } catch (err) {
      return null;
    }
  }
}
