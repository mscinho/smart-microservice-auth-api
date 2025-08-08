import { Request } from 'express';
import { UserPayloadDto } from '../../auth/application/dtos/user-payload.dto';

export interface RequestWithUser extends Request {
  user: UserPayloadDto;
}