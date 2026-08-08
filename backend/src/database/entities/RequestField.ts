import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from "typeorm";
import { RequestType } from "./RequestType";
import { RequestFieldType } from "./enums";

export interface RequestFieldOption {
  label: string;
  value: string;
}

/** Definição de um campo do formulário dinâmico de um RequestType. */
@Entity("request_fields")
export class RequestField {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => RequestType, (requestType) => requestType.fields, { onDelete: "CASCADE" })
  @JoinColumn({ name: "request_type_id" })
  requestType!: RequestType;

  @Index()
  @Column({ name: "request_type_id", type: "uuid" })
  requestTypeId!: string;

  @Column({ type: "varchar", length: 150 })
  label!: string;

  /** Chave de máquina (slug da label), usada como chave no JSON de valores da submission. */
  @Column({ type: "varchar", length: 100 })
  key!: string;

  @Column({ type: "enum", enum: RequestFieldType })
  type!: RequestFieldType;

  @Column({ type: "boolean", default: false })
  required!: boolean;

  /** Opções {label, value} — só usado por SELECT/MULTISELECT. */
  @Column({ type: "jsonb", nullable: true })
  options?: RequestFieldOption[] | null;

  @Column({ name: "help_text", type: "varchar", length: 255, nullable: true })
  helpText?: string | null;

  @Column({ type: "int", default: 0 })
  order!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
