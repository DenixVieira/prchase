import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("settings")
export class Setting {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  key!: string;

  @Column({ type: "jsonb" })
  value!: Record<string, unknown>;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
