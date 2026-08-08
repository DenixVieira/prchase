import { MigrationInterface, QueryRunner } from "typeorm";

/** Nova permissão VIEW_DASHBOARD — passa a controlar o acesso ao Dashboard (antes aberto a qualquer autenticado). */
export class AddViewDashboardPermission1700000000011 implements MigrationInterface {
  name = "AddViewDashboardPermission1700000000011";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."permissions_key_enum" RENAME TO "permissions_key_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."permissions_key_enum" AS ENUM('CREATE_PURCHASE_REQUEST', 'EDIT_PURCHASE_REQUEST', 'CANCEL_PURCHASE_REQUEST', 'VIEW_PURCHASE_REQUEST', 'APPROVE_PURCHASE_REQUEST', 'MOVE_TICKET', 'RESOLVE_TICKET', 'CANCEL_TICKET', 'DELETE_TICKET', 'COMMENT_TICKET', 'ATTACH_FILES', 'VIEW_TICKET', 'VIEW_ARCHIVED_TICKETS', 'EXPORT_INVOICES', 'CREATE_TAG', 'VIEW_DEVICE', 'CREATE_DEVICE', 'EDIT_DEVICE', 'DELETE_DEVICE', 'REGISTER_DEVICE_MAINTENANCE', 'MANAGE_USERS', 'MANAGE_DEPARTMENTS', 'MANAGE_SETTINGS', 'SYSTEM_ADMIN', 'MANAGE_REQUEST_TYPES', 'CREATE_REQUEST', 'VIEW_DASHBOARD')`);
    await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "key" TYPE "public"."permissions_key_enum" USING "key"::"text"::"public"."permissions_key_enum"`);
    await queryRunner.query(`DROP TYPE "public"."permissions_key_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."permissions_key_enum_old" AS ENUM('CREATE_PURCHASE_REQUEST', 'EDIT_PURCHASE_REQUEST', 'CANCEL_PURCHASE_REQUEST', 'VIEW_PURCHASE_REQUEST', 'APPROVE_PURCHASE_REQUEST', 'MOVE_TICKET', 'RESOLVE_TICKET', 'CANCEL_TICKET', 'DELETE_TICKET', 'COMMENT_TICKET', 'ATTACH_FILES', 'VIEW_TICKET', 'VIEW_ARCHIVED_TICKETS', 'EXPORT_INVOICES', 'CREATE_TAG', 'VIEW_DEVICE', 'CREATE_DEVICE', 'EDIT_DEVICE', 'DELETE_DEVICE', 'REGISTER_DEVICE_MAINTENANCE', 'MANAGE_USERS', 'MANAGE_DEPARTMENTS', 'MANAGE_SETTINGS', 'SYSTEM_ADMIN', 'MANAGE_REQUEST_TYPES', 'CREATE_REQUEST')`);
    await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "key" TYPE "public"."permissions_key_enum_old" USING "key"::"text"::"public"."permissions_key_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."permissions_key_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."permissions_key_enum_old" RENAME TO "permissions_key_enum"`);
  }
}
