import { ReportCard, ReportCardSkeleton } from "@/components/atoms/report-card";
import Header from "@/components/header";
import { DashboardMenuKey } from "@/components/layouts/dashboard/menu-config";
import Sidebar from "@/components/layouts/dashboard/sidebar";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import ProBadge from "@/components/ui/pro-badge";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUserPlan } from "@/hooks/use-user-plan";
import { usePermissions } from "@/hooks/usePermissions";
import { notificationApi, statsApi } from "@/services";
import { useBranchStore } from "@/stores/branch-store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const DashboardScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isPhone = !isTablet;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const styles = createStyles(colorScheme, isTablet, isTabletLandscape);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<DashboardMenuKey>("dashboard");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [hasScrolledDown, setHasScrolledDown] = React.useState(false);
  const { hasPermission } = usePermissions();
  const { isBasic, isPro, isTrial } = useUserPlan();
  const [salesStats, setSalesStats] = React.useState<{
    current_month_sales: number;
    current_month_percentage: number;
    today_sales: number;
    today_percentage: number;
    today_expenses: number;
    today_expense_percentage: number;
    current_month_expenses: number;
    current_month_expense_percentage: number;
  } | null>(null);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = React.useState(0);
  const router = useRouter();

  // Use branch store for reactive branch name
  const { currentBranchName } = useBranchStore();

  const fetchSalesStats = React.useCallback(async () => {
    try {
      setStatsError(null);
      console.log("📊 Fetching sales stats...");
      const response = await statsApi.getSalesStats();
      console.log("📊 Stats response:", JSON.stringify(response, null, 2));
      if (response) {
        console.log("✅ Sales stats loaded:", response);
        setSalesStats(response);
      } else {
        console.warn("⚠️ No data in response");
      }
    } catch (error) {
      console.error("❌ Error fetching sales stats:", error);
      setStatsError("Gagal memuat data penjualan");
    }
  }, []);

  const fetchUnreadNotificationCount = React.useCallback(async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.data) {
        setUnreadNotificationCount(response.data.unread_count);
      }
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error);
    }
  }, []);

  React.useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchSalesStats(), fetchUnreadNotificationCount()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchSalesStats, fetchUnreadNotificationCount]);

  // Refresh data when screen comes into focus (after transaction)
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Home screen focused, refreshing stats...");
      fetchSalesStats();
      fetchUnreadNotificationCount();
    }, [fetchSalesStats, fetchUnreadNotificationCount])
  );

  const openDrawer = React.useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchSalesStats();
    setRefreshing(false);
  }, [fetchSalesStats]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number | null | undefined): string => {
    if (percentage === null || percentage === undefined) {
      return "0.00%";
    }
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const getCurrentMonthName = (): string => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  return (
    <View style={styles.container}>
      <Header
        showBack={false}
        showHelp={false}
        title="Beranda"
        left={
          <TouchableOpacity
            onPress={openDrawer}
            style={styles.headerIconButton}
          >
            <Ionicons
              name="menu-outline"
              size={isTablet ? 36 : 24}
              color="white"
            />
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity
            onPress={() => router.push("/dashboard/notification" as never)}
            style={styles.headerIconButton}
          >
            <View>
              <Ionicons
                name="notifications-outline"
                size={isTablet ? 32 : 24}
                color="white"
              />
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingBottom:
              !isTabletLandscape || (isTabletLandscape && hasScrolledDown)
                ? isTablet
                  ? 100
                  : 80
                : 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        style={
          {
            // paddingVertical: 10
          }
        }
        onScroll={event => {
          const offsetY = event.nativeEvent.contentOffset.y;
          if (offsetY > 80 && !hasScrolledDown) {
            setHasScrolledDown(true);
          } else if (offsetY <= 80 && hasScrolledDown) {
            setHasScrolledDown(false);
          }
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme].primary}
            colors={[Colors[colorScheme].primary]}
          />
        }
      >
        <View style={styles.contentWrapper}>
          <View style={styles.sectionCard}>
            {/* <ThemedText type="subtitle-2" style={{ marginBottom: 10 }}>Paket Berlangganan</ThemedText> */}
            <Image
              source={require("@/assets/banners/subscription.png")}
              style={styles.bannerImage}
            />
          </View>
          {isPhone && isPro && (
            <View style={styles.activeOutletWrapper}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ThemedText type="subtitle-2" style={[
                    styles.activeOutletTitle,
                  ]}>
                    Outlet Aktif
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    router.push("/dashboard/select-branch" as never);
                  }}
                  style={[
                    styles.linkContainer,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.outletNameText,
                    ]}
                  >
                    {currentBranchName
                      ? currentBranchName.length > 20
                        ? currentBranchName.substring(0, 20) + "..."
                        : currentBranchName
                      : "Pilih Outlet"}
                  </ThemedText>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={18}
                    color={Colors[colorScheme].icon}
                  />
                </TouchableOpacity>
              </View>

            </View>
          )}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ThemedText type="subtitle-2">Laporan</ThemedText>
                {isBasic && <ProBadge size="small" />}
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (hasPermission('reports')) {
                    router.push("/dashboard/home/report" as never);
                  }
                }}
                style={[
                  styles.linkContainer,
                  !hasPermission('reports') && styles.disabledLink
                ]}
                disabled={!hasPermission('reports')}
              >
                <ThemedText style={[
                  styles.link,
                  !hasPermission('reports') && styles.disabledText
                ]}>Lihat Semua</ThemedText>
                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={!hasPermission('reports') ? Colors[colorScheme].icon : Colors[colorScheme].icon}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              contentContainerStyle={styles.reportCardContainer}
              showsHorizontalScrollIndicator={false}
            >
              {isLoading ? (
                <>
                  <ReportCardSkeleton />
                  <ReportCardSkeleton />
                  <ReportCardSkeleton />
                  <ReportCardSkeleton />
                </>
              ) : statsError ? (
                <View style={{ padding: 16 }}>
                  <ThemedText>{statsError}</ThemedText>
                </View>
              ) : salesStats ? (
                <>
                  <ReportCard
                    title={`Penjualan Bulan ini`}
                    amount={formatCurrency(salesStats.current_month_sales)}
                    subtitle={`${formatPercentage(
                      salesStats.current_month_percentage
                    )} `}
                    subtitleColor={salesStats.current_month_percentage > 0 ? '#10b981' : undefined}
                  />
                  <ReportCard
                    title="Pengeluaran bulan ini"
                    amount={formatCurrency(salesStats.current_month_expenses)}
                    subtitle={`${formatPercentage(
                      salesStats.current_month_expense_percentage
                    )} `}
                    subtitleColor={salesStats.current_month_expense_percentage > 0 ? '#ef4444' : undefined}
                  />
                  <ReportCard
                    title="Penjualan hari ini"
                    amount={formatCurrency(salesStats.today_sales)}
                    subtitle={`${formatPercentage(
                      salesStats.today_percentage
                    )} `}
                    subtitleColor={salesStats.today_percentage > 0 ? '#10b981' : undefined}
                  />
                  <ReportCard
                    title="Pengeluaran hari ini"
                    amount={formatCurrency(salesStats.today_expenses)}
                    subtitle={`${formatPercentage(
                      salesStats.today_expense_percentage
                    )} `}
                    subtitleColor={salesStats.today_expense_percentage > 0 ? '#ef4444' : undefined}
                  />
                </>
              ) : (
                <>
                  <ReportCard
                    title={`Penjualan ${getCurrentMonthName()}`}
                    amount="Rp0"
                    subtitle="0% vs bulan lalu"
                  />
                  <ReportCard
                    title="Pengeluaran bulan ini"
                    amount="Rp0"
                    subtitle="0% vs bulan lalu"
                  />
                  <ReportCard
                    title="Penjualan hari ini"
                    amount="Rp0"
                    subtitle="0% vs kemarin"
                  />
                  <ReportCard
                    title="Pengeluaran hari ini"
                    amount="Rp0"
                    subtitle="0% vs kemarin"
                  />
                </>
              )}
            </ScrollView>
          </View>
          <View style={styles.quickActionRow}>
            {hasPermission('transaction') && (
              <MenuItem
                label="Transaksi"
                icon="swap-horizontal-outline"
                onPress={() => {
                  router.push("/dashboard/transaction" as never);
                }}
              />
            )}
            {hasPermission('reports') && (
              <MenuItem
                label="Riwayat"
                icon="receipt-outline"
                onPress={() => {
                  router.push("/dashboard/transaction/history" as never);
                }}
              />
            )}
            {hasPermission('reports') && (
              <MenuItem
                label="Laporan"
                icon="bar-chart-outline"
                onPress={() => {
                  router.push("/dashboard/home/report" as never);
                }}
              />
            )}
            {hasPermission('products') && (
              <MenuItem
                label="Kelola Produk"
                icon="bag-handle-outline"
                onPress={() => {
                  router.push("/dashboard/product/manage" as never);
                }}
              />
            )}
            {hasPermission('categories') && (
              <MenuItem
                label="Kategori"
                icon="grid-outline"
                onPress={() => {
                  router.push("/dashboard/category/manage" as never);
                }}
              />
            )}
            {hasPermission('customers') && (
              <MenuItem
                label="Pelanggan"
                icon="people-outline"
                onPress={() => {
                  router.push("/dashboard/customer/manage" as never);
                }}
              />
            )}
            {hasPermission('suppliers') && (
              <MenuItem
                label="Supplier"
                icon="bus-outline"
                onPress={() => {
                  router.push("/dashboard/supplier/manage" as never);
                }}
              />
            )}
            <MenuItem
              label="Stok History"
              icon="sync-outline"
              onPress={() => {
                router.push("/dashboard/stock-history" as never);
              }}
              disabled={isBasic}
            />
            {hasPermission('employees') && (
              <MenuItem
                label="Pegawai"
                icon="id-card-outline"
                onPress={() => {
                  router.push("/dashboard/employee" as never);
                }}
              />
            )}
            {hasPermission('outlets') && (
              <MenuItem
                label="Outlet"
                icon="storefront-outline"
                onPress={() => {
                  router.push("/dashboard/outlet" as never);
                }}
                disabled={!isPro}
              />
            )}
            <MenuItem
              label="Profil"
              icon="person-circle-outline"
              onPress={() => {
                router.push("/dashboard/setting/profile" as never);
              }}
            />
            {hasPermission('settings') && (
              <MenuItem
                label="Pengaturan"
                icon="settings-outline"
                onPress={() => {
                  router.push("/dashboard/setting" as never);
                }}
              />
            )}
            <MenuItem
              label="Bantuan"
              icon="help-circle-outline"
              onPress={() => {
                router.push("/dashboard/help" as never);
              }}
            />
          </View>

          <View style={styles.sectionCard}>
            <ThemedText type="subtitle-2" style={{ marginBottom: 10 }}>
              Perangkat Tambahan
            </ThemedText>
            <Image
              source={require("@/assets/banners/device-offer.png")}
              style={styles.bannerImage}
            />
          </View>
        </View>
      </ScrollView>

      {(!isTabletLandscape || (isTabletLandscape && hasScrolledDown)) && hasPermission('transaction') && (
        <View style={styles.bottomButtonWrapper}>
          <ThemedButton
            title="Transaksi"
            onPress={() => {
              router.push("/dashboard/transaction" as never);
            }}
          />
        </View>
      )}

      <Sidebar
        activeKey={activeMenu}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onSelect={key => setActiveMenu(key as DashboardMenuKey)}
      />
    </View>
  );
};

