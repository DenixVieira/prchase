import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDepartmentGroups1700000000006 implements MigrationInterface {
    name = 'AddDepartmentGroups1700000000006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "department_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "organization_id" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0d9eacdfd27d876f2b6254ff737" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9be501aba6d4a015832295fe49" ON "department_groups" ("name") `);
        await queryRunner.query(`ALTER TABLE "departments" ADD "department_group_id" uuid`);
        await queryRunner.query(`ALTER TABLE "department_groups" ADD CONSTRAINT "FK_a9bf5332495bddc06b6a5935451" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_c0b5861ba3ed6044c1ae5d13cf5" FOREIGN KEY ("department_group_id") REFERENCES "department_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "FK_c0b5861ba3ed6044c1ae5d13cf5"`);
        await queryRunner.query(`ALTER TABLE "department_groups" DROP CONSTRAINT "FK_a9bf5332495bddc06b6a5935451"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP COLUMN "department_group_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9be501aba6d4a015832295fe49"`);
        await queryRunner.query(`DROP TABLE "department_groups"`);
    }

}
