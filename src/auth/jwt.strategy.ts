import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  id: string;
  phone: string;
  username?: string;
  role: string;
  businessId: string;
  isPhoneVerified: boolean;
  iat?: number;
  exp?: number;
}

interface RequestWithCookies extends Request {
  cookies: {
    Authentication?: unknown;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @InjectPinoLogger(JwtStrategy.name)
    private readonly logger: PinoLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const request = req as RequestWithCookies;
          const token = request.cookies?.Authentication;

          if (typeof token !== 'string') {
            return null;
          }

          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Fetch user
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id }, // or payload.sub
      select: {
        id: true,
        phone: true,
        name: true,
        role: true, // <--- ADDED: Required by Controller
        businessId: true, // <--- ADDED: Required by Controller
        isPhoneVerified: true,
        isActive: true,
      },
    });

    // Disable users cannot login
    if (!user || !user.isActive) {
      this.logger.warn({ id: payload.id }, 'User not found or inactive');
      throw new UnauthorizedException('User account is invalid or disabled');
    }

    // This object becomes req.user
    return user;
  }
}
