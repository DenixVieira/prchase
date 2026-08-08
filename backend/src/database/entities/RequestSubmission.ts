import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index,
} from "typeorm";
import { RequestType } from "./RequestType";
import { Department } from "./Department";
import { Organization } from "./Organization";
import { User } from "./User";

/**
 * Instância de uma solicitação genérica (não-Compra) enviada por um usuário.
 * Nasce sempre acompanhada de exatamente um Ticket, criados juntos na mesma
 * transação (ver RequestSubmissionsService) — não tem workflow de aprovação
 * nem número/protocolo próprio: o protocolo TK do Ticket já é o identificador
 * público único de ambos.
 */
@Entity("request_submissions")
export class RequestSubmission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => RequestType, { eager: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "request_type_id" })
  requestType!: RequestType;

  @Index()
  @Column({ name: "request_type_id", type: "uuid" })
  requestTypeId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "requester_id" })
  requester!: User;

  @Column({ name: "requester_id", type: "uuid" })
  requesterId!: string;

  /**
   * Departamento responsável, copiado de requestType.departmentId no momento
   * do envio (congelado, mesmo padrão de PurchaseRequest.departmentId).
   */
  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Column({ name: "department_id", type: "uuid" })
  departmentId!: string;

  /**
   * Organização à qual esta solicitação pertence — escolhida pelo usuário no
   * momento do envio, dentre as organizações que seu departamento pode
   * acessar. Mesmo padrão de PurchaseRequest.organizationId.
   */
  @ManyToOne(() => Organization, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "organization_id" })
  organization?: Organization | null;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId?: string | null;

  /** Valores dos campos, chaveados por RequestField.key. Campos FILE guardam o id do Attachment. */
  @Column({ type: "jsonb" })
  data!: Record<string, unknown>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
