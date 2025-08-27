import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async hasAnyUser(): Promise<boolean> {
    const count = await this.prisma.user.count();
    return count > 0;
  }

  async setup(email: string, password: string) {
    if (await this.hasAnyUser()) {
      throw new UnauthorizedException('Already initialized');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });
    return this.sign(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.sign(user.id, user.email);
  }

  sign(id: string, email: string) {
    const token = this.jwt.sign({ sub: id, email });
    return { token };
  }
}
