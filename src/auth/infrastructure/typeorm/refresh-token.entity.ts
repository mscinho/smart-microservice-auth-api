import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../../../users/infrastructure/typeorm/user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryColumn()
  id: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @Column({ type: 'timestamp', name: 'session_created_at' })
  sessionCreatedAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}