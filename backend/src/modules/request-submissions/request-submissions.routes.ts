import { Router } from "express";
import * as controller from "./request-submissions.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { PermissionKey } from "../../database/entities";
import { uploadMemory } from "./request-submissions.upload";

const router = Router();
router.use(authenticate);

router.post("/", authorize(PermissionKey.CREATE_REQUEST), uploadMemory.any(), controller.create);

export default router;
