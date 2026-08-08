import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvoiceDueDate1700000000004 implements MigrationInterface {
    name = 'AddInvoiceDueDate1700000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attachments" ADD "due_date" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attachments" DROP COLUMN "due_date"`);
    }

}
