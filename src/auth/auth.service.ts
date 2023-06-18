import { ConfigService } from '@nestjs/config';
import { PrismaService } from './../prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async singupLocal(dto: AuthDto): Promise<Tokens> {
    const hashedPass = await this.hashData(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPass,
      },
    });

    const tokens = await this.generateTokens(newUser.id, newUser.email);

    await this.updateRtHash(newUser.id, tokens.refresh_token);

    return tokens;
  }

  async singinLocal(dto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new ForbiddenException('access denied');

    const passwordIsMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordIsMatch) throw new ForbiddenException('access denied');

    const tokens = await this.generateTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logoutLocal(userId: number) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
  }

  async refreshTokens(userId: number, rt: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new ForbiddenException('access denied');

    const rtMatches = await bcrypt.compare(rt, user.hashedRt);

    if (!rtMatches) throw new ForbiddenException('access denied');

    const tokens = await this.generateTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async getUsers(userId: number): Promise<User[]> {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!currentUser.hashedRt)
      throw new UnauthorizedException('You are not authenticated');

    return this.prisma.user.findMany();
  }

  async updateRtHash(userId: number, rt: string) {
    const hash = await this.hashData(rt);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  hashData(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }

  async generateTokens(userId: number, email: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('ACCESS_TOKEN_SECRET_KEY'),
          expiresIn: 60 * 15,
        },
      ),

      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('REFRESH_TOKEN_SECRET_KEY'),
          expiresIn: 60 * 60 * 24 * 7,
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