const MenuItem = ({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: any;
  onPress?: () => void;
  disabled?: boolean;
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const styles = menuItemStyles(colorScheme, isTablet);
  const baseIconSize = icon == "help-circle-outline" ? 24 : 24;
  const iconSize = isTablet ? baseIconSize + 20 : baseIconSize;

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      style={[
        styles.wrapper,
        disabled && styles.disabledWrapper
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.iconContainer}>
        <View style={[
          styles.iconWrapper,
          disabled && styles.disabledIconWrapper
        ]}>
          <Ionicons
            name={icon}
            size={iconSize}
            color={disabled ? Colors[colorScheme].icon : Colors[colorScheme].primary}
          />
        </View>
        {disabled && (
          <View style={styles.badgeOverlay}>
            <ProBadge size="small" />
          </View>
        )}
      </View>
      <ThemedText style={[
        styles.label,
        disabled && styles.disabledLabel
      ]} numberOfLines={2}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

const createStyles = (
  colorScheme: "light" | "dark",
  isTablet: boolean,
  isTabletLandscape: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
      paddingBottom: isTabletLandscape ? 80 : 20,
    },
    scrollContainer: {
      paddingHorizontal: isTablet ? 24 : 8,
      // paddingBottom: isTablet ? 120 : 96,
    },
    contentWrapper: {
      width: "100%",
      maxWidth: isTabletLandscape ? 960 : undefined,
      alignSelf: "center",
    },
    headerIconButton: {
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    notificationBadge: {
      position: "absolute",
      top: isTablet ? -4 : -2,
      right: isTablet ? -6 : -4,
      backgroundColor: "#FF3B30",
      padding: 0,
      borderRadius: isTablet ? 11 : 8,
      minWidth: isTablet ? 22 : 14,
      display: "flex",
      height: isTablet ? 22 : 14,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: isTablet ? 5 : 3,
    },
    notificationBadgeText: {
      color: "white",
      fontSize: isTablet ? 12 : 8,
      fontWeight: "700",
      lineHeight: isTablet ? 18 : 12,
      textAlign: "center",
    },
    title: {
      marginBottom: 8,
      fontSize: isTablet ? 22 : 18,
      fontWeight: "bold",
    },
    amountText: {
      fontSize: isTablet ? 22 : 14,
      fontWeight: "bold",
    },

    skeletonSubtitle: {
      width: 110,
      height: 12,
      borderRadius: 6,
      backgroundColor: Colors[colorScheme].icon,
      opacity: 0.16,
    },
    reportCardContainer: {
      gap: 12,
      flexDirection: "row",
    },
    reportCardTitle: {
      fontSize: isTablet ? 18 : 12,
      fontWeight: "regular",
    },
    menuRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      flexWrap: "wrap",
      marginBottom: 16,
    },
    sectionCard: {
      backgroundColor:
        colorScheme === "dark" ? "#1f2122" : Colors[colorScheme].secondary,
      borderRadius: 12,
      padding: isTablet ? 16 : 12,
      marginBottom: isTablet ? 12 : 8,
    },
    bannerImage: {
      width: "auto",
      borderRadius: 12,
      // marginTop: 8,
      height: isTablet ? 160 : 120,
      resizeMode: "cover",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: isTablet ? 16 : 12,
    },
    linkContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    link: {
      color: Colors[colorScheme].primary,
      fontSize: isTablet ? 16 : 14,
    },
    outletNameText: {
      color: Colors[colorScheme].primary,
      fontSize: isTablet ? 16 : 14,
    },
    quickActionRow: {
      flexDirection: "row",
      alignItems: "stretch",
      flexWrap: "wrap",
      marginBottom: 12,
      justifyContent: "flex-start",
    },
    reportCard: {
      width: isTablet ? "30%" : "38%", // kira-kira 2 item per layar di phone, lebih leluasa di tablet
      minHeight: 90,
      backgroundColor:
        colorScheme === "dark" ? "#202325" : Colors[colorScheme].background,
      borderRadius: 10,
      borderColor:
        colorScheme === "dark" ? "#262a2d" : Colors[colorScheme].border,
      borderWidth: 1,
      padding: 10,
    },
    mutedText: {
      color: Colors[colorScheme].icon,
      marginTop: 4,
      fontSize: isTablet ? 16 : 12,
    },
    activeOutletWrapper: {
      marginBottom: 4,
      paddingVertical: isTablet ? 12 : 8,
      paddingHorizontal: isTablet ? 16 : 12,
    },
    activeOutletTitle: {
      fontSize: isTablet ? 20 : 16,
    },
    activeOutletMutedText: {
      color: Colors[colorScheme].icon,
      fontSize: isTablet ? 18 : 14,
      marginBottom: isTablet ? 8 : 8,
    },
    subscriptionBanner: {
      marginTop: 8,
      padding: isTablet ? 16 : 12,
      borderRadius: 10,
      backgroundColor: Colors[colorScheme].tint,
    },
    deviceBanner: {
      marginTop: 8,
      padding: isTablet ? 16 : 12,
      borderRadius: 10,
      backgroundColor: Colors[colorScheme].secondary,
    },
    bottomButtonWrapper: {
      position: "absolute",
      left: isTablet ? 32 : 16,
      right: isTablet ? 32 : 16,
      bottom: isTablet ? 24 : 16,
    },
    secondaryMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    secondaryMenuIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colorScheme === "dark" ? "#1f2122" : Colors[colorScheme].secondary,
      marginRight: 10,
    },
    secondaryMenuLabel: {
      fontSize: 14,
      color: Colors[colorScheme].text,
    },
    secondaryMenuLabelActive: {
      color: Colors[colorScheme].primary,
      fontWeight: "600",
    },
    drawerOverlay: {
      ...StyleSheet.absoluteFill,
      flexDirection: "row",
      backgroundColor: "rgba(0,0,0,0.3)",
      zIndex: 3,
    },
    drawerBackdrop: {
      flex: 1,
    },
    drawer: {
      width: isTablet ? 320 : 260,
      backgroundColor: Colors[colorScheme].background,
    },
    disabledWrapper: {
      opacity: 0.5,
    },
    disabledIconWrapper: {
      backgroundColor: Colors[colorScheme].background,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    disabledLabel: {
      color: Colors[colorScheme].icon,
    },
    disabledText: {
      color: Colors[colorScheme].icon,
    },
    disabledLink: {
      opacity: 0.5,
    },
  });

const menuItemStyles = (colorScheme: "light" | "dark", isTablet: boolean) =>
  StyleSheet.create({
    wrapper: {
      alignItems: "center",
      marginBottom: 4,
      marginHorizontal: 2,
      paddingVertical: isTablet ? 8 : 4,
      paddingHorizontal: isTablet ? 14 : 10,
      borderRadius: 12,
      width: isTablet ? "22%" : "23%",
    },
    disabledWrapper: {
      opacity: 0.5,
    },
    iconWrapper: {
      borderRadius: 10,
      backgroundColor:
        colorScheme === "dark" ? "#1f2122" : Colors[colorScheme].secondary,
      marginBottom: 2,
      padding: isTablet ? 12 : 8,
      // borderWidth: 1,
      // borderColor: Colors[colorScheme].border,
    },
    disabledIconWrapper: {
      backgroundColor: Colors[colorScheme].background,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    label: {
      fontSize: isTablet ? 16 : 11,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: isTablet ? 18 : 13,
      color: Colors[colorScheme].text,
    },
    disabledLabel: {
      color: Colors[colorScheme].icon,
    },
    iconContainer: {
      position: 'relative',
      alignSelf: 'center',
    },
    badgeOverlay: {
      position: 'absolute',
      top: -4,
      right: -4,
      zIndex: 1,
    },
  });

export default DashboardScreen;
