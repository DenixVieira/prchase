import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Ticket } from "./Ticket";
import { PurchaseRequest } from "./PurchaseRequest";
import { User } from "./User";

@Entity("attachments")
export class Attachment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.attachments, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "ticket_id" })
  ticket?: Ticket | null;

  @Index()
  @Column({ name: "ticket_id", type: "uuid", nullable: true })
  ticketId?: string | null;

  @ManyToOne(() => PurchaseRequest, (purchaseRequest) => purchaseRequest.attachments, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "purchase_request_id" })
  purchaseRequest?: PurchaseRequest | null;

  @Column({ name: "purchase_request_id", type: "uuid", nullable: true })
  purchaseRequestId?: string | null;

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

  /**
   * Nota fiscal anexada a um ticket: nomeada por categoria/valor da solicitação
   * e salva em diretório próprio por organização/data. Uma vez enviada, não há
   * endpoint de exclusão ou substituição — é imutável por design.
   */
  @Column({ name: "is_invoice_note", type: "boolean", default: false })
  isInvoiceNote!: boolean;

  /** Data de vencimento da nota fiscal — só preenchida para anexos de nota (isInvoiceNote). */
  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate?: string | null;

  /**
   * Quando o anexo veio de um campo FILE do formulário dinâmico (RequestField),
   * guarda a key desse campo — permite ao RequestFieldsCard casar cada anexo
   * com o campo de origem quando há mais de um campo de arquivo no formulário.
   * Nulo para anexos adicionados manualmente pelo AttachmentsCard/InvoiceNoteCard.
   */
  @Column({ name: "source_field_key", type: "varchar", length: 100, nullable: true })
  sourceFieldKey?: string | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "uploaded_by_id" })
  uploadedBy!: User;

  @Column({ name: "uploaded_by_id", type: "uuid" })
  uploadedById!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
