import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from "typeorm";

/**
 * Uma Organização representa uma unidade/site/filial à qual solicitações de
 * compra e tickets pertencem. Departamentos podem ter acesso irrestrito
 * (a todas as organizações) ou restrito (somente às organizações
 * explicitamente permitidas) — ver Department.hasFullOrganizationAccess /
 * allowedOrganizations.
 */
@Entity("organizations")
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150, unique: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt?: Date | null;
}
