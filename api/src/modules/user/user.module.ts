import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from '../../prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'dev-secret' })],
  controllers: [UserController],
  providers: [PrismaService, AuthGuard],
})
export class UserModule {}
