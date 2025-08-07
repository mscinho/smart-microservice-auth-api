import { RefreshTokenEntity } from "../../infrastructure/typeorm/refresh-token.entity";

export interface IRefreshTokenRepository {
  create(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  findById(id: string): Promise<RefreshTokenEntity | null>;
  revoke(id: string): Promise<void>;
}