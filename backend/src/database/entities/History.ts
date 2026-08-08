import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { User } from "./User";
import { HistoryAction } from "./enums";

@Entity("history")
export class History {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "ticket_id", type: "uuid", nullable: true })
  ticketId?: string | null;

  @Index()
  @Column({ name: "purchase_request_id", type: "uuid", nullable: true })
  purchaseRequestId?: string | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: HistoryAction })
  action!: HistoryAction;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
