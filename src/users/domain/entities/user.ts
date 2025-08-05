export class User {
  id: number;
  email: string;
  password?: string;
  isActive: boolean;

  constructor(email: string) {
    this.email = email;
    this.isActive = false;
  }
}
