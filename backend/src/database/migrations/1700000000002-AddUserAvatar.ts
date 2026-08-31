import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Foto de perfil do usuário — guardada como data URL (base64) direto na
 * coluna, não em disco. Decisão deliberada: é sempre uma imagem PEQUENA (o
 * front redimensiona/comprime no client antes de enviar, e o backend valida
 * o tamanho de novo), então não compensa a complexidade extra de um
 * endpoint de arquivo autenticado só pra isso — um <img src> com a data URL
 * já basta em qualquer lugar que precise mostrar o avatar.
 */
export class AddUserAvatar1700000000002 implements MigrationInterface {
  name = "AddUserAvatar1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_data_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_data_url"`);
  }
}
