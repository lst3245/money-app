import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';

function getPeriod(now: Date, statementDay: number | null) {
  if (!statementDay) return null;
  const y = now.getFullYear();
  const m = now.getMonth();
  const periodStart = new Date(y, m, statementDay);
  if (now < periodStart) {
    // previous month
    const prev = new Date(y, m - 1, statementDay);
    const end = new Date(y, m, statementDay);
    return { start: prev, end };
  } else {
    const end = new Date(y, m + 1, statementDay);
    return { start: periodStart, end };
  }
}

@Controller('cards')
@UseGuards(AuthGuard)
export class CardController {
  constructor(private prisma: PrismaService) {}

  @Get('cycles')
  async cycles(@Req() req: any, @Query('instrumentId') instrumentId: string) {
    const card = await this.prisma.paymentInstrument.findFirst({ where: { id: instrumentId, userId: req.userId } });
    if (!card?.statementDay) return { instrumentId, balance: 0, period: null, dueDate: null };
    const period = getPeriod(new Date(), card.statementDay);
    const txs = await this.prisma.transaction.findMany({
      where: { userId: req.userId, instrumentId, date: { gte: period!.start, lt: period!.end } },
    });
    const charged = txs.reduce((s, t) => s + (t.direction === 'expense' ? t.amountCharged : -t.amountCharged), 0);
    let dueDate: Date | null = null;
    if (card.paymentDay) {
      dueDate = new Date(period!.end.getFullYear(), period!.end.getMonth(), card.paymentDay);
    }
    return { instrumentId, balance: charged, period, dueDate };
  }

  @Get('upcoming-due')
  async upcoming(@Req() req: any) {
    const cards = await this.prisma.paymentInstrument.findMany({ where: { userId: req.userId, type: 'credit_card' } });
    const now = new Date();
    const items = [];
    for (const c of cards) {
      if (!c.statementDay || !c.paymentDay) continue;
      const period = (function(){
        const y = now.getFullYear();
        const m = now.getMonth();
        const periodStart = new Date(y, m, c.statementDay!);
        if (now < periodStart) return { start: new Date(y, m-1, c.statementDay!), end: new Date(y, m, c.statementDay!) };
        return { start: new Date(y, m, c.statementDay!), end: new Date(y, m+1, c.statementDay!) };
      })();
      const due = new Date(period.end.getFullYear(), period.end.getMonth(), c.paymentDay);
      const txs = await this.prisma.transaction.findMany({ where: { userId: req.userId, instrumentId: c.id, date: { gte: period.start, lt: period.end } } });
      const charged = txs.reduce((s, t) => s + (t.direction === 'expense' ? t.amountCharged : -t.amountCharged), 0);
      items.push({ cardId: c.id, name: c.name, dueDate: due, balance: charged });
    }
    return items.sort((a,b)=> a.dueDate.getTime() - b.dueDate.getTime());
  }
}
