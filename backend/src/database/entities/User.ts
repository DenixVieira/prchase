import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, ManyToOne, JoinColumn, Index,
} from "typeorm";
import { Department } from "./Department";
import { NotificationPreference, NotificationType } from "./enums";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 100 })
  login!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 150 })
  email!: string;

  @Column({ type: "varchar", length: 255, select: false })
  passwordHash!: string;

  // eager: o departamento do usuário é exibido como tag discreta ao lado do
  // nome em vários lugares (solicitações, comentários, responsável por
  // ticket) — carregar sempre junto evita ter que lembrar de dar join manual
  // em cada consulta que carrega um User através de uma relação eager/find.
  @ManyToOne(() => Department, (department) => department.users, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "department_id" })
  department?: Department | null;

  @Column({ name: "department_id", type: "uuid", nullable: true })
  departmentId?: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isAdmin!: boolean;

  @Column({ type: "enum", enum: NotificationPreference, default: NotificationPreference.BOTH })
  notificationPreference!: NotificationPreference;

  /**
   * Tipos de notificação que o usuário optou por NÃO receber (nem em tempo real, nem por e-mail).
   * Lista vazia = recebe todos os tipos de evento.
   */
  @Column({ type: "text", array: true, default: () => "'{}'" })
  mutedNotificationTypes!: NotificationType[];

  /**
   * Foto de perfil, como data URL (ex.: "data:image/jpeg;base64,..."). O
   * front já envia redimensionada/comprimida (pequena, ver changeAvatar no
   * auth.service.ts, que também valida tamanho no servidor) — por isso dá
   * pra guardar direto na coluna em vez de arquivo em disco.
   */
  @Column({ name: "avatar_data_url", type: "text", nullable: true })
  avatarDataUrl?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  lastLoginAt?: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt?: Date | null;
}
