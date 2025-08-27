import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TransactionController } from './transaction.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'dev-secret' })],
  controllers: [TransactionController],
  providers: [PrismaService, AuthGuard],
})
export class TransactionModule {}
