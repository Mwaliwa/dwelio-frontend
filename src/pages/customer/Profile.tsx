import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonNote,
  IonToggle,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  useIonRouter,
  useIonAlert,
  useIonToast,
  RefresherEventDetail,
  useIonViewWillEnter,
} from "@ionic/react";

import {
  personOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  notificationsOutline,
  heartOutline,
  logOutOutline,
  chevronForwardOutline,
  createOutline,
  starOutline,
  refreshOutline,
} from "ionicons/icons";

import {
  useCallback,
  useState,
} from "react";

/* =========================================================
   CONFIG
========================================================= */

const API_URL = "http://localhost:5001";

/* =========================================================
   TYPES
========================================================= */

interface UserData {
  id?: number | string;

  name: string;

  email: string;

  phone: string;

  avatar: string;

  memberSince: string;

  role?: string;
}

/* =========================================================
   DEFAULT USER
========================================================= */

const EMPTY_USER: UserData = {
  name: "",
  email: "",
  phone: "",
  avatar: "",
  memberSince: "",
};

/* =========================================================
   HELPERS
========================================================= */

const getToken = (): string | null => {
  return localStorage.getItem("token");
};

const getStoredUser = (): any => {
  try {
    const stored = localStorage.getItem("user");

    if (!stored) {
      return {};
    }

    return JSON.parse(stored) || {};
  } catch (error) {
    console.error(
      "Failed to parse localStorage user:",
      error
    );

    return {};
  }
};

/* =========================================================
   NORMALIZE USER
========================================================= */

const normalizeUser = (
  source: any
): UserData => {
  if (!source) {
    return EMPTY_USER;
  }

  const name =
    source.name ||
    source.full_name ||
    source.fullName ||
    "";

  const email =
    source.email ||
    "";

  const phone =
    source.phone ||
    source.phone_number ||
    source.phoneNumber ||
    "";

  const avatar =
    source.avatar ||
    source.profile_image ||
    source.profileImage ||
    "";

  let memberSince = "";

  const dateValue =
    source.memberSince ||
    source.member_since ||
    source.created_at ||
    source.createdAt;

  if (dateValue) {
    const parsedDate =
      new Date(dateValue);

    if (
      !isNaN(
        parsedDate.getTime()
      )
    ) {
      memberSince =
        parsedDate.toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
          }
        );
    }
  }

  return {
    id:
      source.id ||
      source.userId ||
      source.user_id,

    name,

    email,

    phone,

    avatar,

    memberSince,

    role:
      source.role ||
      "",
  };
};

/* =========================================================
   PROFILE COMPONENT
========================================================= */

