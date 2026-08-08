import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Segunda camada, opcional, de restrição de visibilidade de um Tipo de
 * Solicitação: além de organização, o admin pode marcar departamentos
 * específicos. Vazio = sem restrição extra (só vale a regra de organização
 * já existente) — não quebra nenhum tipo já configurado.
 */
export class AddRequestTypeVisibleDepartments1700000000010 implements MigrationInterface {
  name = "AddRequestTypeVisibleDepartments1700000000010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_type_departments" (
        "request_type_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        CONSTRAINT "PK_request_type_departments" PRIMARY KEY ("request_type_id", "department_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_request_type_departments_request_type" ON "request_type_departments" ("request_type_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_request_type_departments_department" ON "request_type_departments" ("department_id")`);
    await queryRunner.query(`ALTER TABLE "request_type_departments" ADD CONSTRAINT "FK_request_type_departments_request_type" FOREIGN KEY ("request_type_id") REFERENCES "request_types"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "request_type_departments" ADD CONSTRAINT "FK_request_type_departments_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "request_type_departments" DROP CONSTRAINT "FK_request_type_departments_department"`);
    await queryRunner.query(`ALTER TABLE "request_type_departments" DROP CONSTRAINT "FK_request_type_departments_request_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_request_type_departments_department"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_request_type_departments_request_type"`);
    await queryRunner.query(`DROP TABLE "request_type_departments"`);
  }
}
