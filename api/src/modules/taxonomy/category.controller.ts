import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('categorys')
@UseGuards(AuthGuard)
export class CategoryController {
  constructor(private prisma: PrismaService) {}  

  @Get()
  async list(@Req() req: any) {
    return this.prisma.category.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.prisma.category.create({ data: { ...body, userId: req.userId } });
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.prisma.category.update({ where: { id }, data: body });
  }

  @Delete(':id')
  async del(@Param('id') id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
