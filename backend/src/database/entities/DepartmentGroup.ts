import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Department } from "./Department";
import { Organization } from "./Organization";

/**
 * Agrupamento livre de departamentos — usado, por exemplo, para reunir sob um
 * mesmo rótulo os departamentos de uma mesma filial (ex.: "Filial São Paulo"
 * agrupando "Gerência São Paulo" e "Administração São Paulo"). Puramente
 * organizacional: não concede nem restringe permissões.
 *
 * A organização é opcional e serve pra dar contexto ao grupo (ex.: vincular
 * "Filial São Paulo" à organização "Filial São Paulo" já cadastrada) — não
 * é usada para checagem de acesso, só de exibição/agrupamento na tela.
 */
@Entity("department_groups")
export class DepartmentGroup {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 150 })
  name!: string;

  @ManyToOne(() => Organization, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "organization_id" })
  organization?: Organization | null;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId?: string | null;

  @OneToMany(() => Department, (department) => department.group)
  departments!: Department[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
