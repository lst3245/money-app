import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'dev-secret' })],
  controllers: [RecurringController],
  providers: [PrismaService, RecurringService, AuthGuard],
})
export class RecurringModule {}
