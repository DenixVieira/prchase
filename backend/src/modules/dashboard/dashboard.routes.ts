import { Router } from "express";
import * as controller from "./dashboard.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { PermissionKey } from "../../database/entities";

const router = Router();
router.use(authenticate);
router.get("/overview", authorize(PermissionKey.VIEW_DASHBOARD), controller.overview);

export default router;
