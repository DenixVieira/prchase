import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from "typeorm";
import { Ticket } from "./Ticket";
import { User } from "./User";

@Entity("followers")
@Unique(["ticketId", "userId"])
export class Follower {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.followers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ticket_id" })
  ticket!: Ticket;

  @Column({ name: "ticket_id", type: "uuid" })
  ticketId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
