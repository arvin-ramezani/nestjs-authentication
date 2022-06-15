import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './auth/guards';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
    }),

    AuthModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [
    ////////////// this way reflector automatically will add to guard
    // {
    //   provide: APP_GUARD,
    //   useClass: AtGuard,
    // },
  ],
})
export class AppModule {}
