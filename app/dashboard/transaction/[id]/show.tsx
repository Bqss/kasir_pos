"use client";

import CheckoutItem from "@/components/atoms/checkout-item";
import Header from "@/components/header";
import { ThemedButton } from "@/components/themed-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePrinterDevice } from "@/hooks/use-printer-device";
import { settingsApi, StoreInfo, StruckConfig } from "@/services";
import { transactionApi } from "@/services/endpoints/transactions";
import { printKitchenReceipt, printReceipt } from "@/services/receipt";
import { useBranchStore } from "@/stores/branch-store";
import { Transaction } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

let BluetoothManager: any = null;
if (Platform.OS !== "web" && typeof window !== "undefined") {
    try {
        BluetoothManager = require("@vardrz/react-native-bluetooth-escpos-printer").BluetoothManager;
    } catch (e) {
        console.warn("[TransactionDetail] BluetoothManager not available:", e);
    }
}

export default function TransactionDetailPage() {
    const colorScheme = useColorScheme() ?? "light";
    const { width, height } = useWindowDimensions();
    const isTablet = Math.min(width, height) >= 600;
    const styles = createStyles(colorScheme, isTablet);
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { currentBranchId, currentBranchData } = useBranchStore();
    const { savedDevice, connectedDeviceInstance, connectToDevice } = usePrinterDevice();

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const [store, setStore] = useState<StoreInfo | null>(null);
    const [struckConfig, setStruckConfig] = useState<StruckConfig | null>(null);

    useEffect(() => {
        const fetchTransaction = async () => {
            if (id) {
                try {
                    setIsLoading(true);
                    const response = await transactionApi.getTransaction(id);
                    if (response.data) {
                        setTransaction(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch transaction:", error);
                    Alert.alert("Error", "Gagal memuat detail transaksi");
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchTransaction();
    }, [id]);

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

    const items = transaction?.items || [];

    const formatCurrency = (value: number) => {
        if (!value) return "0";
        const intPart = Math.floor(value).toString();
        const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return withDots;
    };

    const subtotal = (transaction as any)?.sub_total || transaction?.totalAmount || 0;
    const total = (transaction as any)?.total || transaction?.totalAmount || 0;
    const totalProduk = items.reduce((sum, item) => sum + item.quantity, 0);
    const dibayar = transaction?.paidAmount || 0;
    const kembalian = transaction?.changeAmount || 0;

    const transactionDate = transaction?.createdAt
        ? new Date(transaction.createdAt).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "-";

    const paymentMethod =
        transaction?.paymentMethod === "cash" ? "Tunai" : "Hutang";

    const handlePrintKitchen = async () => {
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

            await BluetoothManager.connect(savedDevice.address);

            await printKitchenReceipt({
                transaction,
                store,
                transactionDate,
                paymentMethod,
                formatCurrency,
                struckConfig
            });

            Alert.alert("Berhasil", "Struk dapur berhasil dikirim ke printer.");
        } catch (e: any) {
            console.error("[TransactionDetailPage] Print kitchen error:", e);
            Alert.alert(
                "Gagal",
                e?.message ?? "Gagal mencetak. Pastikan printer terhubung dengan benar.",
            );
        } finally {
            setIsPrinting(false);
        }
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
                "[TransactionDetailPage] Connecting via BluetoothManager to:",
                savedDevice.address,
            );

            // Pastikan terkoneksi ke printer via library ESC/POS baru
            const isConnected = await BluetoothManager.isBluetoothEnabled();
            if (!isConnected) {
                await BluetoothManager.enableBluetooth();
            }

            await BluetoothManager.connect(savedDevice.address).finally(() => {
                console.log("[TransactionDetailPage] Connected to printer");
            });

            await printReceipt({
                transaction,
                store,
                subtotal,
                dibayar,
                kembalian,
                transactionDate,
                paymentMethod,
                formatCurrency,
                struckConfig,
            });

            Alert.alert("Berhasil", "Struk berhasil dikirim ke printer.");
        } catch (e: any) {
            console.error("[TransactionDetailPage] Print error:", e);
            Alert.alert(
                "Gagal",
                e?.message ?? "Gagal mencetak. Pastikan printer terhubung dengan benar.",
            );
        } finally {
            setIsPrinting(false);
        }
    };

    const handleCancelTransaction = () => {
        Alert.alert(
            "Batalkan Transaksi",
            "Yakin ingin membatalkan transaksi ini?",
            [
                { text: "Tidak", style: "cancel" },
                {
                    text: "Ya, Batalkan",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (transaction?.id) {
                                await transactionApi.cancelTransaction(transaction.id);
                                Alert.alert("Berhasil", "Transaksi dibatalkan");
                                router.back();
                            }
                        } catch (error) {
                            Alert.alert("Error", "Gagal membatalkan transaksi");
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View
                style={[
                    styles.container,
                    { backgroundColor: Colors[colorScheme].background },
                ]}
            >
                <Header showBack={true} showHelp={false} title="Detail Transaksi" />
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                    <Text style={{ marginTop: 16, color: Colors[colorScheme].text }}>
                        Memuat detail transaksi...
                    </Text>
                </View>
            </View>
        );
    }

    if (!transaction) {
        return (
            <View
                style={[
                    styles.container,
                    { backgroundColor: Colors[colorScheme].background },
                ]}
            >
                <Header showBack={true} showHelp={false} title="Detail Transaksi" />
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: Colors[colorScheme].text }}>
                        Transaksi tidak ditemukan
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: Colors[colorScheme].background },
            ]}
        >
            <Header
                showBack={true}
                showHelp={false}
                title={`#${transaction.invoiceNumber || "Detail"}`}
            />

            <ScrollView
                style={styles.contentWrapper}
                contentContainerStyle={styles.contentInner}
            >
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRowPrimary}>
                        <Text style={styles.sectionTitle}>Detail Transaksi</Text>
                        <Text style={styles.sectionCode}>#{transaction.invoiceNumber}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoWrapper}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tipe Pembayaran</Text>
                            <Text style={styles.infoValue}>{paymentMethod}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <Text style={styles.infoValue}>{transaction.paymentStatus}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tanggal Transaksi</Text>
                            <Text style={styles.infoValue}>{transactionDate}</Text>
                        </View>
                        <View style={styles.buttonStack}>
                            <ThemedButton
                                title="Batalkan"
                                size="medium"
                                variant="secondary"
                                onPress={handleCancelTransaction}
                            />
                            <ThemedButton
                                title="Kirim Struk"
                                size="medium"
                                variant="secondary"
                                onPress={() =>
                                    router.push(`/dashboard/transaction/${transaction.id}/share-struck`)
                                }
                            />
                            <ThemedButton
                                title={isPrinting ? "Mencetak..." : "Cetak Struk Dapur"}
                                size="medium"
                                variant="secondary"
                                onPress={handlePrintKitchen}
                                disabled={isPrinting}
                            />
                            <ThemedButton
                                title={isPrinting ? "Mencetak..." : "Cetak Struk"}
                                size="medium"
                                variant="primary"
                                onPress={handlePrintReceipt}
                                disabled={isPrinting}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.sectionCard2}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                            styles.sectionHeaderRowSecondary,
                            isDetailOpen
                                ? {
                                    borderBottomWidth: 1,
                                    borderBottomColor: Colors[colorScheme].border,
                                }
                                : {},
                        ]}
                        onPress={() => setIsDetailOpen(prev => !prev)}
                    >
                        <Text style={styles.sectionTitle}>Detail Pembelian</Text>
                        <Ionicons
                            name={
                                isDetailOpen ? "chevron-up-outline" : "chevron-down-outline"
                            }
                            size={isTablet ? 24 : 18}
                            color={Colors[colorScheme].icon}
                        />
                    </TouchableOpacity>

                    {isDetailOpen && (
                        <>
                            <View style={styles.itemsWrapper}>
                                {items.map((item, index) => (
                                    <CheckoutItem
                                        key={item.id || index}
                                        index={index + 1}
                                        name={item.productName}
                                        quantity={item.quantity}
                                        unitPrice={item.price}
                                        hideDeleteButton
                                        isTablet={isTablet}
                                    />
                                ))}

                                {/* Biaya Tambahan (fees + ingredients) */}
                                {((transaction?.additional_fees && transaction.additional_fees.length > 0) ||
                                    (transaction?.additional_ingredients && transaction.additional_ingredients.length > 0)) ? (
                                    <>
                                        <View style={styles.sectionDivider}>
                                            <Text style={styles.sectionDividerText}>Biaya Tambahan</Text>
                                        </View>
                                        {transaction?.additional_fees?.map((fee, index) => (
                                            <CheckoutItem
                                                key={`fee-${index}`}
                                                index={items.length + index + 1}
                                                name={fee.name}
                                                quantity={1}
                                                unitPrice={fee.amount}
                                                hideDeleteButton
                                                isTablet={isTablet}
                                            />
                                        ))}
                                        {transaction?.additional_ingredients?.map((ing, index) => {
                                            const ingredientName = ing.variant?.product?.name !== ing.variant?.name
                                                ? `${ing.variant?.product?.name} - ${ing.variant?.name}`
                                                : ing.variant?.product?.name || ing.variant?.name || 'Bahan';
                                            return (
                                                <CheckoutItem
                                                    key={`ing-${ing.id || index}`}
                                                    index={items.length + (transaction?.additional_fees?.length || 0) + index + 1}
                                                    name={ingredientName}
                                                    quantity={ing.quantity}
                                                    unitPrice={ing.price}
                                                    hideDeleteButton
                                                    isTablet={isTablet}
                                                />
                                            );
                                        })}
                                    </>
                                ) : null}
                            </View>
                            <View style={styles.summaryWrapper}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>
                                        Rp {formatCurrency(subtotal)}
                                    </Text>
                                </View>
                                {transaction?.tax && transaction.tax > 0 && (
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Pajak</Text>
                                        <Text style={styles.summaryValue}>
                                            Rp {formatCurrency(transaction.tax)}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>
                                        Total ({totalProduk} Produk)
                                    </Text>
                                    <Text style={styles.summaryValue}>
                                        Rp {formatCurrency(total)}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Dibayar</Text>
                                    <Text style={styles.summaryValue}>
                                        Rp {formatCurrency(dibayar)}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Kembalian</Text>
                                    <Text style={styles.summaryValue}>
                                        Rp {formatCurrency(kembalian)}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (colorScheme: "light" | "dark", isTablet: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        contentWrapper: {
            flex: 1,
        },
        contentInner: {
            paddingHorizontal: isTablet ? 60 : 16,
            paddingVertical: isTablet ? 24 : 16,
            rowGap: isTablet ? 20 : 16,
        },
        sectionCard: {
            borderRadius: isTablet ? 16 : 12,
            backgroundColor: Colors[colorScheme].background,
            borderWidth: 1,
            borderColor: Colors[colorScheme].border,
            paddingVertical: isTablet ? 20 : 16,
        },
        infoWrapper: {
            padding: isTablet ? 20 : 16,
        },
        sectionCard2: {
            borderRadius: isTablet ? 16 : 12,
            backgroundColor: Colors[colorScheme].background,
            borderWidth: 1,
            borderColor: Colors[colorScheme].border,
        },
        sectionHeaderRowPrimary: {
            flexDirection: "row",
            alignItems: "center",
            paddingBottom: isTablet ? 20 : 16,
            paddingHorizontal: isTablet ? 20 : 16,
            justifyContent: "space-between",
        },
        sectionHeaderRowSecondary: {
            flexDirection: "row",
            padding: isTablet ? 20 : 16,
            alignItems: "center",
            justifyContent: "space-between",
        },
        sectionTitle: {
            fontSize: isTablet ? 20 : 14,
            fontWeight: "600",
            color: Colors[colorScheme].text,
        },
        sectionCode: {
            fontSize: isTablet ? 20 : 14,
            fontWeight: "500",
            color: Colors[colorScheme].icon,
        },
        divider: {
            height: 1,
            backgroundColor: Colors[colorScheme].border,
        },
        infoRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: isTablet ? 12 : 8,
        },
        infoLabel: {
            fontSize: isTablet ? 20 : 13,
            color: Colors[colorScheme].icon,
        },
        infoValue: {
            fontSize: isTablet ? 20 : 13,
            fontWeight: "500",
            color: Colors[colorScheme].text,
        },
        buttonStack: {
            marginTop: isTablet ? 20 : 16,
            rowGap: isTablet ? 14 : 10,
        },
        headerIconButton: {
            paddingHorizontal: isTablet ? 12 : 8,
            paddingVertical: isTablet ? 8 : 6,
        },
        outlineButton: {
            width: "100%",
            height: isTablet ? 52 : 44,
            borderRadius: isTablet ? 12 : 8,
            borderWidth: 1,
            borderColor: Colors[colorScheme].border,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors[colorScheme].secondary,
        },
        outlineButtonText: {
            fontSize: isTablet ? 20 : 14,
            fontWeight: "600",
            color: Colors[colorScheme].text,
        },
        primaryButton: {
            width: "100%",
            height: isTablet ? 52 : 44,
            borderRadius: isTablet ? 12 : 8,
            alignItems: "center",
            justifyContent: "center",
        },
        primaryButtonText: {
            fontSize: isTablet ? 20 : 14,
            fontWeight: "600",
        },
        sectionDivider: {
            paddingVertical: isTablet ? 12 : 8,
            paddingLeft: isTablet ? 12 : 8,
            marginTop: isTablet ? 8 : 0,
        },
        sectionDividerText: {
            fontSize: isTablet ? 16 : 12,
            fontWeight: "600",
            color: Colors[colorScheme].icon,
        },
        itemsWrapper: {
            marginTop: isTablet ? 12 : 8,
            rowGap: isTablet ? 12 : 8,
        },
        summaryWrapper: {
            marginTop: isTablet ? 16 : 12,
            borderTopWidth: 1,
            borderColor: Colors[colorScheme].border2,
        },
        summaryRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: isTablet ? 20 : 16,
            paddingVertical: isTablet ? 16 : 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors[colorScheme].border2,
        },
        summaryLabel: {
            fontSize: isTablet ? 20 : 13,
            color: Colors[colorScheme].icon,
        },
        summaryValue: {
            fontSize: isTablet ? 20 : 13,
            fontWeight: "600",
            color: Colors[colorScheme].text,
        },
    });
