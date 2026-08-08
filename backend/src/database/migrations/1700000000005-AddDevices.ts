import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDevices1700000000005 implements MigrationInterface {
    name = 'AddDevices1700000000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "device_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_id" uuid NOT NULL, "originalName" character varying(255) NOT NULL, "physicalName" character varying(255) NOT NULL, "path" text NOT NULL, "mimeType" character varying(120) NOT NULL, "size" bigint NOT NULL, "uploaded_by_id" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_77dc9df4f1e17ac0cc6a19eac85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a2e0c65ee17b1b2654f2561f23" ON "device_attachments" ("device_id") `);
        await queryRunner.query(`CREATE TABLE "device_maintenances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_id" uuid NOT NULL, "sent_date" date NOT NULL, "return_date" date, "reason" text NOT NULL, "registered_by_id" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8150606d7d6f6a27ce393aae333" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_05cf96725974eb512c1edbb925" ON "device_maintenances" ("device_id") `);
        await queryRunner.query(`CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150), "serial_number" character varying(120) NOT NULL, "mac" character varying(40), "model" character varying(120) NOT NULL, "brand" character varying(120) NOT NULL, "purchase_date" date NOT NULL, "warranty_expiration" date NOT NULL, "organization_id" uuid NOT NULL, "department_id" uuid NOT NULL, "assigned_to_name" character varying(150), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cc9e89897e336172fd06367735" ON "devices" ("serial_number") `);
        await queryRunner.query(`CREATE INDEX "IDX_21dd4938e7012093f2b9db67f1" ON "devices" ("mac") `);
        await queryRunner.query(`CREATE INDEX "IDX_3f8418d0a8ce1e08098d37c9b6" ON "devices" ("organization_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1a6a6ab446e4d5007e187da53" ON "devices" ("department_id") `);
        await queryRunner.query(`ALTER TYPE "public"."permissions_key_enum" RENAME TO "permissions_key_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_key_enum" AS ENUM('CREATE_PURCHASE_REQUEST', 'EDIT_PURCHASE_REQUEST', 'CANCEL_PURCHASE_REQUEST', 'VIEW_PURCHASE_REQUEST', 'APPROVE_PURCHASE_REQUEST', 'MOVE_TICKET', 'RESOLVE_TICKET', 'CANCEL_TICKET', 'DELETE_TICKET', 'COMMENT_TICKET', 'ATTACH_FILES', 'VIEW_TICKET', 'VIEW_ARCHIVED_TICKETS', 'EXPORT_INVOICES', 'CREATE_TAG', 'VIEW_DEVICE', 'CREATE_DEVICE', 'EDIT_DEVICE', 'DELETE_DEVICE', 'REGISTER_DEVICE_MAINTENANCE', 'MANAGE_USERS', 'MANAGE_DEPARTMENTS', 'MANAGE_SETTINGS', 'SYSTEM_ADMIN')`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "key" TYPE "public"."permissions_key_enum" USING "key"::"text"::"public"."permissions_key_enum"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_key_enum_old"`);
        await queryRunner.query(`ALTER TABLE "device_attachments" ADD CONSTRAINT "FK_a2e0c65ee17b1b2654f2561f23e" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_attachments" ADD CONSTRAINT "FK_17fb3817d14497eeda533d10492" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_maintenances" ADD CONSTRAINT "FK_05cf96725974eb512c1edbb9250" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_maintenances" ADD CONSTRAINT "FK_2a113313cdddb27f25519f76081" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_3f8418d0a8ce1e08098d37c9b67" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_d1a6a6ab446e4d5007e187da53b" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_d1a6a6ab446e4d5007e187da53b"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_3f8418d0a8ce1e08098d37c9b67"`);
        await queryRunner.query(`ALTER TABLE "device_maintenances" DROP CONSTRAINT "FK_2a113313cdddb27f25519f76081"`);
        await queryRunner.query(`ALTER TABLE "device_maintenances" DROP CONSTRAINT "FK_05cf96725974eb512c1edbb9250"`);
        await queryRunner.query(`ALTER TABLE "device_attachments" DROP CONSTRAINT "FK_17fb3817d14497eeda533d10492"`);
        await queryRunner.query(`ALTER TABLE "device_attachments" DROP CONSTRAINT "FK_a2e0c65ee17b1b2654f2561f23e"`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_key_enum_old" AS ENUM('CREATE_PURCHASE_REQUEST', 'EDIT_PURCHASE_REQUEST', 'CANCEL_PURCHASE_REQUEST', 'VIEW_PURCHASE_REQUEST', 'APPROVE_PURCHASE_REQUEST', 'MOVE_TICKET', 'RESOLVE_TICKET', 'CANCEL_TICKET', 'DELETE_TICKET', 'COMMENT_TICKET', 'ATTACH_FILES', 'VIEW_TICKET', 'VIEW_ARCHIVED_TICKETS', 'EXPORT_INVOICES', 'CREATE_TAG', 'MANAGE_USERS', 'MANAGE_DEPARTMENTS', 'MANAGE_SETTINGS', 'SYSTEM_ADMIN')`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "key" TYPE "public"."permissions_key_enum_old" USING "key"::"text"::"public"."permissions_key_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_key_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."permissions_key_enum_old" RENAME TO "permissions_key_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1a6a6ab446e4d5007e187da53"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f8418d0a8ce1e08098d37c9b6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21dd4938e7012093f2b9db67f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cc9e89897e336172fd06367735"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_05cf96725974eb512c1edbb925"`);
        await queryRunner.query(`DROP TABLE "device_maintenances"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2e0c65ee17b1b2654f2561f23"`);
        await queryRunner.query(`DROP TABLE "device_attachments"`);
    }

}
