import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Device } from "./Device";
import { User } from "./User";

@Entity("device_attachments")
export class DeviceAttachment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Device, (device) => device.attachments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "device_id" })
  device!: Device;

  @Index()
  @Column({ name: "device_id", type: "uuid" })
  deviceId!: string;

  @Column({ type: "varchar", length: 255 })
  originalName!: string;

  @Column({ type: "varchar", length: 255 })
  physicalName!: string;

  @Column({ type: "text" })
  path!: string;

  @Column({ type: "varchar", length: 120 })
  mimeType!: string;

  @Column({ type: "bigint" })
  size!: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "uploaded_by_id" })
  uploadedBy!: User;

  @Column({ name: "uploaded_by_id", type: "uuid" })
  uploadedById!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
