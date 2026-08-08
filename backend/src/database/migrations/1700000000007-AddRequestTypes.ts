import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Generalização do sistema de solicitações: introduz RequestType/RequestField
 * (tipos de solicitação cadastráveis pelo admin, com formulário dinâmico) e
 * RequestSubmission (instância genérica, sem aprovação, que vira Ticket
 * direto). Puramente aditivo — nenhuma tabela/coluna existente de
 * purchase_requests é tocada; em tickets só relaxamos purchase_request_id
 * pra aceitar NULL e adicionamos duas colunas novas nullable.
 *
 * As linhas de permissão (MANAGE_REQUEST_TYPES/CREATE_REQUEST) e o registro
 * semente do RequestType de Compra são inseridos por `npm run seed`
 * (idempotente), não por esta migration — mesma convenção já usada pras
 * demais permissões do sistema (ver AddTags1700000000003 + run-seed.ts).
 */
export class AddRequestTypes1700000000007 implements MigrationInterface {
  name = "AddRequestTypes1700000000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- extend permissions_key_enum -----------------------------------
    await queryRunner.query(`ALTER TYPE "public"."permissions_key_enum" RENAME TO "permissions_key_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."permissions_key_enum" AS ENUM('CREATE_PURCHASE_REQUEST', 'EDIT_PURCHASE_REQUEST', 'CANCEL_PURCHASE_REQUEST', 'VIEW_PURCHASE_REQUEST', 'APPROVE_PURCHASE_REQUEST', 'MOVE_TICKET', 'RESOLVE_TICKET', 'CANCEL_TICKET', 'DELETE_TICKET', 'COMMENT_TICKET', 'ATTACH_FILES', 'VIEW_TICKET', 'VIEW_ARCHIVED_TICKETS', 'EXPORT_INVOICES', 'CREATE_TAG', 'VIEW_DEVICE', 'CREATE_DEVICE', 'EDIT_DEVICE', 'DELETE_DEVICE', 'REGISTER_DEVICE_MAINTENANCE', 'MANAGE_USERS', 'MANAGE_DEPARTMENTS', 'MANAGE_SETTINGS', 'SYSTEM_ADMIN', 'MANAGE_REQUEST_TYPES', 'CREATE_REQUEST')`);
    await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "key" TYPE "public"."permissions_key_enum" USING "key"::"text"::"public"."permissions_key_enum"`);
    await queryRunner.query(`DROP TYPE "public"."permissions_key_enum_old"`);

    // --- request_types ----------------------------------------------------
    await queryRunner.query(`CREATE TYPE "public"."request_types_source_kind_enum" AS ENUM('DYNAMIC', 'PURCHASE_REQUEST')`);
    await queryRunner.query(`
      CREATE TABLE "request_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(150) NOT NULL,
        "description" text,
        "department_id" uuid,
        "icon" character varying(60),
        "source_kind" "public"."request_types_source_kind_enum" NOT NULL DEFAULT 'DYNAMIC',
        "is_built_in" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_request_types_name" UNIQUE ("name"),
        CONSTRAINT "PK_request_types" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "request_types" ADD CONSTRAINT "FK_request_types_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    // --- request_fields -----------------------------------------------
    await queryRunner.query(`CREATE TYPE "public"."request_fields_type_enum" AS ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'FILE')`);
    await queryRunner.query(`
      CREATE TABLE "request_fields" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "request_type_id" uuid NOT NULL,
        "label" character varying(150) NOT NULL,
        "key" character varying(100) NOT NULL,
        "type" "public"."request_fields_type_enum" NOT NULL,
        "required" boolean NOT NULL DEFAULT false,
        "options" jsonb,
        "help_text" character varying(255),
        "order" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_request_fields" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_request_fields_request_type" ON "request_fields" ("request_type_id")`);
    await queryRunner.query(`ALTER TABLE "request_fields" ADD CONSTRAINT "FK_request_fields_request_type" FOREIGN KEY ("request_type_id") REFERENCES "request_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    // --- request_submissions -------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "request_submissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "request_type_id" uuid NOT NULL,
        "requester_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        "data" jsonb NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_request_submissions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_request_submissions_request_type" ON "request_submissions" ("request_type_id")`);
    await queryRunner.query(`ALTER TABLE "request_submissions" ADD CONSTRAINT "FK_request_submissions_request_type" FOREIGN KEY ("request_type_id") REFERENCES "request_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "request_submissions" ADD CONSTRAINT "FK_request_submissions_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "request_submissions" ADD CONSTRAINT "FK_request_submissions_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    // --- tickets: relax purchase_request_id, add the two new origin columns ---
    await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_9c315b3cfb6020ce11d3708f69a"`);
    await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "purchase_request_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_9c315b3cfb6020ce11d3708f69a" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "tickets" ADD "request_submission_id" uuid`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "UQ_tickets_request_submission" UNIQUE ("request_submission_id")`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_request_submission" FOREIGN KEY ("request_submission_id") REFERENCES "request_submissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "tickets" ADD "request_type_id" uuid`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_request_type" FOREIGN KEY ("request_type_id") REFERENCES "request_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    // --- attachments: tag anexos vindos de campo FILE do formulário dinâmico ---
    await queryRunner.query(`ALTER TABLE "attachments" ADD "source_field_key" character varying(100)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "attachments" DROP COLUMN "source_field_key"`);

    await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_request_type"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "request_type_id"`);

    await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_request_submission"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "UQ_tickets_request_submission"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "request_submission_id"`);

    await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_9c315b3cfb6020ce11d3708f69a"`);
    await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "purchase_request_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_9c315b3cfb6020ce11d3708f69a" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "request_submissions" DROP CONSTRAINT "FK_request_submissions_department"`);
    await queryRunner.query(`ALTER TABLE "request_submissions" DROP CONSTRAINT "FK_request_submissions_requester"`);
    await queryRunner.query(`ALTER TABLE "request_submissions" DROP CONSTRAINT "FK_request_submissions_request_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_request_submissions_request_type"`);
    await queryRunner.query(`DROP TABLE "request_submissions"`);

    await queryRunner.query(`ALTER TABLE "request_fields" DROP CONSTRAINT "FK_request_fields_request_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_request_fields_request_type"`);
    await queryRunner.query(`DROP TABLE "request_fields"`);
    await queryRunner.query(`DROP TYPE "public"."request_fields_type_enum"`);

    await queryRunner.query(`ALTER TABLE "request_types" DROP CONSTRAINT "FK_request_types_department"`);
    await queryRunner.query(`DROP TABLE "request_types"`);
    await queryRunner.query(`DROP TYPE "public"."request_types_source_kind_enum"`);

    await queryRunner.query(`CREATE TYPE "public"."permissions_key_enum_old" AS ENUM('CREATE_PURCHASE_REQUEST', 'EDIT_PURCHASE_REQUEST', 'CANCEL_PURCHASE_REQUEST', 'VIEW_PURCHASE_REQUEST', 'APPROVE_PURCHASE_REQUEST', 'MOVE_TICKET', 'RESOLVE_TICKET', 'CANCEL_TICKET', 'DELETE_TICKET', 'COMMENT_TICKET', 'ATTACH_FILES', 'VIEW_TICKET', 'VIEW_ARCHIVED_TICKETS', 'EXPORT_INVOICES', 'CREATE_TAG', 'VIEW_DEVICE', 'CREATE_DEVICE', 'EDIT_DEVICE', 'DELETE_DEVICE', 'REGISTER_DEVICE_MAINTENANCE', 'MANAGE_USERS', 'MANAGE_DEPARTMENTS', 'MANAGE_SETTINGS', 'SYSTEM_ADMIN')`);
    await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "key" TYPE "public"."permissions_key_enum_old" USING "key"::"text"::"public"."permissions_key_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."permissions_key_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."permissions_key_enum_old" RENAME TO "permissions_key_enum"`);
  }
}
