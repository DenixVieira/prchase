import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable,
} from "typeorm";
import { User } from "./User";
import { DepartmentPermission } from "./DepartmentPermission";
import { Organization } from "./Organization";
import { DepartmentGroup } from "./DepartmentGroup";

@Entity("departments")
export class Department {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150, unique: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "responsible_user_id" })
  responsible?: User | null;

  @Column({ name: "responsible_user_id", type: "uuid", nullable: true })
  responsibleUserId?: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => User, (user) => user.department)
  users!: User[];

  @OneToMany(() => DepartmentPermission, (dp) => dp.department, { cascade: true })
  permissions!: DepartmentPermission[];

  /**
   * Organização "padrão" do departamento: toda solicitação de compra criada
   * por um usuário deste departamento sugere essa organização por padrão
   * (mas o usuário escolhe manualmente entre as organizações acessíveis).
   */
  @ManyToOne(() => Organization, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "home_organization_id" })
  homeOrganization?: Organization | null;

  @Column({ name: "home_organization_id", type: "uuid", nullable: true })
  homeOrganizationId?: string | null;

  /**
   * Quando true, este departamento pode visualizar e interagir com
   * solicitações de compra e tickets de QUALQUER organização, ignorando a
   * lista de organizações permitidas abaixo.
   */
  @Column({ default: false })
  hasFullOrganizationAccess!: boolean;

  /**
   * Organizações adicionais (além da homeOrganization) que este departamento
   * pode visualizar/interagir, quando hasFullOrganizationAccess for false.
   */
  @ManyToMany(() => Organization, { cascade: true })
  @JoinTable({
    name: "department_organization_access",
    joinColumn: { name: "department_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "organization_id", referencedColumnName: "id" },
  })
  allowedOrganizations!: Organization[];

  /**
   * Agrupamento organizacional livre (ex.: reunir os departamentos de uma
   * mesma filial sob um rótulo comum) — puramente de exibição, sem efeito
   * em permissões ou acesso a organizações.
   */
  @ManyToOne(() => DepartmentGroup, (group) => group.departments, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "department_group_id" })
  group?: DepartmentGroup | null;

  @Column({ name: "department_group_id", type: "uuid", nullable: true })
  departmentGroupId?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt?: Date | null;
}
