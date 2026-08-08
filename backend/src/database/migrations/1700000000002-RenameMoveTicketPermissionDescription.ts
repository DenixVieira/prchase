import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MOVE_TICKET libera bem mais que mover no Kanban — também atribuir
 * responsável, mudar prioridade, editar título/descrição, arquivar/
 * desarquivar e remover acompanhantes de outros usuários. A descrição
 * "Mover Ticket no Kanban" era enganosa; renomeada para "Alterações em Ticket".
 */
export class RenameMoveTicketPermissionDescription1700000000002 implements MigrationInterface {
  name = "RenameMoveTicketPermissionDescription1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "permissions" SET "description" = 'Alterações em Ticket' WHERE "key" = 'MOVE_TICKET'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "permissions" SET "description" = 'Mover Ticket no Kanban' WHERE "key" = 'MOVE_TICKET'`
    );
  }
}
