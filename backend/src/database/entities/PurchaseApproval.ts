import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { PurchaseRequest } from "./PurchaseRequest";
import { User } from "./User";
import { Department } from "./Department";

export enum ApprovalDecision {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

@Entity("purchase_approvals")
export class PurchaseApproval {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => PurchaseRequest, (purchaseRequest) => purchaseRequest.approvals, { onDelete: "CASCADE" })
  @JoinColumn({ name: "purchase_request_id" })
  purchaseRequest!: PurchaseRequest;

  @Column({ name: "purchase_request_id", type: "uuid" })
  purchaseRequestId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "approver_id" })
  approver!: User;

  @Column({ name: "approver_id", type: "uuid" })
  approverId!: string;

  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: "approver_department_id" })
  approverDepartment!: Department;

  @Column({ name: "approver_department_id", type: "uuid" })
  approverDepartmentId!: string;

  @Column({ type: "enum", enum: ApprovalDecision })
  decision!: ApprovalDecision;

  @Column({ type: "text", nullable: true })
  reason?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
