import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Ticket } from "./Ticket";
import { User } from "./User";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ticket_id" })
  ticket!: Ticket;

  @Index()
  @Column({ name: "ticket_id", type: "uuid" })
  ticketId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "author_id" })
  author!: User;

  @Column({ name: "author_id", type: "uuid" })
  authorId!: string;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
