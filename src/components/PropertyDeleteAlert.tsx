import { IonAlert } from "@ionic/react";

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

export default function PropertyDeleteAlert({
  isOpen,
  onCancel,
  onDelete,
}: Props) {
  return (
    <IonAlert
      isOpen={isOpen}
      header="Delete Property"
      message="This action cannot be undone."
      buttons={[
        { text: "Cancel", role: "cancel", handler: onCancel },
        { text: "Delete", role: "destructive", handler: onDelete },
      ]}
      onDidDismiss={onCancel}
    />
  );
}