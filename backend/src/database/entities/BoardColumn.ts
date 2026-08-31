import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from "typeorm";
import { Board } from "./Board";

/**
 * Coluna de um Board — substitui o antigo enum fixo TicketStatus. Cada
 * departamento define as suas. As três flags abaixo permitem que o resto do
 * sistema (arquivar, Dashboard, notificação de reabertura) raciocine sobre
 * "isso é um estado terminal?" sem depender do nome/posição da coluna.
 */
@Entity("board_columns")
export class BoardColumn {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Board, (board) => board.columns, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Index()
  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ type: "varchar", length: 7, default: "#94a3b8" })
  color!: string;

  @Column({ type: "int", default: 0 })
  order!: number;

  /** Onde todo ticket novo nasce — exatamente 1 por board (validado no service, não no banco). */
  @Column({ name: "is_initial", type: "boolean", default: false })
  isInitial!: boolean;

  /** Equivalente a "Resolvido" — libera arquivar e conta como resolvido no Dashboard. */
  @Column({ name: "is_done", type: "boolean", default: false })
  isDone!: boolean;

  /** Equivalente a "Cancelado" — libera arquivar e conta como cancelado no Dashboard. */
  @Column({ name: "is_cancelled", type: "boolean", default: false })
  isCancelled!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
