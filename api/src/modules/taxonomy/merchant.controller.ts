import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('merchants')
@UseGuards(AuthGuard)
export class MerchantController {
  constructor(private prisma: PrismaService) {}  

  @Get()
  async list(@Req() req: any) {
    return this.prisma.merchant.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.prisma.merchant.create({ data: { ...body, userId: req.userId } });
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.prisma.merchant.update({ where: { id }, data: body });
  }

  @Delete(':id')
  async del(@Param('id') id: string) {
    return this.prisma.merchant.delete({ where: { id } });
  }
}
