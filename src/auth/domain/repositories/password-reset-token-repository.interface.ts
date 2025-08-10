import { User } from '../../../users/domain/entities/user';
import { PasswordResetTokenEntity } from "../../infrastructure/typeorm/password-reset-token.entity";


export interface IPasswordResetTokenRepository {
  create(token: PasswordResetTokenEntity): Promise<PasswordResetTokenEntity>;
  findById(id: string): Promise<PasswordResetTokenEntity | null>;
  findActiveByUser(user: User): Promise<PasswordResetTokenEntity | null>;
  revoke(id: string): Promise<void>;
}