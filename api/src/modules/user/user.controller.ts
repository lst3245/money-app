import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
export class UserController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.userId } });
    return { id: user?.id, email: user?.email, tz: user?.tz, currency: user?.currency };
    }
}
