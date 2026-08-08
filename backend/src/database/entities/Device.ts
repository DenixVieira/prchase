import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index,
} from "typeorm";
import { Organization } from "./Organization";
import { Department } from "./Department";
import { DeviceAttachment } from "./DeviceAttachment";
import { DeviceMaintenance } from "./DeviceMaintenance";

@Entity("devices")
export class Device {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Apelido/identificador amigável do equipamento, usado na busca (ex.: "Notebook Financeiro 01"). */
  @Column({ type: "varchar", length: 150, nullable: true })
  name?: string | null;

  @Index()
  @Column({ name: "serial_number", type: "varchar", length: 120 })
  serialNumber!: string;

  @Index()
  @Column({ type: "varchar", length: 40, nullable: true })
  mac?: string | null;

  @Column({ type: "varchar", length: 120 })
  model!: string;

  @Column({ type: "varchar", length: 120 })
  brand!: string;

  @Column({ name: "purchase_date", type: "date" })
  purchaseDate!: string;

  @Column({ name: "warranty_expiration", type: "date" })
  warrantyExpiration!: string;

  @ManyToOne(() => Organization, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "organization_id" })
  organization!: Organization;

  @Index()
  @Column({ name: "organization_id", type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => Department, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Index()
  @Column({ name: "department_id", type: "uuid" })
  departmentId!: string;

  /**
   * Funcionário que está usando o equipamento — texto livre (não é um User
   * do sistema), pois o equipamento pode ser de uso coletivo e portanto
   * ficar sem ninguém atribuído.
   */
  @Column({ name: "assigned_to_name", type: "varchar", length: 150, nullable: true })
  assignedToName?: string | null;

  @OneToMany(() => DeviceAttachment, (attachment) => attachment.device)
  attachments!: DeviceAttachment[];

  @OneToMany(() => DeviceMaintenance, (maintenance) => maintenance.device)
  maintenances!: DeviceMaintenance[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt?: Date | null;
}