const Profile: React.FC = () => {
  const router =
    useIonRouter();

  const [presentAlert] =
    useIonAlert();

  const [presentToast] =
    useIonToast();

  const [user, setUser] =
    useState<UserData>(
      EMPTY_USER
    );

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    notificationsEnabled,
    setNotificationsEnabled,
  ] = useState(true);

  /* =======================================================
     LOAD LOCAL USER
  ======================================================= */

  const loadLocalUser =
    useCallback(() => {
      const storedUser =
        getStoredUser();

      /*
       * Merge old individual
       * localStorage keys as fallback.
       */

      const mergedUser = {
        ...storedUser,

        name:
          storedUser.name ||
          storedUser.full_name ||
          localStorage.getItem(
            "name"
          ) ||
          "",

        email:
          storedUser.email ||
          localStorage.getItem(
            "email"
          ) ||
          "",

        phone:
          storedUser.phone ||
          storedUser.phone_number ||
          localStorage.getItem(
            "phone"
          ) ||
          "",

        avatar:
          storedUser.avatar ||
          storedUser.profile_image ||
          localStorage.getItem(
            "avatar"
          ) ||
          "",
      };

      const normalized =
        normalizeUser(
          mergedUser
        );

      setUser(normalized);

      /*
       * Notifications preference
       */

      const notificationSetting =
        localStorage.getItem(
          "notificationsEnabled"
        );

      if (
        notificationSetting !==
        null
      ) {
        setNotificationsEnabled(
          notificationSetting ===
            "true"
        );
      }

      return normalized;
    }, []);

  /* =======================================================
     FETCH LATEST USER FROM BACKEND
  ======================================================= */

  const fetchLatestProfile =
    useCallback(
      async (
        showLoading = true
      ) => {
        const token =
          getToken();

        /*
         * Always load local data
         * first so the page is not
         * blank.
         */

        const localUser =
          loadLocalUser();

        if (!token) {
          setLoading(false);
          return;
        }

        if (showLoading) {
          setLoading(true);
        }

        try {
          /*
           * IMPORTANT:
           *
           * This endpoint must exist
           * in your backend:
           *
           * GET /api/users/profile
           */

          const response =
            await fetch(
              `${API_URL}/api/users/profile`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          /*
           * Read response safely.
           */

          const raw =
            await response.text();

          let data: any = {};

          if (raw) {
            try {
              data =
                JSON.parse(raw);
            } catch {
              console.error(
                "Invalid profile response:",
                raw
              );
            }
          }

          /*
           * Token expired.
           */

          if (
            response.status ===
            401
          ) {
            console.warn(
              "Profile request returned 401"
            );

            return;
          }

          /*
           * If endpoint doesn't
           * exist, continue using
           * localStorage.
           */

          if (
            response.status ===
            404
          ) {
            console.warn(
              "GET /api/users/profile does not exist. Using local profile data."
            );

            return;
          }

          if (!response.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                `Profile request failed (${response.status})`
            );
          }

          /*
           * Support several backend
           * response structures.
           */

          const serverUser =
            data?.user ||
            data?.data?.user ||
            data?.data ||
            data;

          if (
            !serverUser ||
            typeof serverUser !==
              "object"
          ) {
            return;
          }

          /*
           * Merge server user with
           * existing local user.
           */

          const normalized =
            normalizeUser(
              {
                ...localUser,
                ...serverUser,
              }
            );

          /*
           * Update React state.
           */

          setUser(
            normalized
          );

          /*
           * IMPORTANT:
           * Update localStorage too.
           *
           * This means Edit Profile,
           * Profile, Login and other
           * pages all see the same
           * information.
           */

          const existing =
            getStoredUser();

          const updatedStoredUser =
            {
              ...existing,
              ...serverUser,

              name:
                normalized.name,

              email:
                normalized.email,

              phone:
                normalized.phone,

              avatar:
                normalized.avatar,
            };

          localStorage.setItem(
            "user",
            JSON.stringify(
              updatedStoredUser
            )
          );

          localStorage.setItem(
            "name",
            normalized.name
          );

          localStorage.setItem(
            "email",
            normalized.email
          );

          localStorage.setItem(
            "phone",
            normalized.phone
          );

          if (
            normalized.avatar
          ) {
            localStorage.setItem(
              "avatar",
              normalized.avatar
            );
          }
        } catch (error) {
          console.error(
            "FETCH PROFILE ERROR:",
            error
          );

          /*
           * Don't destroy the
           * locally cached profile
           * if the network fails.
           */

          setUser(
            localUser
          );
        } finally {
          setLoading(false);
        }
      },
      [loadLocalUser]
    );

  /* =======================================================
     RUN EVERY TIME PROFILE PAGE ENTERS
  ======================================================= */

  useIonViewWillEnter(() => {
    fetchLatestProfile(
      false
    );
  });

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async (
      event: CustomEvent<RefresherEventDetail>
    ) => {
      setRefreshing(true);

      await fetchLatestProfile(
        false
      );

      setRefreshing(false);

      event.detail.complete();
    };

  /* =======================================================
     EDIT PROFILE
  ======================================================= */

  const handleEditProfile =
    () => {
      router.push(
        "/customer/profile/edit"
      );
    };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    () => {
      presentAlert({
        header: "Log out",

        message:
          "Are you sure you want to log out?",

        buttons: [
          {
            text: "Cancel",
            role: "cancel",
          },

          {
            text: "Log out",
            role: "destructive",

            handler: () => {
              /*
               * Clear authentication
               * and profile information.
               */

              localStorage.removeItem(
                "token"
              );

              localStorage.removeItem(
                "user"
              );

              localStorage.removeItem(
                "name"
              );

              localStorage.removeItem(
                "email"
              );

              localStorage.removeItem(
                "phone"
              );

              localStorage.removeItem(
                "avatar"
              );

              presentToast({
                message:
                  "Logged out successfully",

                duration: 1500,

                color: "medium",
              });

              router.push(
                "/login",
                "root",
                "replace"
              );
            },
          },
        ],
      });
    };

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const handleNotificationToggle =
    (
      checked: boolean
    ) => {
      setNotificationsEnabled(
        checked
      );

      localStorage.setItem(
        "notificationsEnabled",
        String(checked)
      );

      presentToast({
        message: checked
          ? "Notifications enabled"
          : "Notifications disabled",

        duration: 1200,

        color: "medium",
      });
    };

  /* =======================================================
     DISPLAY VALUES
  ======================================================= */

  const displayName =
    user.name ||
    "Guest User";

  const displayEmail =
    user.email ||
    "No email set";

  const displayPhone =
    user.phone ||
    "No phone number";

  /* =======================================================
     SKELETON
  ======================================================= */

  const renderSkeleton =
    () => (
      <div
        style={{
          padding: "0 4px",
        }}
      >
        <IonCard
          className="ion-no-margin"
          style={{
            marginBottom: 20,
            borderRadius: 16,
          }}
        >
          <IonCardContent
            className="ion-text-center"
            style={{
              padding:
                "24px 16px",
            }}
          >
            <IonSkeletonText
              animated
              style={{
                width: 96,
                height: 96,
                borderRadius:
                  "50%",
                margin:
                  "0 auto 16px",
              }}
            />

            <IonSkeletonText
              animated
              style={{
                width: "55%",
                height: 22,
                margin:
                  "0 auto 8px",
              }}
            />

            <IonSkeletonText
              animated
              style={{
                width: "70%",
                height: 16,
                margin:
                  "0 auto",
              }}
            />
          </IonCardContent>
        </IonCard>

        <IonList inset>
          {[
            1,
            2,
            3,
          ].map((item) => (
            <IonItem
              key={item}
              lines={
                item === 3
                  ? "none"
                  : "full"
              }
            >
              <IonSkeletonText
                animated
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  marginRight:
                    16,
                }}
              />

              <IonLabel>
                <IonSkeletonText
                  animated
                  style={{
                    width: "30%",
                    height: 14,
                  }}
                />

                <IonSkeletonText
                  animated
                  style={{
                    width: "60%",
                    height: 14,
                    marginTop: 6,
                  }}
                />
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </div>
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            Profile
          </IonTitle>

          <IonButtons slot="end">
            <IonButton
              onClick={
                handleEditProfile
              }
              fill="clear"
              disabled={
                refreshing
              }
            >
              <IonIcon
                icon={
                  createOutline
                }
                slot="icon-only"
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonRefresher
          slot="fixed"
          onIonRefresh={
            handleRefresh
          }
        >
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {/* =================================================
                USER CARD
            ================================================= */}

            <IonCard
              className="ion-no-margin"
              style={{
                marginBottom: 20,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow:
                  "0 4px 18px rgba(0,0,0,0.06)",
              }}
            >
              <IonCardContent
                className="ion-text-center"
                style={{
                  padding:
                    "28px 16px 24px",
                }}
              >
                <IonAvatar
                  style={{
                    width: 96,
                    height: 96,
                    margin:
                      "0 auto 16px",
                    border:
                      "3px solid var(--ion-color-primary)",
                  }}
                >
                  <img
                    src={
                      user.avatar ||
                      "https://ionicframework.com/docs/img/demos/avatar.svg"
                    }
                    alt={
                      displayName
                    }
                  />
                </IonAvatar>

                <h2
                  style={{
                    margin:
                      "0 0 5px",
                    fontWeight: 650,
                    fontSize:
                      "1.3rem",
                  }}
                >
                  {
                    displayName
                  }
                </h2>

                <IonNote
                  style={{
                    fontSize:
                      "0.95rem",
                  }}
                >
                  {
                    displayEmail
                  }
                </IonNote>

                {user.phone && (
                  <p
                    style={{
                      margin:
                        "7px 0 0",
                      color:
                        "var(--ion-color-medium)",
                      fontSize:
                        "0.9rem",
                    }}
                  >
                    {displayPhone}
                  </p>
                )}

                {user.memberSince && (
                  <p
                    style={{
                      margin:
                        "12px 0 0",
                      fontSize:
                        "0.8rem",
                      color:
                        "var(--ion-color-medium)",
                    }}
                  >
                    Member since{" "}
                    {
                      user.memberSince
                    }
                  </p>
                )}
              </IonCardContent>
            </IonCard>

            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <IonList
              inset
              style={{
                borderRadius: 14,
                overflow:
                  "hidden",
                boxShadow:
                  "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              {/* NAME */}

              <IonItem lines="full">
                <IonIcon
                  icon={
                    personOutline
                  }
                  slot="start"
                  color="primary"
                />

                <IonLabel>
                  <h3
                    style={{
                      fontWeight:
                        500,
                    }}
                  >
                    Full Name
                  </h3>

                  <p
                    style={{
                      color:
                        user.name
                          ? "var(--ion-text-color)"
                          : "var(--ion-color-medium)",
                    }}
                  >
                    {user.name ||
                      "Not set"}
                  </p>
                </IonLabel>
              </IonItem>

              {/* EMAIL */}

              <IonItem lines="full">
                <IonIcon
                  icon={
                    mailOutline
                  }
                  slot="start"
                  color="primary"
                />

                <IonLabel>
                  <h3
                    style={{
                      fontWeight:
                        500,
                    }}
                  >
                    Email
                  </h3>

                  <p
                    style={{
                      color:
                        user.email
                          ? "var(--ion-text-color)"
                          : "var(--ion-color-medium)",
                      wordBreak:
                        "break-word",
                    }}
                  >
                    {user.email ||
                      "Not set"}
                  </p>
                </IonLabel>
              </IonItem>

              {/* PHONE */}

              <IonItem lines="none">
                <IonIcon
                  icon={
                    callOutline
                  }
                  slot="start"
                  color="primary"
                />

                <IonLabel>
                  <h3
                    style={{
                      fontWeight:
                        500,
                    }}
                  >
                    Phone
                  </h3>

                  <p
                    style={{
                      color:
                        user.phone
                          ? "var(--ion-text-color)"
                          : "var(--ion-color-medium)",
                    }}
                  >
                    {user.phone ||
                      "Not set"}
                  </p>
                </IonLabel>
              </IonItem>
            </IonList>

            {/* =================================================
                QUICK LINKS
            ================================================= */}

            <IonList
              inset
              style={{
                marginTop: 16,
                borderRadius: 14,
                overflow:
                  "hidden",
                boxShadow:
                  "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <IonItem
                button
                detail={false}
                routerLink="/customer/favorites"
              >
                <IonIcon
                  icon={
                    heartOutline
                  }
                  slot="start"
                  color="danger"
                />

                <IonLabel>
                  My Favorites
                </IonLabel>

                <IonIcon
                  icon={
                    chevronForwardOutline
                  }
                  slot="end"
                  color="medium"
                />
              </IonItem>

              <IonItem
                button
                detail={false}
                routerLink="/customer/reviews"
              >
                <IonIcon
                  icon={
                    starOutline
                  }
                  slot="start"
                  color="warning"
                />

                <IonLabel>
                  My Reviews
                </IonLabel>

                <IonIcon
                  icon={
                    chevronForwardOutline
                  }
                  slot="end"
                  color="medium"
                />
              </IonItem>
            </IonList>

            {/* =================================================
                SETTINGS
            ================================================= */}

            <IonList
              inset
              style={{
                marginTop: 16,
                borderRadius: 14,
                overflow:
                  "hidden",
                boxShadow:
                  "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <IonItem>
                <IonIcon
                  icon={
                    notificationsOutline
                  }
                  slot="start"
                  color="primary"
                />

                <IonLabel>
                  Push Notifications
                </IonLabel>

                <IonToggle
                  checked={
                    notificationsEnabled
                  }
                  onIonChange={(
                    event
                  ) =>
                    handleNotificationToggle(
                      event
                        .detail
                        .checked
                    )
                  }
                />
              </IonItem>

              <IonItem
                button
                detail={false}
                routerLink="/customer/change-password"
              >
                <IonIcon
                  icon={
                    lockClosedOutline
                  }
                  slot="start"
                  color="medium"
                />

                <IonLabel>
                  Change Password
                </IonLabel>

                <IonIcon
                  icon={
                    chevronForwardOutline
                  }
                  slot="end"
                  color="medium"
                />
              </IonItem>
            </IonList>

            {/* =================================================
                LOGOUT
            ================================================= */}

            <div
              style={{
                marginTop: 32,
                padding: "0 4px",
              }}
            >
              <IonButton
                expand="block"
                color="danger"
                fill="outline"
                onClick={
                  handleLogout
                }
                style={{
                  "--border-radius":
                    "12px",
                  height: 48,
                }}
              >
                <IonIcon
                  icon={
                    logOutOutline
                  }
                  slot="start"
                />

                Log Out
              </IonButton>
            </div>

            <p
              className="ion-text-center"
              style={{
                marginTop: 28,
                fontSize:
                  "0.75rem",
                color:
                  "var(--ion-color-medium)",
              }}
            >
              App version 1.0.0
            </p>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;