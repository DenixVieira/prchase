import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ type: "varchar", length: 7, default: "#6366f1" })
  color!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
