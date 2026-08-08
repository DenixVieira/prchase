import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import {
  User, Department, Permission, DepartmentPermission, RefreshToken,
  PurchaseRequest, PurchaseApproval, Ticket, Comment, Attachment,
  Follower, Notification, History, AuditLog, Setting, Organization, Tag,
  Device, DeviceAttachment, DeviceMaintenance, DepartmentGroup,
  RequestType, RequestField, RequestSubmission,
} from "../database/entities";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: false,
  logging: env.isProduction ? ["error", "warn"] : ["error", "warn", "schema"],
  entities: [
    User, Department, Permission, DepartmentPermission, RefreshToken,
    PurchaseRequest, PurchaseApproval, Ticket, Comment, Attachment,
    Follower, Notification, History, AuditLog, Setting, Organization, Tag,
    Device, DeviceAttachment, DeviceMaintenance, DepartmentGroup,
    RequestType, RequestField, RequestSubmission,
  ],
  migrations: [__dirname + "/../database/migrations/*.{ts,js}"],
  migrationsTableName: "typeorm_migrations",
});
