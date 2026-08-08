import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceIndexes1700000000001 implements MigrationInterface {
    name = 'AddPerformanceIndexes1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_be8180d9b44a05e449b85f5b77" ON "comments" ("ticket_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_fb1d03aa5fffa0e5ca41873a00" ON "tickets" ("department_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_613ef43a793c628ad7b22981f3" ON "tickets" ("organization_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd69ef1f6e3bda02b710ac17f4" ON "tickets" ("is_archived") `);
        await queryRunner.query(`CREATE INDEX "IDX_73d871f247ffebda5dc3f0df8a" ON "attachments" ("ticket_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_73d871f247ffebda5dc3f0df8a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd69ef1f6e3bda02b710ac17f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_613ef43a793c628ad7b22981f3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fb1d03aa5fffa0e5ca41873a00"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12b901b34113688b4786368510"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be8180d9b44a05e449b85f5b77"`);
    }

}
