import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Solicitações dinâmicas (RequestSubmission) passam a carregar organização,
 * igual à Solicitação de Compra — escolhida pelo usuário dentre as
 * organizações que seu departamento acessa.
 */
export class AddRequestSubmissionOrganization1700000000008 implements MigrationInterface {
  name = "AddRequestSubmissionOrganization1700000000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "request_submissions" ADD "organization_id" uuid`);
    await queryRunner.query(`ALTER TABLE "request_submissions" ADD CONSTRAINT "FK_request_submissions_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "request_submissions" DROP CONSTRAINT "FK_request_submissions_organization"`);
    await queryRunner.query(`ALTER TABLE "request_submissions" DROP COLUMN "organization_id"`);
  }
}
