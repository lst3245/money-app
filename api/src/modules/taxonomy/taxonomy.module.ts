import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CategoryController } from './category.controller';
import { MerchantController } from './merchant.controller';
import { InstrumentController } from './instrument.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'dev-secret' })],
  controllers: [CategoryController, MerchantController, InstrumentController],
  providers: [PrismaService, AuthGuard],
})
export class TaxonomyModule {}
