import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../../../users/infrastructure/typeorm/user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryColumn()
  id: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}