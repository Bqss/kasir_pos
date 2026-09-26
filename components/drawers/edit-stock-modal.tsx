
import ComboInput from "@/components/combo-input";
import UnitPicker from "@/components/mollecules/unit-picker";
import { ThemedButton } from "@/components/themed-button";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { UNITS, UnitType } from "@/constants/units";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";

type EditStockModalProps = {
  visible: boolean;
  productLabel: string;
  initialQuantity: number;
  previousQuantity?: number;
  variantUnitId?: string;
  onClose: () => void;
  onSubmit: (params: { quantity: number; mode: any, note: string, unitId?: string }) => void;
};

const STOCK_MODES = [
  // { label: "Stok Disesuaikan", value: "adjust_stock" },
  { label: "Stok Ditambah", value: "add_stock" },
  { label: "Stok Dikurangi", value: "remove_stock" },
];

const EditStockModal: React.FC<EditStockModalProps> = ({
  visible,
  productLabel,
  initialQuantity,
  previousQuantity,
  variantUnitId,
  onClose,
  onSubmit,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const styles = createStyles(colorScheme, isTablet);

  const [internalVisible, setInternalVisible] = useState(visible);
  const [quantity, setQuantity] = useState(0);
  const [mode, setMode] = useState(STOCK_MODES[0].value);
  const [modeText, setModeText] = useState(STOCK_MODES[0].label);
  const [note, setNote] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [unitTypeFilter, setUnitTypeFilter] = useState<UnitType | undefined>(undefined);

  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      opacity.setValue(1);

      // Set default unit from variant and filter by type
      if (variantUnitId) {
        setSelectedUnitId(variantUnitId);
        const variantUnit = UNITS.find(u => u.id === variantUnitId);
        setUnitTypeFilter(variantUnit?.type);
      }
    } else {
      setInternalVisible(false);
    }
  }, [visible, initialQuantity, opacity, variantUnitId]);

  const handleChangeQty = (delta: number) => {
    setQuantity(q => {
      const next = q + delta;
      if (next < 0) return 0;
      return next;
    });
  };

  const handleClose = () => {
    setInternalVisible(false);
    setMode(STOCK_MODES[0].value);
    setModeText(STOCK_MODES[0].label);
    setNote("");
    setSelectedUnitId("");
    setUnitTypeFilter(undefined);
    onClose();
  };

  const handleSave = () => {
    console.log("📦 Updating stock:", { quantity, mode, note, unitId: selectedUnitId });
    onSubmit({ quantity, mode, note, unitId: selectedUnitId });
    handleClose();
  };

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.root}> 
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity }]} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centerWrapper}
        >
          <Animated.View style={[styles.card, { transform: [{ scale }] }]}> 
            <ThemedText type="subtitle-2" style={styles.title}>
              {productLabel}
            </ThemedText>

            <View style={{ marginTop: 16 }}>
              <ComboInput
                label="Stok Disesuaikan"
                value={modeText}
                onChange={(value) => {
                  console.log("Selected mode:", value.value);
                  setMode(value.value);
                  setModeText(value.label);
                }}
                onChangeText={setModeText}
                items={STOCK_MODES}
                disableAutoComplete
              />
            </View>

            <View style={{ marginTop: isTablet ? 28 : 20 }}>
              <ThemedText type="defaultSemiBold" style={styles.labelText}>Stok saat ini</ThemedText>

              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => handleChangeQty(-1)}
                >
                  <ThemedText style={styles.qtyButtonText}>-</ThemedText>
                </TouchableOpacity>

                <View style={styles.qtyValueContainer}>
                  <TextInput
                    style={styles.qtyValue}
                    value={String(quantity)}
                    onChangeText={text => {
                      const clean = text.replace(/[^0-9]/g, "");
                      const num = clean === "" ? 0 : Number(clean);
                      setQuantity(num);
                    }}
                    keyboardType="number-pad"
                    textAlign="center"
                  />
                </View>

                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => handleChangeQty(1)}
                >
                  <ThemedText style={styles.qtyButtonText}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.previousRow}>
              <ThemedText style={styles.previousLabel}>Stok Sebelumnya</ThemedText>
              <ThemedText style={styles.previousValue}>
                {previousQuantity ?? initialQuantity} {variantUnitId ? UNITS.find(u => u.id === variantUnitId)?.symbol : ""}
              </ThemedText>
            </View>

            <View style={{ marginTop: 12 }}>
              <UnitPicker
                label="Unit"
                value={selectedUnitId}
                onChange={setSelectedUnitId}
                usePredefined={true}
                filterByType={unitTypeFilter}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <ThemedInput
                label="Catatan (Opsional)"
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={100}
                inputContainerStyle={{
                  height: 100,
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              />
            </View>

            <View style={styles.actionsRow}>
              <ThemedButton onPress={onClose} size="medium" variant="cancel" title="Batal" />
              <ThemedButton onPress={handleSave} size="medium" title="Simpan" />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (colorScheme: "light" | "dark", isTablet: boolean) =>
  StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFill,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      zIndex: 20,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    centerWrapper: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      width: isTablet ? "80%" : "90%",
      maxWidth: isTablet ? 520 : 420,
      paddingHorizontal: isTablet ? 32 : 20,
      paddingVertical: isTablet ? 32 : 24,
      borderRadius: isTablet ? 16 : 12,
      backgroundColor: Colors[colorScheme].background,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      marginBottom: isTablet ? 8 : 4,
      fontSize: isTablet ? 22 : 18,
    },
    labelText: {
      fontSize: isTablet ? 20 : 16,
    },
    qtyRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: isTablet ? 16 : 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
      borderRadius: isTablet ? 12 : 8,
      overflow: "hidden",
    },
    qtyButton: {
      width: isTablet ? 64 : 48,
      height: isTablet ? 56 : 40,
      backgroundColor: Colors[colorScheme].border,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyButtonText: {
      fontSize: isTablet ? 28 : 20,
      fontWeight: "600",
      color: Colors[colorScheme].text,
    },
    qtyValue: {
      fontSize: isTablet ? 24 : 18,
      fontWeight: "600",
      color: Colors[colorScheme].text,
    },
    qtyValueContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors[colorScheme].background,
    },
    previousRow: {
      marginTop: isTablet ? 16 : 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    previousLabel: {
      color: Colors[colorScheme].icon,
      fontSize: isTablet ? 18 : 14,
      fontWeight: "500",
    },
    previousValue: {
      color: Colors[colorScheme].icon,
      fontSize: isTablet ? 18 : 14,
      fontWeight: "500",
    },
    actionsRow: {
      marginTop: isTablet ? 32 : 24,
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });

export default EditStockModal;

