import { Router } from "express";
import * as controller from "./devices.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { uploadDevice } from "../../middlewares/upload";
import { resolveDeviceUploadContext } from "../../middlewares/uploadContext";
import { PermissionKey } from "../../database/entities";
import { CreateDeviceDto, UpdateDeviceDto, CreateMaintenanceDto } from "./devices.dto";

const router = Router();
router.use(authenticate);

router.get("/", authorize(PermissionKey.VIEW_DEVICE), controller.list);
router.get("/:id", authorize(PermissionKey.VIEW_DEVICE), controller.findOne);
router.post("/", authorize(PermissionKey.CREATE_DEVICE), validateDto(CreateDeviceDto), controller.create);
router.patch("/:id", authorize(PermissionKey.EDIT_DEVICE), validateDto(UpdateDeviceDto), controller.update);
router.delete("/:id", authorize(PermissionKey.DELETE_DEVICE), controller.remove);

router.post(
  "/:id/maintenances",
  authorize(PermissionKey.REGISTER_DEVICE_MAINTENANCE),
  validateDto(CreateMaintenanceDto),
  controller.addMaintenance
);

router.post(
  "/:deviceId/attachments",
  authorize(PermissionKey.EDIT_DEVICE),
  resolveDeviceUploadContext,
  uploadDevice.single("file"),
  controller.uploadAttachment
);
router.get(
  "/:deviceId/attachments/:attachmentId/download",
  authorize(PermissionKey.VIEW_DEVICE),
  controller.downloadAttachment
);
router.get(
  "/:deviceId/attachments/:attachmentId/view",
  authorize(PermissionKey.VIEW_DEVICE),
  controller.viewAttachment
);
router.delete(
  "/:deviceId/attachments/:attachmentId",
  authorize(PermissionKey.EDIT_DEVICE),
  controller.removeAttachment
);

export default router;
