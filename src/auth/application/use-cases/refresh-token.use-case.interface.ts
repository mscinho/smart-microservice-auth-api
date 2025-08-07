import { User } from "../../../users/domain/entities/user";

export interface IRefreshTokenUseCase {
  execute(refreshToken: string): Promise<{ user: User; accessToken: string; refreshToken: string }>;
}