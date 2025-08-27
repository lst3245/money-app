import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RecurringService } from './recurring.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('recurring-templates')
@UseGuards(AuthGuard)
export class RecurringController {
  constructor(private prisma: PrismaService, private svc: RecurringService) {}

  @Get()
  async list(@Req() req: any) {
    return this.prisma.recurringTemplate.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const data = {
      userId: req.userId,
      direction: body.direction,
      amountCharged: Number(body.amountCharged),
      amountPersonal: Number(body.amountPersonal ?? body.amountCharged),
      categoryId: body.categoryId || null,
      instrumentId: body.instrumentId || null,
      merchantId: body.merchantId || null,
      notes: body.notes || null,
      tags: body.tags || [],
      rrule: body.rrule,
      startDate: new Date(body.startDate || new Date()),
      endDate: body.endDate ? new Date(body.endDate) : null,
    };
    return this.prisma.recurringTemplate.create({ data });
  }

  @Delete(':id')
  async del(@Param('id') id: string) {
    return this.prisma.recurringTemplate.delete({ where: { id } });
  }

  @Post('run')
  async run(@Req() req: any) {
    const count = await this.svc.expandForUser(req.userId, new Date());
    return { created: count };
  }
}
