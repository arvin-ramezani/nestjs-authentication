import { RtGuard, AtGuard } from './guards';
import { Tokens } from './types/tokens.type';
import { AuthDto } from './dto';
import { AuthService } from './auth.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GetCurrentUser, GetCurrentUserId, Public } from './decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('local/signup')
  singupLocal(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.singupLocal(dto);
  }

  @Public()
  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  singinLocal(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.singinLocal(dto);
  }

  @Post('local/logout')
  @HttpCode(HttpStatus.OK)
  logoutLocal(@GetCurrentUserId() userId: number) {
    return this.authService.logoutLocal(userId);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('local/refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') rt: string,
  ) {
    return this.authService.refreshTokens(userId, rt);
  }

  @Get('users/get')
  getUsers(@GetCurrentUserId() userId: number) {
    return this.authService.getUsers(userId);
  }
}
