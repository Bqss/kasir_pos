import DeviceList from "@/components/atoms/device-list";
import Header from "@/components/header";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePrinterDevice } from "@/hooks/use-printer-device";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";

export default function PrinterScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const styles = createStyles(colorScheme, isTablet, isTabletLandscape);
  const navigation = useNavigation();
  const {
    devices,
    startScan,
    stopScan,
    isScanning,
    error,
    connectedDevice,
    connectToDevice,
    forgetDevice,
  } = usePrinterDevice();
  const [showScan, setShowScan] = React.useState(false);
  const router = useRouter();

  const refresh = React.useCallback(() => {
    startScan();
  }, [startScan]);

  const connect = async (d: { name: string; mac: string }) => {
    try {
      await connectToDevice(d.mac, d.name);
      setShowScan(false);
      stopScan();
      // Redirect to printer-test page after successful connection
      router.replace("/dashboard/setting/printer-test" as never);
    } catch {
      // error sudah ditangani di hook
    }
  };

  const handleDeletePrinter = () => {
    Alert.alert(
      "Hapus Printer",
      "Apakah Anda yakin ingin memutuskan dan menghapus printer ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await forgetDevice();
            setShowScan(false);
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        showScan ? (
          <TouchableOpacity onPress={refresh} style={{ paddingHorizontal: 8 }}>
            <Ionicons
              name="refresh"
              size={22}
              color={Colors[colorScheme].icon}
            />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, showScan, colorScheme, refresh]);

  return (
    <>
      <Header title="Printer" showHelp={false} />
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          {!connectedDevice && !showScan ? (
            <View style={styles.emptyStateWrapper}>
              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <Image
                  source={require("@/assets/ilustrations/printer-disconnected.png")}
                  style={styles.emptyImage}
                />
                <ThemedText style={styles.emptyTitle}>
                  Tidak Ada Printer Terhubung
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Pilih Tambah Printer untuk menghubungkan Printer.
                </ThemedText>
                <View style={{ marginTop: isTablet ? 24 : 16 }}>
                  <ThemedButton
                    title="Tambah Printer"
                    size={isTablet ? "base" : "medium"}
                    onPress={() => {
                      setShowScan(true);
                      startScan();
                    }}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {showScan ? (
            <View style={styles.sectionCard}>
              <ThemedText type="subtitle-2">Perangkat Tersedia</ThemedText>

              {!isScanning && devices.length === 0 ? (
                <View style={{ paddingVertical: isTablet ? 24 : 16 }}>
                  <ThemedText style={{ color: Colors[colorScheme].icon, fontSize: isTablet ? 18 : 14 }}>
                    Tidak ada perangkat ditemukan.
                  </ThemedText>
                  {error ? (
                    <ThemedText style={{ color: Colors[colorScheme].danger, fontSize: isTablet ? 18 : 14 }}>
                      {error}
                    </ThemedText>
                  ) : null}
                </View>
              ) : null}

              {devices.length > 0 ? (
                <DeviceList devices={devices} onConnect={connect} />
              ) : null}
              {isScanning ? (
                <View style={{ paddingVertical: isTablet ? 24 : 16, alignItems: "center" }}>
                  <ActivityIndicator color={Colors[colorScheme].primary} size={isTablet ? "large" : "small"} />
                  <ThemedText style={{ marginTop: isTablet ? 16 : 8, fontSize: isTablet ? 18 : 14 }}>
                    Memindai perangkat Bluetooth...
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}

          {connectedDevice ? (
            <View style={styles.sectionCard}>
              <ThemedText type="subtitle-2">Printer Terhubung</ThemedText>
              <View style={styles.printerRow}>
                <View style={styles.printerInfo}>
                  <Ionicons
                    name="bluetooth"
                    size={isTablet ? 28 : 22}
                    color={Colors[colorScheme].primary}
                  />
                  <View style={styles.printerTextContainer}>
                    <ThemedText style={styles.printerName}>
                      {connectedDevice.name ?? connectedDevice.address}
                    </ThemedText>
                    <ThemedText style={styles.printerMac}>
                      {connectedDevice.address}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity onPress={handleDeletePrinter} style={styles.deleteButton}>
                  <Ionicons
                    name="trash-outline"
                    size={isTablet ? 24 : 20}
                    color={Colors[colorScheme].danger}
                  />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <ThemedButton
                  title="Test Print"
                  size={isTablet ? "base" : "medium"}
                  onPress={() => router.push("/dashboard/setting/printer-test" as never)}
                  style={{ flex: 1 }}
                />
                <ThemedButton
                  title="Ganti Printer"
                  variant="secondary"
                  size={isTablet ? "base" : "medium"}
                  onPress={() => {
                    setShowScan(true);
                    startScan();
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </>

  );
}

const createStyles = (colorScheme: "light" | "dark", isTablet: boolean, isTabletLandscape: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: isTablet ? 60 : 20,
      backgroundColor: Colors[colorScheme].background,
    },
    contentWrapper: {
      width: "100%",
      maxWidth: isTabletLandscape ? 960 : undefined,
      alignSelf: "center",
      flex: 1,
    },
    sectionCard: {
      marginTop: isTablet ? 20 : 12,
      borderRadius: isTablet ? 12 : 8,
      backgroundColor: Colors[colorScheme].background,
      paddingHorizontal: isTablet ? 16 : 8,
      paddingVertical: isTablet ? 16 : 8,
    },
    printerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: isTablet ? 12 : 8,
      marginTop: isTablet ? 8 : 4,
    },
    printerInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: isTablet ? 14 : 10,
      flex: 1,
    },
    printerTextContainer: {
      flex: 1,
    },
    printerName: {
      fontWeight: "600",
      fontSize: isTablet ? 18 : 15,
    },
    printerMac: {
      color: Colors[colorScheme].icon,
      fontSize: isTablet ? 14 : 12,
      marginTop: 2,
    },
    deleteButton: {
      width: isTablet ? 44 : 36,
      height: isTablet ? 44 : 36,
      borderRadius: isTablet ? 10 : 8,
      backgroundColor: Colors[colorScheme].danger + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtons: {
      flexDirection: "row",
      gap: isTablet ? 12 : 8,
      marginTop: isTablet ? 16 : 12,
    },
    emptyStateWrapper: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: isTablet ? -60 : -40,
      flexDirection: "row",
      height: "100%",
    },
    emptyImage: {
      width: isTablet ? 400 : 300,
      height: isTablet ? 320 : 240,
      borderRadius: isTablet ? 16 : 10,
      resizeMode: "contain",
    },
    emptyTitle: {
      marginTop: isTablet ? 20 : 12,
      fontWeight: "700",
      fontSize: isTablet ? 22 : 16,
    },
    emptySubtitle: {
      marginTop: isTablet ? 8 : 4,
      textAlign: "center",
      color: Colors[colorScheme].icon,
      fontSize: isTablet ? 18 : 14,
    },
  });
