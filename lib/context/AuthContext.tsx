"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { getDocument, setDocument } from "../firebase/firestore";
import { UserProfile, AdminProfile, AdminRole } from "../../types";
import { Timestamp } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  adminProfile: AdminProfile | null;
  loading: boolean;
  isAdmin: boolean;
  role: AdminRole | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  adminProfile: null,
  loading: true,
  isAdmin: false,
  role: null,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async (currentUser: User) => {
    try {
      // 1. Check if user is admin
      const adminData = await getDocument<AdminProfile>("admins", currentUser.uid);
      if (adminData && adminData.isActive) {
        setAdminProfile(adminData);
        setProfile(null);
        const isProd = process.env.NODE_ENV === "production";
        document.cookie = `yumi_session=${currentUser.uid}; path=/; max-age=604800; SameSite=Lax${isProd ? "; Secure" : ""}`;
        document.cookie = `yumi_is_admin=true; path=/; max-age=604800; SameSite=Lax${isProd ? "; Secure" : ""}`;
        return;
      }

      setAdminProfile(null);

      // 2. Fetch or create customer profile
      let userProfile = await getDocument<UserProfile>("users", currentUser.uid);
      const effectiveName = currentUser.displayName && currentUser.displayName !== "Customer"
        ? currentUser.displayName
        : userProfile?.displayName && userProfile.displayName !== "Customer"
        ? userProfile.displayName
        : currentUser.email
        ? currentUser.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Customer";

      if (!userProfile) {
        // Create initial profile
        const newProfile: Omit<UserProfile, "id"> = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: effectiveName,
          photoURL: currentUser.photoURL || null,
          emailVerified: currentUser.emailVerified,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await setDocument("users", currentUser.uid, newProfile);
        userProfile = { id: currentUser.uid, ...newProfile };
      } else if (userProfile.displayName === "Customer" && effectiveName !== "Customer") {
        // Correct placeholder "Customer" with real name
        await setDocument("users", currentUser.uid, { displayName: effectiveName }, true);
        userProfile.displayName = effectiveName;
      } else if (userProfile.emailVerified !== currentUser.emailVerified) {
        // Update email verified status if it changed
        await setDocument("users", currentUser.uid, { emailVerified: currentUser.emailVerified }, true);
        userProfile.emailVerified = currentUser.emailVerified;
      }
      setProfile(userProfile);

      // 3. Sync cookies for middleware check
      const isProd = process.env.NODE_ENV === "production";
      document.cookie = `yumi_session=${currentUser.uid}; path=/; max-age=604800; SameSite=Lax${isProd ? "; Secure" : ""}`;
      document.cookie = `yumi_is_admin=false; path=/; max-age=604800; SameSite=Lax${isProd ? "; Secure" : ""}`;
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileData(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfileData(currentUser);
      } else {
        setProfile(null);
        setAdminProfile(null);
        document.cookie = "yumi_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "yumi_is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = !!adminProfile;
  const role = adminProfile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        adminProfile,
        loading,
        isAdmin,
        role,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
