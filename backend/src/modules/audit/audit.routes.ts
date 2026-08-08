import { Router } from "express";
import * as controller from "./audit.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { PermissionKey } from "../../database/entities";

const router = Router();
router.use(authenticate, authorize(PermissionKey.SYSTEM_ADMIN, PermissionKey.MANAGE_SETTINGS));

router.get("/", controller.list);
router.get("/export/csv", controller.exportCsv);

export default router;
