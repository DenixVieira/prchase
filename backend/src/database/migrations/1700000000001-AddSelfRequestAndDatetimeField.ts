import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Duas mudanças independentes pro construtor de Tipos de Solicitação:
 * 1. "is_self_request_only" (autosolicitação) em request_types — tipo só
 *    visível/enviável por quem é do próprio departamento responsável.
 * 2. Novo valor DATETIME no enum de tipo de campo (request_fields), pro
 *    campo "Data e Hora" (distinto do "Data" já existente).
 */
export class AddSelfRequestAndDatetimeField1700000000001 implements MigrationInterface {
  name = "AddSelfRequestAndDatetimeField1700000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "request_types" ADD "is_self_request_only" boolean NOT NULL DEFAULT false`);

    await queryRunner.query(`ALTER TYPE "public"."request_fields_type_enum" RENAME TO "request_fields_type_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."request_fields_type_enum" AS ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'FILE')`);
    await queryRunner.query(`ALTER TABLE "request_fields" ALTER COLUMN "type" TYPE "public"."request_fields_type_enum" USING "type"::"text"::"public"."request_fields_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."request_fields_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."request_fields_type_enum" RENAME TO "request_fields_type_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."request_fields_type_enum" AS ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'FILE')`);
    // Campos que já usavam DATETIME viram DATE no rollback (não há como "desfazer" pra um valor que deixou de existir).
    await queryRunner.query(`UPDATE "request_fields" SET "type" = 'DATE' WHERE "type" = 'DATETIME'`);
    await queryRunner.query(`ALTER TABLE "request_fields" ALTER COLUMN "type" TYPE "public"."request_fields_type_enum" USING "type"::"text"::"public"."request_fields_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."request_fields_type_enum_old"`);

    await queryRunner.query(`ALTER TABLE "request_types" DROP COLUMN "is_self_request_only"`);
  }
}
