import { Router } from "express";
import * as controller from "./notifications.controller";
import { authenticate } from "../../middlewares/authenticate";
import { validateDto } from "../../utils/validate";
import { UpdateNotificationPreferenceDto, UpdateMutedTypesDto } from "./notifications.dto";

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.get("/unread-count", controller.unreadCount);
router.post("/:id/read", controller.markAsRead);
router.post("/read-all", controller.markAllAsRead);
router.patch("/preference", validateDto(UpdateNotificationPreferenceDto), controller.updatePreference);
router.patch("/muted-types", validateDto(UpdateMutedTypesDto), controller.updateMutedTypes);

export default router;
