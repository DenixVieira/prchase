import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { User } from "./User";
import { AuditAction } from "./enums";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user?: User | null;

  @Index()
  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId?: string | null;

  @Column({ type: "enum", enum: AuditAction })
  action!: AuditAction;

  @Column({ type: "varchar", length: 100 })
  entity!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  entityId?: string | null;

  @Column({ type: "varchar", length: 60, nullable: true })
  ipAddress?: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
