import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { User } from "./User";
import { NotificationType } from "./enums";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: NotificationType })
  type!: NotificationType;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  link?: string | null;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ name: "related_ticket_id", type: "uuid", nullable: true })
  relatedTicketId?: string | null;

  @Column({ name: "related_purchase_request_id", type: "uuid", nullable: true })
  relatedPurchaseRequestId?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
