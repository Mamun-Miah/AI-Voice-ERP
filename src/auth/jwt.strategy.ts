import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import type { Request } from 'express';

interface JwtPayload {
  uuid: string;
  username: string;
  email?: string;
  role?: string;
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
      where: { uuid: payload.uuid },
      select: {
        id: true,
        uuid: true,
        email: true,
        name: true,
        isEmailVerified: true,
        isProfileVerified: true,
        isActive: true,
      },
    });

    //disable users cannot login
    if (!user || !user.isActive) {
      this.logger.warn({ uuid: payload.uuid }, 'User not found or inactive');
      throw new UnauthorizedException('User account is invalid or disabled');
    }
    return user;
  }
}
