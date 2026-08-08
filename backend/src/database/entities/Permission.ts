import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { PermissionKey } from "./enums";

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: PermissionKey, unique: true })
  key!: PermissionKey;

  @Column({ type: "varchar", length: 255 })
  description!: string;
}
