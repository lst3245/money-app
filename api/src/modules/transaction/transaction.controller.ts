import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { subDays } from 'date-fns';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Req() req: any, @Query() q: any) {
    const where: any = { userId: req.userId };
    if (q.from || q.to) {
      where.date = {};
      if (q.from) where.date.gte = new Date(q.from);
      if (q.to) where.date.lte = new Date(q.to);
    }
    if (q.category) where.categoryId = q.category;
    if (q.instrument) where.instrumentId = q.instrument;
    if (q.direction) where.direction = q.direction;
    if (q.q) where.notes = { contains: q.q, mode: 'insensitive' };
    const items = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: Number(q.limit || 200),
      include: { category: true, instrument: true, merchant: true },
    });
    return items;
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const data = {
      userId: req.userId,
      date: new Date(body.date || new Date()),
      amountCharged: Number(body.amountCharged),
      amountPersonal: Number(body.amountPersonal ?? body.amountCharged),
      direction: body.direction,
      categoryId: body.categoryId || null,
      instrumentId: body.instrumentId || null,
      merchantId: body.merchantId || null,
      notes: body.notes || null,
      tags: body.tags || [],
    };
    return this.prisma.transaction.create({ data });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data: any = { ...body };
    if (data.amountCharged !== undefined) data.amountCharged = Number(data.amountCharged);
    if (data.amountPersonal !== undefined) data.amountPersonal = Number(data.amountPersonal);
    if (data.date) data.date = new Date(data.date);
    return this.prisma.transaction.update({ where: { id }, data });
  }

  @Delete(':id')
  async del(@Param('id') id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }

  @Get('export')
  async exportCsv(@Req() req: any, @Res() res: any) {
    const items = await this.prisma.transaction.findMany({ where: { userId: req.userId }, orderBy: { date: 'asc' } });
    const header = 'date,direction,amount_charged,amount_personal,category_id,instrument_id,merchant_id,notes\n';
    const rows = items.map(t => [
      t.date.toISOString(),
      t.direction,
      t.amountCharged,
      t.amountPersonal,
      t.categoryId || '',
      t.instrumentId || '',
      t.merchantId || '',
      (t.notes || '').replace(/\n/g,' ')
    ].join(','));
    res.setHeader('Content-Type','text/csv');
    res.send(header + rows.join('\n'));
  }
}
