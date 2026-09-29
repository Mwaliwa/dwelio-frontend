import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonChip,
  IonText,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import {
  peopleOutline,
  mailOutline,
  shieldCheckmarkOutline,
  personOutline,
  keyOutline,
} from "ionicons/icons";

const API_URL = "http://localhost:5001";

interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "agent" | "admin";
  created_at?: string;
}

export default function AdminUsers() {
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const token = localStorage.getItem("token");
  const currentUserId = Number(localStorage.getItem("userId")); // optional

  // ========================
  // FETCH USERS
  // ========================
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const url = roleFilter
        ? `${API_URL}/api/admin/users?role=${roleFilter}`
        : `${API_URL}/api/admin/users`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        throw new Error(data.message || "Failed to load users");
      }
    } catch (err: any) {
      console.error(err);
      presentToast({
        message: err.message || "Failed to load users",
        color: "danger",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  // ========================
  // CHANGE ROLE
  // ========================
  const handleChangeRole = (user: User) => {
    presentAlert({
      header: "Change Role",
      message: `Change role for ${user.name}`,
      inputs: [
        {
          name: "role",
          type: "radio",
          label: "Customer",
          value: "customer",
          checked: user.role === "customer",
        },
        {
          name: "role",
          type: "radio",
          label: "Agent",
          value: "agent",
          checked: user.role === "agent",
        },
        {
          name: "role",
          type: "radio",
          label: "Admin",
          value: "admin",
          checked: user.role === "admin",
        },
      ],
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Update",
          handler: async (data) => {
            const newRole = data;

            if (!newRole || newRole === user.role) return;

            try {
              const res = await fetch(
                `${API_URL}/api/admin/users/${user.id}/role`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ role: newRole }),
                }
              );

              const result = await res.json();

              if (!res.ok) {
                throw new Error(result.message || result.error || "Failed to update role");
              }

              presentToast({
                message: `${user.name} is now a ${newRole}`,
                color: "success",
                duration: 2500,
              });

              fetchUsers();
            } catch (err: any) {
              presentToast({
                message: err.message,
                color: "danger",
                duration: 3000,
              });
            }
          },
        },
      ],
    });
  };

  // ========================
  // FILTER
  // ========================
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // ========================
  // HELPERS
  // ========================
  const getRoleColor = (role: string) => {
    if (role === "admin") return "danger";
    if (role === "agent") return "success";
    return "medium";
  };

  const getRoleIcon = (role: string) => {
    if (role === "admin") return shieldCheckmarkOutline;
    if (role === "agent") return keyOutline;
    return personOutline;
  };

  // ========================
  // RENDER
  // ========================
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Manage Users</IonTitle>
        </IonToolbar>

        <IonToolbar>
          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(e.detail.value || "")}
            placeholder="Search by name or email..."
            debounce={300}
          />
        </IonToolbar>

        <IonToolbar>
          <div style={{ padding: "0 12px 8px" }}>
            <IonSelect
              value={roleFilter}
              placeholder="Filter by role"
              interface="popover"
              onIonChange={(e) => setRoleFilter(e.detail.value)}
            >
              <IonSelectOption value="">All Roles</IonSelectOption>
              <IonSelectOption value="customer">Customer</IonSelectOption>
              <IonSelectOption value="agent">Agent</IonSelectOption>
              <IonSelectOption value="admin">Admin</IonSelectOption>
            </IonSelect>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) => {
            fetchUsers().finally(() => e.detail.complete());
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        {loading && <IonLoading isOpen={true} message="Loading users..." />}

        {!loading && filteredUsers.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 80, color: "#999" }}>
            <IonIcon icon={peopleOutline} style={{ fontSize: 56 }} />
            <p>No users found</p>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <IonList>
            {filteredUsers.map((user) => (
              <IonItem key={user.id}>
                <IonAvatar slot="start">
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background:
                        user.role === "admin"
                          ? "linear-gradient(135deg, #eb445a, #c73a4c)"
                          : user.role === "agent"
                          ? "linear-gradient(135deg, #2dd36f, #28ba62)"
                          : "linear-gradient(135deg, #3880ff, #5260ff)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </IonAvatar>

                <IonLabel>
                  <h2 style={{ fontWeight: 600, marginBottom: 2 }}>
                    {user.name}
                    {user.id === currentUserId && (
                      <IonText color="medium" style={{ fontSize: 12, marginLeft: 6 }}>
                        (You)
                      </IonText>
                    )}
                  </h2>

                  <p style={{ margin: "2px 0" }}>
                    <IonIcon
                      icon={mailOutline}
                      style={{ verticalAlign: "middle", marginRight: 4 }}
                    />
                    {user.email}
                  </p>

                  <IonChip
                    color={getRoleColor(user.role)}
                    style={{ height: 26, marginTop: 4 }}
                  >
                    <IonIcon icon={getRoleIcon(user.role)} />
                    <IonLabel style={{ textTransform: "capitalize" }}>
                      {user.role}
                    </IonLabel>
                  </IonChip>
                </IonLabel>

                {/* Don't allow changing your own role */}
                {user.id !== currentUserId && (
                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => handleChangeRole(user)}
                  >
                    Change Role
                  </IonButton>
                )}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}