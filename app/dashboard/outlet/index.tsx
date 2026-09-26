import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Branch, branchApi } from "@/services/endpoints/branches";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type OutletItemProps = {
  name: string;
  isPrimary?: boolean;
  address: string;
  imageUrl?: string | null;
  styles: ReturnType<typeof createStyles>;
  isTablet: boolean;
  onPress?: () => void;
};

const OutletItem: React.FC<OutletItemProps> = ({
  name,
  isPrimary,
  address,
  imageUrl,
  styles,
  isTablet,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.outletCard}
      onPress={onPress}
    >
      <View style={styles.outletIconWrapper}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.outletImage}
            resizeMode="cover"
          />
        ) : (
          <AntDesign
            name="shop"
            size={isTablet ? 32 : 24}
            style={styles.outletIcon}
          />
        )}
      </View>

      <View style={styles.outletInfoWrapper}>
        <View style={styles.outletTitleRow}>
          <ThemedText style={styles.outletName}>{name}</ThemedText>
          {isPrimary && (
            <View style={styles.outletBadge}>
              <ThemedText style={styles.outletBadgeText}>Utama</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.outletAddress}>{address}</ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const SelectBranchScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const styles = createStyles(colorScheme, isTablet, isTabletLandscape);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstRender = useRef(true);
  const router = useRouter();

  // Fetch branches
  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await branchApi.getBranches(params);
      console.log(
        "📥 Fetched branches:",
        response.data?.length || 0,
        "outlets"
      );
      if (response.data) {
        setBranches(response.data);
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch branches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBranches();
    }, [])
  );

  // Debounced search - skip first render to avoid double fetch
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchBranches();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBranches();
    setRefreshing(false);
  };

  return (
    <>
      <Header
        showHelp={false}
        title="Manajemen outlet"
        withNotificationButton={false}
      />
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View
            style={[
              styles.searchWrapper,
              isSearchFocused && styles.searchWrapperFocused,
            ]}
          >
            <Ionicons
              name="search"
              size={isTablet ? 24 : 18}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Cari Outlet"
              placeholderTextColor="#A0A0A0"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>

          {isLoading && !refreshing ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ActivityIndicator
                size="large"
                color={Colors[colorScheme].primary}
              />
              <ThemedText
                style={{ marginTop: 16, color: Colors[colorScheme].icon }}
              >
                Memuat outlet...
              </ThemedText>
            </View>
          ) : branches.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ThemedText style={{ color: Colors[colorScheme].icon }}>
                {searchQuery ? "Outlet tidak ditemukan" : "Belum ada outlet"}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={branches}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <OutletItem
                  name={item.name}
                  isPrimary={item.status === "primary"}
                  address={`${item.village.name}, ${item.subdistrict.name}, ${item.city.name}`}
                  imageUrl={item.image_url}
                  styles={styles}
                  isTablet={isTablet}
                  onPress={() =>
                    router.push(`/dashboard/outlet/edit?id=${item.id}` as never)
                  }
                />
              )}
              contentContainerStyle={{ gap: isTablet ? 12 : 8 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors[colorScheme].primary]}
                  tintColor={Colors[colorScheme].primary}
                />
              }
            />
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.fab}
          onPress={() => router.push("/dashboard/outlet/add" as never)}
        >
          <AntDesign
            name="plus"
            size={isTablet ? 32 : 24}
            style={styles.fabIcon}
          />
        </TouchableOpacity>
      </View>
    </>
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
      paddingHorizontal: isTablet ? 60 : 16,
      backgroundColor: Colors[colorScheme].background,
    },
    contentWrapper: {
      width: "100%",
      maxWidth: isTabletLandscape ? 960 : undefined,
      alignSelf: "center",
    },
    searchWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: isTablet ? 16 : 12,
      borderWidth: 1,
      marginTop: isTablet ? 32 : 24,
      borderColor: Colors[colorScheme].border,
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 16 : 12,
      marginBottom: isTablet ? 24 : 16,
      backgroundColor: Colors[colorScheme].secondary,
    },
    searchWrapperFocused: {
      borderColor: Colors[colorScheme].primary,
    },
    searchIcon: {
      color: Colors[colorScheme].icon,
      marginRight: isTablet ? 12 : 8,
    },
    searchInput: {
      flex: 1,
      fontSize: isTablet ? 20 : 14,
      paddingVertical: 0,
    },
    outletCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: isTablet ? 20 : 12,
      paddingVertical: isTablet ? 18 : 12,
      borderRadius: isTablet ? 16 : 12,

      backgroundColor: Colors[colorScheme].secondary,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    outletIconWrapper: {
      width: isTablet ? 56 : 40,
      height: isTablet ? 56 : 40,
      borderRadius: isTablet ? 12 : 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors[colorScheme].border2,
      marginRight: isTablet ? 16 : 12,
    },
    outletIcon: {
      color: Colors[colorScheme].icon,
    },
    outletImage: {
      width: isTablet ? 56 : 40,
      height: isTablet ? 56 : 40,
      borderRadius: isTablet ? 12 : 8,
    },
    outletInfoWrapper: {
      flex: 1,
    },
    outletTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: isTablet ? 4 : 1,
      gap: isTablet ? 10 : 6,
    },
    outletName: {
      fontSize: isTablet ? 20 : 14,
      fontWeight: "600",
      color: Colors[colorScheme].text,
    },
    outletBadge: {
      paddingHorizontal: isTablet ? 12 : 8,
      paddingVertical: isTablet ? 2 : 0,
      borderRadius: 999,
      backgroundColor: Colors[colorScheme].primary,
    },
    outletBadgeText: {
      fontSize: isTablet ? 14 : 10,
      color: "white",
    },
    outletAddress: {
      fontSize: isTablet ? 18 : 12,
      lineHeight: isTablet ? 24 : 0,
      color: Colors[colorScheme].icon,
    },
    fab: {
      position: "absolute",
      right: isTablet ? 40 : 24,
      bottom: isTablet ? 40 : 24,
      width: isTablet ? 72 : 56,
      height: isTablet ? 72 : 56,
      borderRadius: isTablet ? 36 : 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors[colorScheme].primary,
      shadowColor: Colors[colorScheme].shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 6,
    },
    fabIcon: {
      color: "white",
    },
  });

export default SelectBranchScreen;
