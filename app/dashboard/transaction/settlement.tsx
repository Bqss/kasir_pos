"use client";

import Header from "@/components/header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePrinterDevice } from "@/hooks/use-printer-device";
import { settingsApi, StoreInfo, StruckConfig } from "@/services";
import { transactionApi } from "@/services/endpoints/transactions";
import { printKitchenReceipt, printReceipt } from "@/services/receipt";
import { useBranchStore } from "@/stores/branch-store";
import { useCartStore } from "@/stores/cart-store";
import { Transaction } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

let BluetoothManager: any = null;
if (Platform.OS !== "web" && typeof window !== "undefined") {
  try {
    BluetoothManager = require("@vardrz/react-native-bluetooth-escpos-printer").BluetoothManager;
  } catch (e) {
    console.warn("[settlement] BluetoothManager not available:", e);
  }
}

type TransactionResult = Transaction;

export default function TransactionSettlementPage() {
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const styles = createStyles(colorScheme, isTablet, isTabletLandscape);
  const router = useRouter();
  const params = useLocalSearchParams();

  const { getTotalAmount, clearCart } = useCartStore();

  const { currentBranchId, currentBranchData } = useBranchStore();
  const { savedDevice } = usePrinterDevice();

  const [transaction, setTransaction] = useState<TransactionResult | null>(
    null
  );
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [struckConfig, setStruckConfig] = useState<StruckConfig | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // Parse transaction data from params, then fetch full detail from API using id
    const fetchTransaction = async () => {
      if (!params.transaction) return;

      try {
        const txnData = JSON.parse(params.transaction as string);

        if (txnData?.id) {
          try {
            const response = await transactionApi.getTransaction(
              String(txnData.id),
            );

            if (response.data) {
              setTransaction(response.data);
              return;
            }
          } catch (error) {
            console.error("Failed to fetch transaction from API:", error);
          }
        }

        setTransaction(txnData);
      } catch (error) {
        console.error("Failed to parse transaction data:", error);
      }
    };

    fetchTransaction();
  }, [params.transaction]);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await settingsApi.getStoreInfo();
        if (response.data) {
          setStore(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch store info:", error);
      }
    };

    fetchStore();
  }, []);

  useEffect(() => {
    const fetchStruckConfig = async () => {
      try {
        // Get branchId from store
        if (!currentBranchId) {
          console.log("No branchId found, skipping struck config fetch");
          return;
        }

        const response = await settingsApi.getStruckConfig(currentBranchId);
        console.log("struk config", response.data)
        if (response.data) {
          setStruckConfig(response.data);
        }
      } catch (error: any) {
        // Silently handle 404 as it's expected when config is not set up
        if (error.code === 404) {
          console.log("Struck config not found for branch, using defaults");
        } else {
          console.error("Failed to fetch struck config:", error);
        }
      }
    };

    if (transaction) {
      fetchStruckConfig();
    }
  }, [transaction, currentBranchId]);

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      cash: "Tunai",
      debt: "Utang",
      qris: "QRIS",
      grab: "Grab",
      shopee_food: "ShopeeFood",
      bank_transfer: "Transfer Bank",
      e_wallet: "E-Wallet",
      credit_card: "Kartu Kredit",
      debit_card: "Kartu Debit",
    };
    return labels[method] || method;
  };

  const paymentMethod = getPaymentMethodLabel(transaction?.paymentMethod || "");
  const totalTagihan = transaction?.totalAmount || 0;
  const subtotal = (transaction as any)?.sub_total || totalTagihan; // Use sub_total if available
  const diterima = transaction?.paidAmount || 0;
  const kembali = transaction?.changeAmount || 0;
  const transactionDate = transaction?.createdAt
    ? new Date(transaction.createdAt).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "-";

  const formatCurrency = (value: number) => {
    if (!value) return "0";
    const intPart = Math.floor(value).toString();
    const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return withDots;
  };

  const handlePrintReceipt = async () => {
    if (!transaction) {
      return;
    }

    if (!savedDevice) {
      Alert.alert(
        "Error",
        "Printer belum dipilih. Silakan pilih dan simpan printer terlebih dahulu.",
      );
      return;
    }

    if (!BluetoothManager) {
      Alert.alert(
        "Error",
        "Module Bluetooth tidak tersedia. Pastikan native module sudah ter-link.",
      );
      return;
    }

    setIsPrinting(true);

    try {
      console.log(
        "[TransactionSettlementPage] Connecting via BluetoothManager to:",
        savedDevice.address,
      );

      const isConnected = await BluetoothManager.isBluetoothEnabled();
      if (!isConnected) {
        await BluetoothManager.enableBluetooth();
      }

      await BluetoothManager.connect(savedDevice.address).then(async () => {
        await printReceipt({
          transaction,
          store,
          subtotal: subtotal,
          dibayar: diterima,
          kembalian: kembali,
          transactionDate,
          paymentMethod,
          formatCurrency,
          struckConfig,
        });
      });



      Alert.alert("Berhasil", "Struk berhasil dikirim ke printer.");
    } catch (e: any) {
      console.error("[TransactionSettlementPage] Print error:", e);
      Alert.alert(
        "Gagal",
        e?.message ?? "Gagal mencetak. Pastikan printer terhubung dengan benar.",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintKitchenReceipt = async () => {
    if (!transaction) {
      return;
    }

    if (!savedDevice) {
      Alert.alert(
        "Error",
        "Printer belum dipilih. Silakan pilih dan simpan printer terlebih dahulu.",
      );
      return;
    }

    if (!BluetoothManager) {
      Alert.alert(
        "Error",
        "Module Bluetooth tidak tersedia. Pastikan native module sudah ter-link.",
      );
      return;
    }

    setIsPrinting(true);

    try {
      const isConnected = await BluetoothManager.isBluetoothEnabled();
      if (!isConnected) {
        await BluetoothManager.enableBluetooth();
      }

      await BluetoothManager.connect(savedDevice.address).then(async () => {
        await printKitchenReceipt({
          transaction,
          store,
          transactionDate,
          paymentMethod,
          formatCurrency,
          struckConfig,
        });
      });

      Alert.alert("Berhasil", "Struk dapur berhasil dikirim ke printer.");
    } catch (e: any) {
      console.error("[TransactionSettlementPage] Print kitchen error:", e);
      Alert.alert(
        "Gagal",
        e?.message ?? "Gagal mencetak. Pastikan printer terhubung dengan benar.",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareReceipt = async () => {
    try {
      const message = `Transaksi Berhasil\n\nNo: ${transaction?.invoiceNumber || "-"
        }\nTotal: Rp ${formatCurrency(totalTagihan)}\nBayar: Rp ${formatCurrency(
          diterima
        )}\nKembali: Rp ${formatCurrency(
          kembali
        )}\nMetode: ${paymentMethod}\nWaktu: ${transactionDate}`;

      await Share.share({
        message: message,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleNewTransaction = () => {
    clearCart();
    router.replace("/dashboard/transaction");
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <Header
        showBack
        showHelp={false}
        title="Pembayaran Berhasil"
        withNotificationButton={false}
      />
      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.statusWrapper}>
            <View style={styles.statusIconWrapper}>
              <Ionicons
                name="checkmark"
                size={isTablet ? 56 : 40}
                color={Colors[colorScheme].primary}
              />
            </View>

            <Text style={styles.successTitle}>Transaksi Berhasil</Text>
            <Text style={styles.successSubtitle}>{transactionDate}</Text>
            {transaction?.invoiceNumber && (
              <Text style={[styles.successSubtitle, { marginTop: 4 }]}>
                #{transaction.invoiceNumber}
              </Text>
            )}
          </View>

          <View style={styles.detailWrapper}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pembayaran</Text>
              <Text style={styles.detailValue}>{paymentMethod}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Tagihan</Text>
              <Text style={styles.detailValue}>
                Rp{formatCurrency(totalTagihan)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Diterima</Text>
              <Text style={styles.detailValue}>Rp{formatCurrency(diterima)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Kembali</Text>
              <Text style={styles.detailValue}>Rp{formatCurrency(kembali)}</Text>
            </View>
          </View>

          <View style={styles.bottomWrapper}>
            <View style={[styles.topButtonsRow, { marginBottom: 16 }]}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  handlePrintKitchenReceipt();
                }}
              >
                <Text style={styles.secondaryButtonText}>{isPrinting ? "Mencetak..." : "Cetak Struk Dapur"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.topButtonsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  // TODO: Implement print functionality
                  handlePrintReceipt();
                }}
              >
                <Text style={styles.secondaryButtonText}>{isPrinting ? "Mencetak..." : "Cetak Struk"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  if (transaction) {
                    router.push(`/dashboard/transaction/${transaction.id}/share-struck`);
                  } else {
                    handleShareReceipt();
                  }
                }}
              >
                <Text style={styles.secondaryButtonText}>Kirim Struk</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: Colors[colorScheme].primary },
              ]}
              onPress={handleNewTransaction}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: "white" },
                ]}
              >
                Transaksi Baru
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colorScheme: "light" | "dark", isTablet: boolean, isTabletLandscape: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollWrapper: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: isTablet ? 24 : 16,
    },
    contentWrapper: {
      flex: 1,
      width: "100%",
      maxWidth: isTabletLandscape ? 960 : undefined,
      alignSelf: "center",
      paddingTop: isTablet ? 56 : 40,
      alignItems: "center",
    },
    statusWrapper: {
      alignItems: "center",
      marginBottom: isTablet ? 48 : 32,
    },
    statusIconWrapper: {
      width: isTablet ? 120 : 96,
      height: isTablet ? 120 : 96,
      borderRadius: isTablet ? 60 : 48,
      borderWidth: isTablet ? 5 : 4,
      borderColor: Colors[colorScheme].primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isTablet ? 32 : 24,
    },
    successTitle: {
      fontSize: isTablet ? 28 : 22,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: isTablet ? 10 : 6,
    },
    successSubtitle: {
      fontSize: isTablet ? 18 : 14,
      color: Colors[colorScheme].icon,
    },
    detailWrapper: {
      width: "100%",
      maxWidth: isTablet ? 500 : undefined,
      marginTop: isTablet ? 48 : 32,
      rowGap: isTablet ? 20 : 16,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    detailLabel: {
      fontSize: isTablet ? 18 : 15,
      color: Colors[colorScheme].icon,
    },
    detailValue: {
      fontSize: isTablet ? 18 : 15,
      fontWeight: "600",
      color: Colors[colorScheme].text,
    },
    bottomWrapper: {
      width: "100%",
      paddingVertical: isTablet ? 24 : 20,
      marginTop: isTablet ? 48 : 32,
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme].border,
      rowGap: isTablet ? 16 : 12,
    },
    topButtonsRow: {
      flexDirection: "row",
      columnGap: isTablet ? 16 : 12,
    },
    secondaryButton: {
      flex: 1,
      height: isTablet ? 56 : 48,
      borderRadius: isTablet ? 10 : 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
      backgroundColor: Colors[colorScheme].secondary,
    },
    secondaryFullButton: {
      width: "100%",
      height: isTablet ? 56 : 48,
      borderRadius: isTablet ? 10 : 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
      backgroundColor: Colors[colorScheme].secondary,
    },
    secondaryButtonText: {
      fontSize: isTablet ? 18 : 14,
      fontWeight: "600",
      color: Colors[colorScheme].text,
    },
    primaryButton: {
      width: "100%",
      height: isTablet ? 60 : 52,
      borderRadius: isTablet ? 10 : 8,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      fontSize: isTablet ? 20 : 16,
      fontWeight: "700",
    },
  });
