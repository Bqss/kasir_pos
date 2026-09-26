import HelpPopup from "@/components/atoms/help-popup";
import ConfirmPopup from "@/components/atoms/confirm-popup";
import Header from "@/components/header";
import {ThemedButton} from "@/components/themed-button";
import {ThemedInput} from "@/components/themed-input";
import {ThemedText} from "@/components/themed-text";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {settingsApi, StruckConfig} from "@/services";
import {Ionicons} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {useEffect, useState} from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {ScrollView} from "react-native-gesture-handler";

export default function OrderReceiptSettingScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const {width, height} = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const styles = createStyles(colorScheme, isTablet, isTabletLandscape);

  const [struckConfig, setStruckConfig] = useState<StruckConfig | null>(null);
  const [displayRunningNumbers, setDisplayRunningNumbers] = useState(true);
  const [displayUnitNextToQty, setDisplayUnitNextToQty] = useState(true);
  const [showTransactionNote, setShowTransactionNote] = useState(true);
  const [displayQuantityTotal, setDisplayQuantityTotal] = useState(true);
  const [hideTaxPercentage, setHideTaxPercentage] = useState(false);

  const [headerDesc, setHeaderDesc] = useState("");
  const [footerDesc, setFooterDesc] = useState("");

  const [showHelpExtra, setShowHelpExtra] = useState(false);
  const [showHelpMessage, setShowHelpMessage] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [branchId, setBranchId] = useState<string>("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    loadBranchAndConfig();
  }, []);

  const loadBranchAndConfig = async () => {
    try {
      const branchIdFromStorage = await AsyncStorage.getItem(
        "current_branch_id"
      );
      if (branchIdFromStorage) {
        setBranchId(branchIdFromStorage);
        await loadStruckConfig(branchIdFromStorage);
      } else {
        Alert.alert(
          "Error",
          "Branch tidak ditemukan. Silakan pilih branch terlebih dahulu."
        );
      }
    } catch (error) {
      console.error("❌ Failed to load branch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStruckConfig = async (branchId: string) => {
    try {
      const response = await settingsApi.getStruckConfig(branchId);
      if (response.data) {
        const config = response.data;
        setStruckConfig(config);
        setDisplayRunningNumbers(config.display_running_number ?? true);
        setDisplayUnitNextToQty(config.display_unit_next_to_qty ?? true);
        setShowTransactionNote(config.display_transaction_note ?? true);
        setDisplayQuantityTotal((config as any).display_quantity_total ?? true);
        setHideTaxPercentage(config.hide_tax_percentage ?? false);
        setHeaderDesc(config.header_description || "");
        setFooterDesc(config.footer_description || "");
      }
    } catch (error: any) {
      console.error("❌ Failed to load struck config:", error);
      if (error.code !== 404) {
        Alert.alert("Error", "Gagal memuat konfigurasi struk");
      }
    }
  };

  const handleSave = async () => {
    if (!branchId) {
      Alert.alert("Error", "Branch tidak ditemukan");
      return;
    }

    setIsSaving(true);
    try {
      await settingsApi.updateStruckConfig(branchId, {
        display_running_number: displayRunningNumbers,
        display_unit_next_to_qty: displayUnitNextToQty,
        display_transaction_note: showTransactionNote,
        hide_tax_percentage: hideTaxPercentage,
        header_description: headerDesc.trim(),
        footer_description: footerDesc.trim(),
      });
      setShowSuccessPopup(true);
      loadStruckConfig(branchId);
    } catch (error: any) {
      console.error("❌ Failed to save struck config:", error);
      Alert.alert(
        "Gagal",
        error.message || "Gagal menyimpan konfigurasi struk"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: "center", alignItems: "center"},
        ]}
      >
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Pengaturan Struk" showHelp={false} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.sectionCard}>
            <SettingRow
              label="Tampilkan penomoran"
              value={displayRunningNumbers}
              onValueChange={setDisplayRunningNumbers}
            />
            <SettingRow
              label="Tampilkan satuan di samping QTY"
              value={displayUnitNextToQty}
              onValueChange={setDisplayUnitNextToQty}
            />
            <SettingRow
              label="Tampilkan Catatan Transaksi"
              value={showTransactionNote}
              onValueChange={setShowTransactionNote}
            />
            <SettingRow
              label="Tampilkan jumlah kuantitas"
              value={displayQuantityTotal}
              onValueChange={setDisplayQuantityTotal}
            />
            <SettingRow
              label="Sembunyikan persentase pajak"
              value={hideTaxPercentage}
              onValueChange={setHideTaxPercentage}
            />
          </View>

          <View style={styles.sectionCard}>
            <ThemedText type="subtitle-2">Pengaturan Dasar</ThemedText>
            <ThemedInput
              label="Keterangan Tambahan (Opsional)"
              value={headerDesc}
              size="md"
              onChangeText={setHeaderDesc}
              multiline
              maxLength={100}
              rightIcon={
                <TouchableOpacity onPress={() => setShowHelpExtra(true)}>
                  <Ionicons
                    name="help-circle-outline"
                    size={isTablet ? 28 : 20}
                    color={Colors[colorScheme].primary}
                  />
                </TouchableOpacity>
              }
              inputContainerStyle={{
                height: isTablet ? 120 : 100,
                alignItems: "center",
                paddingVertical: isTablet ? 16 : 12,
              }}
            />
            <View style={styles.counterRow}>
              <ThemedText
                style={{
                  color: Colors[colorScheme].icon,
                  fontSize: isTablet ? 16 : 14,
                }}
              >{`${headerDesc.length}/100`}</ThemedText>
            </View>
            <ThemedInput
              label="Pesan (Opsional)"
              value={footerDesc}
              onChangeText={setFooterDesc}
              multiline
              size="md"
              maxLength={100}
              rightIcon={
                <TouchableOpacity onPress={() => setShowHelpMessage(true)}>
                  <Ionicons
                    name="help-circle-outline"
                    size={isTablet ? 28 : 20}
                    color={Colors[colorScheme].primary}
                  />
                </TouchableOpacity>
              }
              inputContainerStyle={{
                height: isTablet ? 120 : 100,
                alignItems: "center",
                paddingVertical: isTablet ? 16 : 12,
              }}
            />
            <View style={styles.counterRow}>
              <ThemedText
                style={{
                  color: Colors[colorScheme].icon,
                  fontSize: isTablet ? 16 : 14,
                }}
              >{`${footerDesc.length}/100`}</ThemedText>
            </View>
          </View>

          <View style={styles.bottomButtonWrapper}>
            <ThemedButton
              title={isSaving ? "Menyimpan..." : "Simpan"}
              onPress={handleSave}
              disabled={isSaving}
            />
          </View>
        </View>
      </ScrollView>
      <HelpPopup
        visible={showHelpExtra}
        title="Keterangan Tambahan"
        description="Keterangan tambahan akan ditampilkan di bawah nama outlet kamu."
        onClose={() => setShowHelpExtra(false)}
      />
      <HelpPopup
        visible={showHelpMessage}
        title="Pesan Untuk Pelanggan"
        description="Pesan akan ditampilkan di bawah kembalian struk."
        onClose={() => setShowHelpMessage(false)}
      />

      <ConfirmPopup
        visible={showSuccessPopup}
        successOnly
        title="Berhasil"
        message="Konfigurasi struk berhasil disimpan"
        onConfirm={() => setShowSuccessPopup(false)}
        onCancel={() => setShowSuccessPopup(false)}
      />
    </View>
  );
}

