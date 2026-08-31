import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, OneToMany, JoinColumn, Index,
} from "typeorm";
import { Department } from "./Department";
import { BoardColumn } from "./BoardColumn";

/**
 * Board do Kanban de um departamento — 1:1 com Department (todo departamento
 * tem exatamente um, provisionado automaticamente na criação; ver
 * BoardsService.createDefaultColumns). Não é um Trello onde qualquer um cria
 * quantos boards quiser: é "o board do departamento X".
 */
@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => Department, { onDelete: "CASCADE" })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Index({ unique: true })
  @Column({ name: "department_id", type: "uuid" })
  departmentId!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @OneToMany(() => BoardColumn, (column) => column.board)
  columns!: BoardColumn[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
