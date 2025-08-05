import { User } from '../../domain/entities/user';

export class UserPresenter {
  id: number;
  email: string;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
  }
}