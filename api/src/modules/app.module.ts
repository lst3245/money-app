import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { TransactionModule } from './transaction/transaction.module';
import { RecurringModule } from './recurring/recurring.module';
import { CardModule } from './card/card.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    TaxonomyModule,
    TransactionModule,
    RecurringModule,
    CardModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
