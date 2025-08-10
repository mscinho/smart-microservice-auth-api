import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../../../users/infrastructure/typeorm/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetTokenEntity {
  @PrimaryColumn()
  id: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}