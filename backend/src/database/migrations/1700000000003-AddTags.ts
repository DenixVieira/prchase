import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTags1700000000003 implements MigrationInterface {
    name = 'AddTags1700000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(60) NOT NULL, "color" character varying(7) NOT NULL DEFAULT '#6366f1', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d90243459a697eadb8ad56e909" ON "tags" ("name") `);
        await queryRunner.query(`CREATE TABLE "ticket_tags" ("ticket_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_61ad5ce131d1032cd26448d073e" PRIMARY KEY ("ticket_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e834a1960b1abc5822d5055b82" ON "ticket_tags" ("ticket_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f5cb86966f6eb9f24f011992d3" ON "ticket_tags" ("tag_id") `);
        await queryRunner.query(`ALTER TYPE "public"."permissions_key_enum" RENAME TO "permissions_key_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_key_enum" AS ENUM('CREATE_PURCHASE_REQUEST', 'EDIT_PURCHASE_REQUEST', 'CANCEL_PURCHASE_REQUEST', 'VIEW_PURCHASE_REQUEST', 'APPROVE_PURCHASE_REQUEST', 'MOVE_TICKET', 'RESOLVE_TICKET', 'CANCEL_TICKET', 'DELETE_TICKET', 'COMMENT_TICKET', 'ATTACH_FILES', 'VIEW_TICKET', 'VIEW_ARCHIVED_TICKETS', 'EXPORT_INVOICES', 'CREATE_TAG', 'MANAGE_USERS', 'MANAGE_DEPARTMENTS', 'MANAGE_SETTINGS', 'SYSTEM_ADMIN')`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "key" TYPE "public"."permissions_key_enum" USING "key"::"text"::"public"."permissions_key_enum"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_key_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."history_action_enum" RENAME TO "history_action_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."history_action_enum" AS ENUM('CREATED', 'COMMENTED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'PRIORITY_CHANGED', 'STATUS_CHANGED', 'ASSIGNEE_CHANGED', 'CANCELLED', 'REOPENED', 'RESOLVED', 'APPROVED', 'REJECTED', 'FOLLOWER_ADDED', 'FOLLOWER_REMOVED', 'SUBMITTED_FOR_APPROVAL', 'ARCHIVED', 'UNARCHIVED', 'TAG_ADDED', 'TAG_REMOVED')`);
        await queryRunner.query(`ALTER TABLE "history" ALTER COLUMN "action" TYPE "public"."history_action_enum" USING "action"::"text"::"public"."history_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."history_action_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ticket_tags" ADD CONSTRAINT "FK_e834a1960b1abc5822d5055b82e" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ticket_tags" ADD CONSTRAINT "FK_f5cb86966f6eb9f24f011992d38" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_tags" DROP CONSTRAINT "FK_f5cb86966f6eb9f24f011992d38"`);
        await queryRunner.query(`ALTER TABLE "ticket_tags" DROP CONSTRAINT "FK_e834a1960b1abc5822d5055b82e"`);
        await queryRunner.query(`CREATE TYPE "public"."history_action_enum_old" AS ENUM('CREATED', 'COMMENTED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'PRIORITY_CHANGED', 'STATUS_CHANGED', 'ASSIGNEE_CHANGED', 'CANCELLED', 'REOPENED', 'RESOLVED', 'APPROVED', 'REJECTED', 'FOLLOWER_ADDED', 'FOLLOWER_REMOVED', 'SUBMITTED_FOR_APPROVAL', 'ARCHIVED', 'UNARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "history" ALTER COLUMN "action" TYPE "public"."history_action_enum_old" USING "action"::"text"::"public"."history_action_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."history_action_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."history_action_enum_old" RENAME TO "history_action_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_key_enum_old" AS ENUM('CREATE_PURCHASE_REQUEST', 'EDIT_PURCHASE_REQUEST', 'CANCEL_PURCHASE_REQUEST', 'VIEW_PURCHASE_REQUEST', 'APPROVE_PURCHASE_REQUEST', 'MOVE_TICKET', 'RESOLVE_TICKET', 'CANCEL_TICKET', 'DELETE_TICKET', 'COMMENT_TICKET', 'ATTACH_FILES', 'VIEW_TICKET', 'VIEW_ARCHIVED_TICKETS', 'EXPORT_INVOICES', 'MANAGE_USERS', 'MANAGE_DEPARTMENTS', 'MANAGE_SETTINGS', 'SYSTEM_ADMIN')`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "key" TYPE "public"."permissions_key_enum_old" USING "key"::"text"::"public"."permissions_key_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_key_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."permissions_key_enum_old" RENAME TO "permissions_key_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5cb86966f6eb9f24f011992d3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e834a1960b1abc5822d5055b82"`);
        await queryRunner.query(`DROP TABLE "ticket_tags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d90243459a697eadb8ad56e909"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
