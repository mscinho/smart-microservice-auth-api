# Auth-API Microservice

Este é um microserviço de autenticação completo e robusto, projetado para ser a fonte de verdade para a identidade e segurança de uma aplicação. Ele foi construído com base nos princípios da Clean Architecture para garantir alta manutenibilidade, testabilidade e escalabilidade.

## Funcionalidades

O serviço oferece um conjunto completo de recursos de autenticação de nível profissional:

* **Registro de Usuários**: Rota segura para criação de novas contas com criptografia de senha.
* **Login com JWT**: Autenticação de usuários via e-mail e senha, gerando um token de acesso de curta duração (JWT).
* **Login Social (Google OAuth 2.0)**: Permite que o usuário se autentique de forma segura usando sua conta do Google, com criação automática de usuário.
* **Recuperação de Senha**: Fluxo seguro de redefinição de senha, com envio de token único e de curta duração por e-mail.
* **Refresh Token**: Sistema de renovação de tokens seguro, com rotação de refresh token e controle de duração total da sessão, mitigando riscos de segurança.
* **Autenticação de Dois Fatores (2FA)**: Implementação completa de 2FA usando o padrão TOTP, compatível com aplicativos como Google Authenticator.
* **Proteção de Rotas**: Guardiões de rota para proteger endpoints e garantir que apenas usuários autenticados possam acessá-los.
* **Arquitetura Limpa**: O projeto é estruturado em camadas (Domain, Application, Infrastructure), desacoplando a lógica de negócio do framework e do banco de dados.
* **Sistema de Testes Abrangente**: Inclui testes unitários para a lógica interna e testes de integração para os fluxos da API, garantindo a estabilidade e a segurança do serviço.
* **Gerenciamento de Logs**: Logs de acesso detalhados para depuração e auditoria de segurança.

## Tecnologias Principais

* **Framework**: [NestJS](https://nestjs.com/)
* **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
* **Banco de Dados**: [MySQL](https://www.mysql.com/)
* **ORM**: [TypeORM](https://typeorm.io/)
* **Testes**: [Jest](https://jestjs.io/) e [Supertest](https://github.com/visionmedia/supertest)
* **Segurança**: `bcrypt`, `speakeasy`, `@nestjs/jwt`, `passport-google-oauth20`
* **E-mail**: `nodemailer`

## Como Iniciar

1.  Clone o repositório.
2.  Instale as dependências: `npm install`
3.  Configure o banco de dados e as variáveis de ambiente em um arquivo `.env` na raiz do projeto.
    
    `JWT_SECRET=sua_chave_secreta_aqui`
    `GOOGLE_CLIENT_ID=seu_client_id_aqui`
    `GOOGLE_CLIENT_SECRET=seu_client_secret_aqui`
    
4.  Execute a aplicação em modo de desenvolvimento: `npm run start:dev`

## Endpoints da API

* `POST /users/register`: Registra um novo usuário.
* `POST /auth/login`: Faz o login e retorna os tokens ou a mensagem de 2FA.
* `POST /auth/refresh`: Renova os tokens de acesso e refresh.
* `GET /auth/google`: Inicia o fluxo de login com o Google.
* `GET /auth/google/callback`: Rota de retorno do Google.
* `POST /auth/forgot-password`: Inicia o fluxo de recuperação de senha.
* `POST /auth/reset-password`: Redefine a senha do usuário com um token válido.
* `POST /auth/2fa/generate`: Gera o segredo da 2FA e o QR code para um usuário autenticado.
* `POST /auth/2fa/verify`: Ativa a 2FA para um usuário autenticado.
* `POST /auth/2fa/login`: Completa o login de um usuário com 2FA.
* `GET /users/profile`: Rota protegida, retorna o perfil do usuário logado.

## Testes

Para executar os testes:

* **Testes Unitários**: `npm run test:unit` (ou `npm test`)
* **Testes de Integração**: `npm run test:integration`
* **Testes E2E**: `npm run test:e2e`