type RowProps = {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
};

const SettingRow: React.FC<RowProps> = ({label, value, onValueChange}) => {
  const colorScheme = useColorScheme() ?? "light";
  const {width, height} = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: isTablet ? 16 : 12,
      }}
    >
      <ThemedText style={{fontSize: isTablet ? 18 : 14}}>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: Colors[colorScheme].icon,
          true: Colors[colorScheme].primary,
        }}
        thumbColor={Colors[colorScheme].secondary}
        style={
          isTablet ? {transform: [{scaleX: 1.2}, {scaleY: 1.2}]} : undefined
        }
      />
    </View>
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
    },
    scrollContainer: {
      paddingHorizontal: isTablet ? 60 : 20,
      paddingBottom: isTablet ? 100 : 80,
    },
    contentWrapper: {
      width: "100%",
      maxWidth: isTabletLandscape ? 960 : undefined,
      alignSelf: "center",
    },
    sectionCard: {
      marginTop: isTablet ? 20 : 12,
      borderColor: Colors[colorScheme].icon,
      borderRadius: isTablet ? 12 : 8,
      backgroundColor: Colors[colorScheme].background,
      paddingHorizontal: isTablet ? 16 : 8,
      paddingVertical: isTablet ? 16 : 8,
    },
    counterRow: {
      alignItems: "flex-end",
      marginTop: isTablet ? -12 : -8,
      marginBottom: isTablet ? 12 : 8,
    },
    bottomButtonWrapper: {
      marginTop: isTablet ? 32 : 8,
    },
  });
