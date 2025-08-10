import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../domain/entities/user';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: false, name: 'is_active' })
  isActive: boolean;

  @Column({ default: false, name: 'is_two_factor_authentication_enabled' })
  isTwoFactorAuthenticationEnabled: boolean;

  @Column({ nullable: true, name: 'two_factor_authentication_secret' })
  twoFactorAuthenticationSecret?: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Métodos para converter entre a entidade de domínio e a de infraestrutura
  toDomain(): User {
    const user = new User(this.email);
    user.id = this.id;
    user.isActive = this.isActive;
    user.password = this.password;
    user.isTwoFactorAuthenticationEnabled = this.isTwoFactorAuthenticationEnabled;
    user.twoFactorAuthenticationSecret = this.twoFactorAuthenticationSecret;
    user.createdAt = this.createdAt;
    return user;
  }

  static fromDomain(user: User): UserEntity {
    const userEntity = new UserEntity();
    userEntity.id = user.id;
    userEntity.email = user.email;
    userEntity.isActive = user.isActive;
    userEntity.password = user.password;
    userEntity.isTwoFactorAuthenticationEnabled = user.isTwoFactorAuthenticationEnabled;
    userEntity.twoFactorAuthenticationSecret = user.twoFactorAuthenticationSecret;
    userEntity.createdAt = user.createdAt;
    return userEntity;
  }
}
