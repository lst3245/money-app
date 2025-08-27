import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CardController } from './card.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'dev-secret' })],
  controllers: [CardController],
  providers: [PrismaService, AuthGuard],
})
export class CardModule {}
