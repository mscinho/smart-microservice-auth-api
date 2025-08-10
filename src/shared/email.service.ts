// src/auth/application/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/domain/entities/user';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false, // true para 465, false para outras portas
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetLink = `http://localhost:4200/reset-password?token=${token}`;
    
    await this.transporter.sendMail({
      from: '"Auth API" <no-reply@auth-api.com>',
      to: user.email,
      subject: 'Redefinição de Senha',
      html: `
        <p>Olá,</p>
        <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetLink}">Redefinir Senha</a>
        <p>Este link é válido por uma hora.</p>
      `,
    });
  }
}