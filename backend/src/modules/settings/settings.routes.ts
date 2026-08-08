import { Router } from "express";
import * as controller from "./settings.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import { UpdateSmtpSettingsDto } from "./settings.dto";

const router = Router();
router.use(authenticate, authorize(PermissionKey.MANAGE_SETTINGS));

router.get("/smtp", controller.getSmtp);
router.put("/smtp", validateDto(UpdateSmtpSettingsDto), controller.updateSmtp);
router.post("/smtp/test", validateDto(UpdateSmtpSettingsDto), controller.testSmtp);

export default router;
