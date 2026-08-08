import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ProfileCard } from "./ProfileCard";
import { NotificationPreferenceCard } from "./NotificationPreferenceCard";
import { NotificationTypesCard } from "./NotificationTypesCard";
import { ChangeEmailCard } from "./ChangeEmailCard";
import { ChangePasswordCard } from "./ChangePasswordCard";

export default function ProfilePage() {
  return (
    <div className="space-y-4 max-w-xl">
      <Breadcrumb items={[{ label: "Meu Perfil" }]} />
      <ProfileCard />
      <NotificationPreferenceCard />
      <NotificationTypesCard />
      <ChangeEmailCard />
      <ChangePasswordCard />
    </div>
  );
}
