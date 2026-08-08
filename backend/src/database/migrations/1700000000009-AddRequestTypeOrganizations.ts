import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Tipos de solicitação dinâmicos passam a ser restritos por organização —
 * só aparecem/podem ser enviados por departamentos com acesso a pelo menos
 * uma das organizações marcadas. Sem nenhuma marcada, o tipo fica oculto
 * (ver comentário em RequestType.organizations). O card semente de Compra
 * (isBuiltIn) ignora essa lista e continua sempre visível.
 */
export class AddRequestTypeOrganizations1700000000009 implements MigrationInterface {
  name = "AddRequestTypeOrganizations1700000000009";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_type_organizations" (
        "request_type_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "PK_request_type_organizations" PRIMARY KEY ("request_type_id", "organization_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_request_type_organizations_request_type" ON "request_type_organizations" ("request_type_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_request_type_organizations_organization" ON "request_type_organizations" ("organization_id")`);
    await queryRunner.query(`ALTER TABLE "request_type_organizations" ADD CONSTRAINT "FK_request_type_organizations_request_type" FOREIGN KEY ("request_type_id") REFERENCES "request_types"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "request_type_organizations" ADD CONSTRAINT "FK_request_type_organizations_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "request_type_organizations" DROP CONSTRAINT "FK_request_type_organizations_organization"`);
    await queryRunner.query(`ALTER TABLE "request_type_organizations" DROP CONSTRAINT "FK_request_type_organizations_request_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_request_type_organizations_organization"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_request_type_organizations_request_type"`);
    await queryRunner.query(`DROP TABLE "request_type_organizations"`);
  }
}
