import { User } from '../entities/user';

export interface IUsersRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(user: User): Promise<User>;
  save(user: User): Promise<User>;
}
