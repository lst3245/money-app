import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Cron } from '@nestjs/schedule';
import { RRule } from 'rrule';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);
  constructor(private prisma: PrismaService) {}

  @Cron('30 2 * * *')
  async nightly() {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    let total = 0;
    for (const u of users) {
      total += await this.expandForUser(u.id, new Date());
    }
    if (total) this.logger.log(`Expanded ${total} recurring instances`);
  }

  async expandForUser(userId: string, now: Date) {
    const templates = await this.prisma.recurringTemplate.findMany({ where: { userId } });
    let created = 0;
    for (const t of templates) {
      const rule = RRule.fromString(t.rrule);
      // Expand occurrences for the last 7 days up to today (idempotent create-if-missing)
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const dates = rule.between(start, end, true);
      for (const d of dates) {
        const key = `${t.id}:${d.toISOString().slice(0,10)}`;
        const exists = await this.prisma.transaction.findFirst({
          where: { userId, notes: key }
        });
        if (!exists) {
          await this.prisma.transaction.create({
            data: {
              userId,
              date: d,
              amountCharged: t.amountCharged,
              amountPersonal: t.amountPersonal,
              direction: t.direction,
              categoryId: t.categoryId,
              instrumentId: t.instrumentId,
              merchantId: t.merchantId,
              notes: key + (t.notes ? ` ${t.notes}` : ''),
              tags: t.tags,
            }
          });
          created++;
        }
      }
    }
    return created;
  }
}
