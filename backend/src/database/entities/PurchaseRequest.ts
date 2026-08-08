import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from "typeorm";
import { User } from "./User";
import { Department } from "./Department";
import { Organization } from "./Organization";
import { PurchaseApproval } from "./PurchaseApproval";
import { Attachment } from "./Attachment";
import { PurchaseRequestStatus, Priority } from "./enums";

@Entity("purchase_requests")
export class PurchaseRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 20 })
  number!: string;

  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Column({ name: "department_id", type: "uuid" })
  departmentId!: string;

  /**
   * Organização à qual esta solicitação pertence — escolhida pelo usuário
   * no momento da criação, dentre as organizações que seu departamento pode
   * acessar.
   */
  @ManyToOne(() => Organization, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "organization_id" })
  organization?: Organization | null;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId?: string | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "requester_id" })
  requester!: User;

  @Column({ name: "requester_id", type: "uuid" })
  requesterId!: string;

  @Column({ type: "varchar", length: 100 })
  costCenter!: string;

  @Column({ type: "varchar", length: 150 })
  supplier!: string;

  @Column({ type: "varchar", length: 100 })
  category!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text" })
  justification!: string;

  @Column({ type: "decimal", precision: 14, scale: 2 })
  estimatedValue!: string;

  @Column({ type: "enum", enum: Priority, default: Priority.MEDIUM })
  priority!: Priority;

  @Column({ type: "text", nullable: true })
  observations?: string | null;

  @Column({ type: "enum", enum: PurchaseRequestStatus, default: PurchaseRequestStatus.DRAFT })
  status!: PurchaseRequestStatus;

  /**
   * Data em que a solicitação foi aprovada — define a "competência" (mês
   * contábil) em que a compra é reconhecida no dashboard, independentemente
   * de quando a solicitação foi originalmente criada.
   */
  @Column({ name: "approved_at", type: "timestamptz", nullable: true })
  approvedAt?: Date | null;

  @OneToMany(() => PurchaseApproval, (approval) => approval.purchaseRequest)
  approvals!: PurchaseApproval[];

  @OneToMany(() => Attachment, (attachment) => attachment.purchaseRequest)
  attachments!: Attachment[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt?: Date | null;
}
