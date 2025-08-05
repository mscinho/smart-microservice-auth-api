import { UserEntity } from './user.entity';
import { User } from '../../domain/entities/user';

describe('UserEntity', () => {
  // Teste para o método toDomain
  it('should convert a UserEntity to a Domain User', () => {
    const userEntity = new UserEntity();
    userEntity.id = 1;
    userEntity.email = 'test@email.com';
    userEntity.password = 'hashed-password';
    userEntity.isActive = true;

    // A lógica de conversão da entidade de infra para a de domínio
    const userDomain = userEntity.toDomain();

    // Verifica se as propriedades foram mapeadas corretamente
    expect(userDomain.id).toBe(userEntity.id);
    expect(userDomain.email).toBe(userEntity.email);
    expect(userDomain.password).toBe(userEntity.password);
    expect(userDomain.isActive).toBe(userEntity.isActive);
  });

  // Teste para o método fromDomain
  it('should convert a Domain User to a UserEntity', () => {
    const userDomain = new User('test@email.com');
    userDomain.id = 1;
    userDomain.password = 'hashed-password';
    userDomain.isActive = true;

    // A lógica de conversão da entidade de domínio para a de infra
    const userEntity = UserEntity.fromDomain(userDomain);

    // Verifica se as propriedades foram mapeadas corretamente
    expect(userEntity.id).toBe(userDomain.id);
    expect(userEntity.email).toBe(userDomain.email);
    expect(userEntity.password).toBe(userDomain.password);
    expect(userEntity.isActive).toBe(userDomain.isActive);
  });
});