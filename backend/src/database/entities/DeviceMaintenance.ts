import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Device } from "./Device";
import { User } from "./User";

/** Registro de envio do equipamento para manutenção — histórico imutável, sem edição/exclusão pela interface. */
@Entity("device_maintenances")
export class DeviceMaintenance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Device, (device) => device.maintenances, { onDelete: "CASCADE" })
  @JoinColumn({ name: "device_id" })
  device!: Device;

  @Index()
  @Column({ name: "device_id", type: "uuid" })
  deviceId!: string;

  @Column({ name: "sent_date", type: "date" })
  sentDate!: string;

  /** Data de retorno — pode ficar em aberto enquanto o equipamento ainda está em manutenção. */
  @Column({ name: "return_date", type: "date", nullable: true })
  returnDate?: string | null;

  @Column({ type: "text" })
  reason!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "registered_by_id" })
  registeredBy!: User;

  @Column({ name: "registered_by_id", type: "uuid" })
  registeredById!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
