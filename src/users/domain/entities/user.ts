export class User {
  id: number;
  email: string;
  password?: string;
  isActive: boolean;
  isTwoFactorAuthenticationEnabled: boolean;
  twoFactorAuthenticationSecret?: string;
  createdAt: Date;

  constructor(email: string) {
    this.email = email;
    this.isActive = false;
    this.isTwoFactorAuthenticationEnabled = false;
  }
}
