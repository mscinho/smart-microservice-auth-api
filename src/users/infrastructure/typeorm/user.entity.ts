import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../domain/entities/user';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column({ default: false, name: 'is_active' })
  isActive: boolean;

  // Métodos para converter entre a entidade de domínio e a de infraestrutura
  toDomain(): User {
    const user = new User(this.email);
    user.id = this.id;
    user.isActive = this.isActive;
    user.password = this.password;
    return user;
  }

  static fromDomain(user: User): UserEntity {
    const userEntity = new UserEntity();
    userEntity.id = user.id;
    userEntity.email = user.email;
    userEntity.isActive = user.isActive;
    userEntity.password = user.password;
    return userEntity;
  }
}
