import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Department } from "./Department";
import { Permission } from "./Permission";

@Entity("department_permissions")
@Unique(["departmentId", "permissionId"])
export class DepartmentPermission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Department, (department) => department.permissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Column({ name: "department_id", type: "uuid" })
  departmentId!: string;

  @ManyToOne(() => Permission, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "permission_id" })
  permission!: Permission;

  @Column({ name: "permission_id", type: "uuid" })
  permissionId!: string;

  @Column({ default: true })
  granted!: boolean;
}
