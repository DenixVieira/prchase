import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, ManyToOne, ManyToMany, OneToMany, JoinColumn, JoinTable, Index,
} from "typeorm";
import { Department } from "./Department";
import { Organization } from "./Organization";
import { RequestField } from "./RequestField";
import { RequestTypeSourceKind } from "./enums";

/**
 * Tipo de solicitação cadastrado pelo administrador (ex.: "Ordem de Serviço -
 * T.I.", "Solicitação de Férias"). Cada um pertence a um departamento
 * responsável e define seu próprio formulário via RequestField — ao ser
 * enviado, vira Ticket direto no Kanban desse departamento (sem aprovação).
 *
 * O registro com isBuiltIn=true (sourceKind=PURCHASE_REQUEST) é a exceção:
 * representa a Solicitação de Compra só pra ela aparecer como card em "Nova
 * Solicitação" — nunca é usado pra renderizar formulário nem gerar Ticket
 * por aqui, a Compra continua 100% no fluxo/tabela próprios de sempre.
 */
@Entity("request_types")
export class RequestType {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  /**
   * Departamento responsável — todo Ticket nascido de uma solicitação deste
   * tipo cai no Kanban dele. Só é nulo no registro semente de Compra (que não
   * tem "um" departamento responsável fixo); obrigatório em qualquer tipo
   * criado pelo administrador (validado no DTO, não aqui).
   */
  @ManyToOne(() => Department, { eager: true, nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "department_id" })
  department?: Department | null;

  @Column({ name: "department_id", type: "uuid", nullable: true })
  departmentId?: string | null;

  /** Nome de ícone lucide-react exibido no card (ex.: "Wrench"). Opcional. */
  @Column({ type: "varchar", length: 60, nullable: true })
  icon?: string | null;

  @Column({ name: "source_kind", type: "enum", enum: RequestTypeSourceKind, default: RequestTypeSourceKind.DYNAMIC })
  sourceKind!: RequestTypeSourceKind;

  @Column({ name: "is_built_in", type: "boolean", default: false })
  isBuiltIn!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  /**
   * "Autosolicitação": tipo pensado pra alguém do PRÓPRIO departamento
   * responsável pedir algo pra si (ex.: TI pedindo abono de ponto ao gestor
   * de TI) — não um serviço oferecido a outros departamentos. Quando true,
   * some do "Nova Solicitação" e é rejeitado no envio pra qualquer usuário
   * fora de `departmentId`, e a restrição manual de `visibleDepartments`
   * deixa de valer (não faz sentido as duas ao mesmo tempo — ver
   * request-types.service.ts#isVisibleTo).
   */
  @Column({ name: "is_self_request_only", type: "boolean", default: false })
  isSelfRequestOnly!: boolean;

  /**
   * Organizações para as quais este tipo está disponível — só aparece em
   * "Nova Solicitação" e só pode ser enviado por usuário de departamento com
   * acesso a pelo menos uma delas. Lista vazia = tipo fica oculto/indisponível
   * até o admin marcar ao menos uma (escolha deliberada: nada aparece "por
   * padrão" sem configuração explícita). Não vale para o card semente de
   * Compra (isBuiltIn), que ignora esta lista e é sempre visível.
   */
  @ManyToMany(() => Organization)
  @JoinTable({
    name: "request_type_organizations",
    joinColumn: { name: "request_type_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "organization_id", referencedColumnName: "id" },
  })
  organizations!: Organization[];

  /**
   * Restrição adicional e OPCIONAL, por cima da restrição por organização
   * acima: se preenchida, só os departamentos aqui marcados enxergam o tipo
   * (mesmo que outros departamentos tenham acesso às mesmas organizações).
   * Vazia = sem restrição extra, vale só a regra de organização (é o
   * comportamento de todo tipo criado antes desta coluna existir). Também
   * ignorada pelo card semente de Compra.
   */
  @ManyToMany(() => Department)
  @JoinTable({
    name: "request_type_departments",
    joinColumn: { name: "request_type_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "department_id", referencedColumnName: "id" },
  })
  visibleDepartments!: Department[];

  @OneToMany(() => RequestField, (field) => field.requestType)
  fields!: RequestField[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date | null;
}
