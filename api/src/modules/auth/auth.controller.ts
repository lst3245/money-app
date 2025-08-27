import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  private setCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: '/',
    });
  }

  @Get('status')
  async status() {
    return { initialized: await this.auth.hasAnyUser() };
  }

  @Post('setup')
  async setup(@Body() body: any, @Res() res: Response) {
    const { email, password } = body;
    const { token } = await this.auth.setup(email, password);
    this.setCookie(res, token);
    res.json({ ok: true });
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    const { email, password } = body;
    const { token } = await this.auth.login(email, password);
    this.setCookie(res, token);
    res.json({ ok: true });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token', { path: '/' });
    res.json({ ok: true });
  }
}
