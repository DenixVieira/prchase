import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToOne, OneToMany, ManyToMany, JoinColumn, JoinTable, Index,
} from "typeorm";
import { User } from "./User";
import { Department } from "./Department";
import { Organization } from "./Organization";
import { PurchaseRequest } from "./PurchaseRequest";
import { RequestType } from "./RequestType";
import { RequestSubmission } from "./RequestSubmission";
import { Comment } from "./Comment";
import { Attachment } from "./Attachment";
import { Follower } from "./Follower";
import { Tag } from "./Tag";
import { TicketStatus, Priority } from "./enums";

@Entity("tickets")
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 20 })
  protocol!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  /**
   * Ticket nasce de exatamente UMA das duas origens: PurchaseRequest (fluxo
   * de Compra, com aprovação) ou RequestSubmission (demais tipos, sem
   * aprovação) — nunca as duas, nunca nenhuma. Essa invariante é garantida em
   * código nos dois pontos de criação de Ticket, não por CHECK constraint.
   */
  @OneToOne(() => PurchaseRequest, { nullable: true })
  @JoinColumn({ name: "purchase_request_id" })
  purchaseRequest?: PurchaseRequest | null;

  @Column({ name: "purchase_request_id", type: "uuid", nullable: true })
  purchaseRequestId?: string | null;

  @OneToOne(() => RequestSubmission, { nullable: true })
  @JoinColumn({ name: "request_submission_id" })
  requestSubmission?: RequestSubmission | null;

  @Column({ name: "request_submission_id", type: "uuid", nullable: true })
  requestSubmissionId?: string | null;

  /**
   * Preenchido só para tickets nascidos de RequestSubmission — fica NULL para
   * todo ticket de Compra (que já se identifica por purchaseRequestId, não
   * precisa apontar pro registro semente de RequestType).
   */
  @ManyToOne(() => RequestType, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "request_type_id" })
  requestType?: RequestType | null;

  @Column({ name: "request_type_id", type: "uuid", nullable: true })
  requestTypeId?: string | null;

  @Index()
  @Column({ type: "enum", enum: TicketStatus, default: TicketStatus.PENDING })
  status!: TicketStatus;

  @Column({ type: "enum", enum: Priority, default: Priority.MEDIUM })
  priority!: Priority;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "assignee_id" })
  assignee?: User | null;

  @Column({ name: "assignee_id", type: "uuid", nullable: true })
  assigneeId?: string | null;

  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Index()
  @Column({ name: "department_id", type: "uuid" })
  departmentId!: string;

  /**
   * Organização à qual este ticket pertence — sempre herdada da solicitação
   * de compra que o originou, independentemente do departamento que executa.
   */
  @ManyToOne(() => Organization, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "organization_id" })
  organization?: Organization | null;

  @Index()
  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId?: string | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "requester_id" })
  requester!: User;

  @Column({ name: "requester_id", type: "uuid" })
  requesterId!: string;

  @OneToMany(() => Comment, (comment) => comment.ticket)
  comments!: Comment[];

  @OneToMany(() => Attachment, (attachment) => attachment.ticket)
  attachments!: Attachment[];

  @OneToMany(() => Follower, (follower) => follower.ticket)
  followers!: Follower[];

  /**
   * Etiquetas livres para categorizar o ticket. Não é eager de propósito —
   * junção com relação N:N em query paginada (list()) pode duplicar/cortar
   * linhas errado com LIMIT/OFFSET, então é carregada explicitamente só onde
   * é segura (detalhe do ticket, board do Kanban sem paginação).
   */
  @ManyToMany(() => Tag, { cascade: true })
  @JoinTable({
    name: "ticket_tags",
    joinColumn: { name: "ticket_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags!: Tag[];

  @Index()
  @Column({ name: "is_archived", type: "boolean", default: false })
  isArchived!: boolean;

  @Column({ name: "archived_at", type: "timestamptz", nullable: true })
  archivedAt?: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date | null;
}
