export enum PermissionKey {
  CREATE_PURCHASE_REQUEST = "CREATE_PURCHASE_REQUEST",
  EDIT_PURCHASE_REQUEST = "EDIT_PURCHASE_REQUEST",
  CANCEL_PURCHASE_REQUEST = "CANCEL_PURCHASE_REQUEST",
  VIEW_PURCHASE_REQUEST = "VIEW_PURCHASE_REQUEST",
  APPROVE_PURCHASE_REQUEST = "APPROVE_PURCHASE_REQUEST",
  MOVE_TICKET = "MOVE_TICKET",
  RESOLVE_TICKET = "RESOLVE_TICKET",
  CANCEL_TICKET = "CANCEL_TICKET",
  DELETE_TICKET = "DELETE_TICKET",
  COMMENT_TICKET = "COMMENT_TICKET",
  ATTACH_FILES = "ATTACH_FILES",
  VIEW_TICKET = "VIEW_TICKET",
  VIEW_ARCHIVED_TICKETS = "VIEW_ARCHIVED_TICKETS",
  EXPORT_INVOICES = "EXPORT_INVOICES",
  CREATE_TAG = "CREATE_TAG",
  VIEW_DEVICE = "VIEW_DEVICE",
  CREATE_DEVICE = "CREATE_DEVICE",
  EDIT_DEVICE = "EDIT_DEVICE",
  DELETE_DEVICE = "DELETE_DEVICE",
  REGISTER_DEVICE_MAINTENANCE = "REGISTER_DEVICE_MAINTENANCE",
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_DEPARTMENTS = "MANAGE_DEPARTMENTS",
  MANAGE_SETTINGS = "MANAGE_SETTINGS",
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  MANAGE_REQUEST_TYPES = "MANAGE_REQUEST_TYPES",
  CREATE_REQUEST = "CREATE_REQUEST",
  VIEW_DASHBOARD = "VIEW_DASHBOARD",
}

export enum RequestTypeSourceKind {
  DYNAMIC = "DYNAMIC",
  PURCHASE_REQUEST = "PURCHASE_REQUEST",
}

export enum RequestFieldType {
  TEXT = "TEXT",
  TEXTAREA = "TEXTAREA",
  NUMBER = "NUMBER",
  DATE = "DATE",
  DATETIME = "DATETIME",
  SELECT = "SELECT",
  MULTISELECT = "MULTISELECT",
  CHECKBOX = "CHECKBOX",
  FILE = "FILE",
}

export enum PurchaseRequestStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum NotificationPreference {
  EMAIL_ONLY = "EMAIL_ONLY",
  INTERNAL_ONLY = "INTERNAL_ONLY",
  BOTH = "BOTH",
}

export enum NotificationType {
  NEW_TICKET = "NEW_TICKET",
  NEW_COMMENT = "NEW_COMMENT",
  NEW_ATTACHMENT = "NEW_ATTACHMENT",
  NEW_INVOICE_NOTE = "NEW_INVOICE_NOTE",
  TICKET_MOVED = "TICKET_MOVED",
  TICKET_RESOLVED = "TICKET_RESOLVED",
  TICKET_CANCELLED = "TICKET_CANCELLED",
  TICKET_REOPENED = "TICKET_REOPENED",
  NEW_FOLLOWER = "NEW_FOLLOWER",
  MENTIONED_IN_COMMENT = "MENTIONED_IN_COMMENT",
  REQUEST_APPROVED = "REQUEST_APPROVED",
  REQUEST_REJECTED = "REQUEST_REJECTED",
  REQUEST_PENDING_APPROVAL = "REQUEST_PENDING_APPROVAL",
}

export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentGroup {
  id: string;
  name: string;
  organization?: Organization | null;
  organizationId?: string | null;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  responsible?: User | null;
  responsibleUserId?: string | null;
  isActive: boolean;
  permissions?: { permission: { key: PermissionKey; description: string } }[];
  homeOrganization?: Organization | null;
  homeOrganizationId?: string | null;
  hasFullOrganizationAccess?: boolean;
  allowedOrganizations?: Organization[];
  group?: DepartmentGroup | null;
  departmentGroupId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  login: string;
  email: string;
  department?: Department | null;
  departmentId?: string | null;
  isActive: boolean;
  isAdmin: boolean;
  /** Foto de perfil como data URL (ex.: "data:image/jpeg;base64,..."), já pequena/comprimida. null = sem foto. */
  avatarDataUrl?: string | null;
  notificationPreference: NotificationPreference;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  login: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  avatarDataUrl?: string | null;
  notificationPreference: NotificationPreference;
  mutedNotificationTypes: NotificationType[];
  department: {
    id: string;
    name: string;
    permissions: PermissionKey[];
    homeOrganization: { id: string; name: string } | null;
    hasFullOrganizationAccess: boolean;
    allowedOrganizations: { id: string; name: string }[];
  } | null;
  lastLoginAt?: string | null;
}

export interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: User;
  isInvoiceNote: boolean;
  dueDate?: string | null;
  sourceFieldKey?: string | null;
  ticket?: { id: string; protocol: string; title: string };
  createdAt: string;
}

export interface PurchaseRequest {
  id: string;
  number: string;
  department: Department;
  departmentId: string;
  organization?: Organization | null;
  organizationId?: string | null;
  requester: User;
  requesterId: string;
  costCenter: string;
  supplier: string;
  category: string;
  description: string;
  justification: string;
  estimatedValue: string;
  priority: Priority;
  observations?: string | null;
  status: PurchaseRequestStatus;
  attachments?: Attachment[];
  approvals?: PurchaseApproval[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestFieldOption {
  label: string;
  value: string;
}

export interface RequestField {
  id: string;
  requestTypeId: string;
  label: string;
  key: string;
  type: RequestFieldType;
  required: boolean;
  options?: RequestFieldOption[] | null;
  helpText?: string | null;
  order: number;
}

export interface RequestType {
  id: string;
  name: string;
  description?: string | null;
  department?: Department | null;
  departmentId?: string | null;
  icon?: string | null;
  sourceKind: RequestTypeSourceKind;
  isBuiltIn: boolean;
  isActive: boolean;
  /** Autosolicitação: só quem é do próprio departamento responsável enxerga/envia. Ignora visibleDepartments quando true. */
  isSelfRequestOnly: boolean;
  /** Organizações para as quais este tipo está disponível — vazio = oculto até o admin configurar. Ignorado pelo card semente de Compra. */
  organizations?: Organization[];
  /** Restrição extra opcional, por cima da organização — vazio = sem restrição extra (todo departamento com acesso à organização vê). Ignorado pelo card semente de Compra. */
  visibleDepartments?: Department[];
  fields?: RequestField[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestSubmission {
  id: string;
  requestType: RequestType;
  requestTypeId: string;
  requester: User;
  requesterId: string;
  department: Department;
  departmentId: string;
  organization?: Organization | null;
  organizationId?: string | null;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  color: string;
  order: number;
  /** Onde todo ticket novo nasce — exatamente 1 por board. */
  isInitial: boolean;
  /** Equivalente a "Resolvido" — libera arquivar. */
  isDone: boolean;
  /** Equivalente a "Cancelado" — libera arquivar. */
  isCancelled: boolean;
}

export interface Board {
  id: string;
  departmentId: string;
  name: string;
  columns: BoardColumn[];
}

export interface PurchaseApproval {
  id: string;
  approver: User;
  approverDepartment: Department;
  decision: "APPROVED" | "REJECTED";
  reason?: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface Follower {
  id: string;
  user: User;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  protocol: string;
  title: string;
  description: string;
  purchaseRequestId?: string | null;
  purchaseRequest?: PurchaseRequest | null;
  requestTypeId?: string | null;
  requestType?: RequestType | null;
  requestSubmissionId?: string | null;
  requestSubmission?: RequestSubmission | null;
  columnId: string;
  column?: BoardColumn | null;
  priority: Priority;
  assignee?: User | null;
  assigneeId?: string | null;
  department: Department;
  organization?: Organization | null;
  organizationId?: string | null;
  requester: User;
  comments?: Comment[];
  attachments?: Attachment[];
  followers?: Follower[];
  tags?: Tag[];
  commentsCount?: number;
  attachmentsCount?: number;
  isArchived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: User;
  createdAt: string;
}

export interface DeviceMaintenance {
  id: string;
  sentDate: string;
  returnDate?: string | null;
  reason: string;
  registeredBy: User;
  createdAt: string;
}

export interface Device {
  id: string;
  name?: string | null;
  serialNumber: string;
  mac?: string | null;
  model: string;
  brand: string;
  purchaseDate: string;
  warrantyExpiration: string;
  organization: Organization;
  organizationId: string;
  department: Department;
  departmentId: string;
  assignedToName?: string | null;
  attachments?: DeviceAttachment[];
  maintenances?: DeviceMaintenance[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  user: User;
  action: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user?: User | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Só vem preenchido no board do Kanban: total real por coluna/status, mesmo quando a lista trouxe só os primeiros `columnLimit`. */
  columnTotals?: Record<string, number>;
  columnLimit?: number;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}
