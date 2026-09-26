import ConfirmPopup from "@/components/atoms/confirm-popup";
import SmallLogo from "@/components/atoms/logo-sm";
import SettingListItem from "@/components/atoms/setting-list-item";
import Skeleton from "@/components/atoms/skeleton";
import Header from "@/components/header";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import ProBadge from "@/components/ui/pro-badge";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUserPlan } from "@/hooks/use-user-plan";
import { usePermissions } from "@/hooks/usePermissions";
import { authApi, settingsApi, UserProfile } from "@/services";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, useWindowDimensions, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function SettingScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const styles = createStyles(colorScheme, isTablet, isTabletLandscape);
  const router = useRouter();
  const VERSION = "1.0.0";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const { userRole } = usePermissions();
  const { isBasic, isPro, isTrial, plan } = useUserPlan();

  const getPlanDisplayName = () => {
    if (isPro) return "PRO";
    if (isTrial) return "TRIAL";
    return "Basic";
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await settingsApi.getProfile();
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error: any) {
      console.error("❌ Failed to load profile:", error);
      // Jika error 401, token expired, redirect ke login
      if (error.code === 401) {
        Alert.alert("Session Expired", "Please login again", [
          { text: "OK", onPress: () => router.replace("/auth/Login/login") },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const confirmLogout = async () => {
    setShowLogoutPopup(false);
    setIsLoggingOut(true);
    try {
      console.log("🚪 Logging out...");
      await authApi.logout();
      console.log("✅ Logout successful");
      router.replace("/");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Tetap logout dan redirect meskipun API gagal
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <ConfirmPopup
        visible={showLogoutPopup}
        title="Keluar"
        message="Apakah Anda yakin ingin keluar?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutPopup(false)}
      />
      <Header showBack={true} showHelp={false} title="Setting" />

      <View style={styles.contentWrapper}>
        <View style={styles.infoCard}>
          <View style={styles.infoCardRow}>
            <View style={styles.iconSquare}>
              <SmallLogo />
              {(isPro || isTrial) && (
                <View style={[styles.badgePro, isTrial && styles.badgeTrial]}>
                  <ThemedText style={styles.badgeProText}>{getPlanDisplayName()}</ThemedText>
                </View>
              )}
              {isBasic && (
                <View style={styles.badgeBasic}>
                  <ThemedText style={styles.badgeBasicText}>Basic</ThemedText>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              {isLoading ? (
                <View style={styles.profileSkeleton}>
                  <Skeleton width={120} height={14} style={styles.skeletonEmail} />
                  <Skeleton width={80} height={12} style={styles.skeletonVersion} />
                </View>
              ) : (
                <>
                  <ThemedText style={styles.infoEmail} numberOfLines={1}>
                    {profile?.email || profile?.phone || "User"}
                  </ThemedText>
                  <ThemedText style={styles.infoVersion}>
                    Version {VERSION} • {profile?.role || "User"} • {getPlanDisplayName()}
                  </ThemedText>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
      {/* <SectionDivider/>  */}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollContentWrapper}>
          <View style={styles.sectionCard}>
            <SettingListItem
              leftIconName="settings-outline"
              title="Umum"
              onPress={() => router.push("/dashboard/setting/umum" as never)}
              showTopBorder={false}
              showBottomBorder={true}
            />
            <SettingListItem
              leftIconName="person-outline"
              title="Profile"
              onPress={() => router.push("/dashboard/setting/profile" as never)}
              showTopBorder={false}
              showBottomBorder={true}
            />
            {['owner', 'admin', 'superadmin'].includes(userRole || '') && (
              <>
                <SettingListItem
                  leftIconName="storefront-outline"
                  title="Store"
                  onPress={() => router.push("/dashboard/setting/store" as never)}
                  showTopBorder={false}
                  showBottomBorder={true}
                />
                <SettingListItem
                  leftIconName="swap-horizontal-outline"
                  title="Konversi Unit"
                  onPress={() => {
                    if (!isBasic) {
                      router.push("/dashboard/setting/unit-conversions" as never);
                    }
                  }}
                  showTopBorder={false}
                  showBottomBorder={true}
                  disabled={isBasic}
                  rightComponent={isBasic ? <ProBadge size="small" /> : undefined}
                />
              </>
            )}
          </View>
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomButtonWrapper}>
        <ThemedButton
          size="medium"
          title={isLoggingOut ? "Keluar..." : "Keluar"}
          variant="secondary"
          onPress={handleLogout}
          disabled={isLoggingOut}
        />
      </View>
    </View>
  );
}

const createStyles = (colorScheme: "light" | "dark", isTablet: boolean, isTabletLandscape: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    contentWrapper: {
      width: "100%",
      maxWidth: isTabletLandscape ? 960 : undefined,
      alignSelf: "center",
      paddingHorizontal: isTablet ? 40 : 0,
    },
    scrollContentWrapper: {
      width: "100%",
      maxWidth: isTabletLandscape ? 960 : undefined,
      alignSelf: "center",
    },
    scrollContainer: {
      paddingBottom: isTablet ? 32 : 20,
      paddingHorizontal: isTablet ? 40 : 0,
    },
    sectionCard: {
      borderColor: Colors[colorScheme].icon,
      backgroundColor: Colors[colorScheme].background,
      paddingVertical: isTablet ? 12 : 8,
    },
    infoCard: {
      marginTop: isTablet ? 20 : 12,
      borderRadius: isTablet ? 12 : 8,
      backgroundColor: Colors[colorScheme].background,
      paddingHorizontal: isTablet ? 32 : 18,
      paddingVertical: isTablet ? 16 : 10,
    },
    infoCardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: isTablet ? 20 : 12,
    },
    iconSquare: {
      padding: isTablet ? 8 : 4,
      borderRadius: isTablet ? 12 : 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme].primary,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    sectionCardHighlight: {
      borderRadius: isTablet ? 12 : 8,
      backgroundColor: Colors[colorScheme].secondary,
      paddingHorizontal: isTablet ? 20 : 12,
      paddingVertical: isTablet ? 32 : 24,
      gap: isTablet ? 10 : 6,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: isTablet ? 8 : 4,
      paddingVertical: isTablet ? 8 : 4,
    },
    syncRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: isTablet ? 16 : 10,
    },
    badgePro: {
      position: "absolute",
      top: isTablet ? -10 : -8,
      right: isTablet ? -10 : -8,
      alignSelf: "center",
      paddingHorizontal: isTablet ? 10 : 6,
      paddingVertical: isTablet ? 2 : 0,
      borderRadius: isTablet ? 14 : 10,
      backgroundColor: '#4CAF50',
    },
    badgeTrial: {
      backgroundColor: '#FF9800',
    },
    badgeProText: {
      fontSize: isTablet ? 12 : 8,
      color: Colors[colorScheme].secondary,
      fontWeight: "700",
    },
    badgeBasic: {
      position: "absolute",
      top: isTablet ? -10 : -8,
      right: isTablet ? -10 : -8,
      alignSelf: "center",
      paddingHorizontal: isTablet ? 10 : 6,
      paddingVertical: isTablet ? 2 : 0,
      borderRadius: isTablet ? 14 : 10,
      backgroundColor: Colors[colorScheme].border,
    },
    badgeBasicText: {
      fontSize: isTablet ? 12 : 8,
      color: Colors[colorScheme].text,
      fontWeight: "700",
    },
    infoEmail: {
      fontSize: isTablet ? 20 : 16,
      lineHeight: isTablet ? 28 : 20,
      fontWeight: "600",
    },
    infoVersion: {
      fontSize: isTablet ? 18 : 13,
      color: Colors[colorScheme].icon,
      marginTop: isTablet ? 4 : 2,
    },
    profileSkeleton: {
      flex: 1,
    },
    skeletonEmail: {
      marginBottom: isTablet ? 8 : 4,
    },
    skeletonVersion: {
      marginTop: isTablet ? 4 : 2,
    },
    bottomButtonWrapper: {
      position: "absolute",
      left: isTablet ? 40 : 16,
      right: isTablet ? 40 : 16,
      bottom: isTablet ? 24 : 16,
    },
    headerIconButton: {},
  });
