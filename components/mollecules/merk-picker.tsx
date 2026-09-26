import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { merkApi } from "@/services";
import { Merk } from "@/types/api";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import AddMerkModal from "../drawers/add-merk-modal";
import { ThemedButton } from "../themed-button";

type MerkPickerProps = {
  label?: string;
  value: string; // merk ID
  onChange: (merkId: string) => void;
  size?: "sm" | "md" | "base";
};

const MerkPicker: React.FC<MerkPickerProps> = ({
  label = "Pilih Merk",
  value,
  onChange,
  size = "md",
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const styles = createStyles(colorScheme, size, isTablet);
  const [visible, setVisible] = React.useState(false);

  // Animation for floating label
  const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, focusAnim]);
  const [loading, setLoading] = React.useState(false);

  const [isAdd, setIsAdd] = React.useState(false);
  const [editingMerk, setEditingMerk] = React.useState<Merk | undefined>(
    undefined
  );
  const [merkList, setMerkList] = React.useState<Merk[]>([]);

  // Load merks from API
  const loadMerks = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await merkApi.getMerks();
      console.log("merks", response.data)
      if (response.data) {
        setMerkList(response.data);
      }
    } catch (error) {
      console.error("Failed to load merks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load merks on mount
  React.useEffect(() => {
    loadMerks();
  }, [loadMerks]);

  const openModal = () => {
    setIsAdd(false);
    setEditingMerk(undefined);
    setVisible(true);
    loadMerks(); // Refresh merks when opening
  };

  const closeModal = () => {
    setVisible(false);
    setIsAdd(false);
    setEditingMerk(undefined);
  };

  const handleSubmit = async (merkName: string) => {
    try {
      setLoading(true);

      if (editingMerk) {
        // Update existing merk
        const response = await merkApi.updateMerk(editingMerk.id, {
          name: merkName,
        });
        if (response.data) {
          await loadMerks();
          onChange(response.data.id);
        }
      } else {
        // Create new merk
        const response = await merkApi.createMerk({ name: merkName });
        if (response.data) {
          await loadMerks();
          onChange(response.data.id);
        }
      }

      setIsAdd(false);
      setEditingMerk(undefined);
      setVisible(false);
    } catch (error) {
      console.error("Failed to save merk:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMerk = () => {
    setEditingMerk(undefined);
    setIsAdd(true);
  };

  const handleEditMerk = (item: Merk) => {
    setEditingMerk(item);
    setIsAdd(true);
  };

  const selectedMerk = React.useMemo(() => {
    const merk = merkList.find(m => m.id === value);
    return merk ? merk.name : "";
  }, [value, merkList]);

  const labelTopRange: [number, number] =
    size === "sm" ? [14, -8] : size === "md" ? [16, -8] : [18, -8];

  const labelFontRange: [number, number] =
    size === "sm"
      ? isTablet ? [18, 14] : [14, 12]
      : size === "md"
        ? isTablet ? [20, 14] : [15, 12]
        : isTablet
          ? [22, 14]
          : [16, 12];

  const labelStyle = {
    top: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: labelTopRange,
    }),
    fontSize: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: labelFontRange,
    }),
    color: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        Colors[colorScheme].icon,
        Colors[colorScheme].primary,
      ],
    }),
    backgroundColor: Colors[colorScheme].background,
    paddingHorizontal: 4,
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.inputLike}
        activeOpacity={0.7}
        onPress={openModal}
      >
        <Animated.Text style={[styles.floatingLabel, labelStyle]}>
          {label}
        </Animated.Text>
        <Text
          style={[
            styles.inputText,
            {
              color: value
                ? Colors[colorScheme].text
                : "transparent",
            },
          ]}
        >
          {selectedMerk || label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={isTablet ? 24 : 18}
          color={Colors[colorScheme].icon}
        />
      </TouchableOpacity>

      <AddMerkModal
        visible={Boolean(visible && isAdd)}
        onClose={() => {
          setIsAdd(false);
        }}
        onSubmit={handleSubmit}
        initialValue={editingMerk?.name}
        label="Nama Merk"
      />

      <Modal
        visible={visible && !isAdd}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeModal}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Merk</Text>
            </View>

            <ScrollView style={styles.listContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={Colors[colorScheme].primary}
                  />
                </View>
              ) : merkList.length === 0 ? (
                <Text
                  style={[
                    styles.listItemText,
                    { textAlign: "center", paddingVertical: 20 },
                  ]}
                >
                  Belum ada merk
                </Text>
              ) : (
                merkList.map(item => (
                  <View key={item.id} style={styles.listItemRow}>
                    <TouchableOpacity
                      style={styles.listItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        onChange(item.id);
                        closeModal();
                      }}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          item.id === value && {
                            color: Colors[colorScheme].primary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editButton}
                      activeOpacity={0.7}
                      onPress={() => handleEditMerk(item)}
                    >
                      <AntDesign
                        name="edit"
                        size={isTablet ? 26 : 20}
                        color={Colors[colorScheme].primary}
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <ThemedButton
              size="sm"
              title="Tambah Merk"
              style={{
                marginTop: 8,
              }}
              onPress={handleAddMerk}
            />
            <View style={styles.modalFooter}>
              <ThemedButton
                size="sm"
                variant="secondary"
                title="Batal"
                onPress={closeModal}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (
  colorScheme: "light" | "dark",
  size: "sm" | "md" | "base",
  isTablet: boolean
) =>
  StyleSheet.create({
    container: {
      width: "100%",
      marginVertical: isTablet
        ? (size === "sm" ? 10 : size === "md" ? 12 : 14)
        : (size === "sm" ? 6 : size === "md" ? 8 : 10),
    },
    floatingLabel: {
      position: "absolute",
      left: isTablet ? 16 : 12,
      zIndex: 2,
    },
    inputLike: {
      borderWidth: 1,
      borderRadius: isTablet ? 10 : 8,
      borderColor: Colors[colorScheme].border,
      paddingHorizontal: isTablet
        ? (size === "sm" ? 14 : size === "md" ? 18 : 16)
        : (size === "sm" ? 10 : size === "md" ? 14 : 12),
      height: isTablet
        ? (size === "sm" ? 56 : size === "md" ? 62 : 68)
        : (size === "sm" ? 48 : size === "md" ? 52 : 56),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: Colors[colorScheme].background,
    },
    inputText: {
      fontSize: isTablet
        ? (size === "sm" ? 18 : size === "md" ? 20 : 22)
        : (size === "sm" ? 14 : size === "md" ? 15 : 16),
    },
    modalRoot: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    modalCard: {
      width: isTablet ? "70%" : "86%",
      maxWidth: isTablet ? 520 : 420,
      borderRadius: isTablet ? 16 : 12,
      paddingTop: isTablet ? 12 : 8,
      paddingHorizontal: isTablet ? 24 : 16,
      paddingBottom: isTablet ? 18 : 12,
      backgroundColor: Colors[colorScheme].background,
    },
    modalHeader: {
      paddingVertical: isTablet ? 16 : 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: Colors[colorScheme].border,
      alignItems: "center",
    },
    modalFooter: {
      marginTop: isTablet ? 16 : 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: Colors[colorScheme].border,
      paddingVertical: isTablet ? 16 : 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    modalTitle: {
      fontSize: isTablet ? 24 : 16,
      fontWeight: "600",
      color: Colors[colorScheme].text,
    },
    listContainer: {
      maxHeight: isTablet ? 340 : 260,
      marginTop: isTablet ? 8 : 4,
      marginBottom: isTablet ? 12 : 8,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    listItemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: isTablet ? 4 : 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: Colors[colorScheme].border,
      justifyContent: "space-between",
    },
    listItem: {
      paddingVertical: isTablet ? 14 : 10,
    },
    listItemText: {
      fontSize: isTablet ? 22 : 16,
      color: Colors[colorScheme].text,
    },
    editButton: {
      paddingHorizontal: isTablet ? 12 : 8,
      paddingVertical: isTablet ? 10 : 6,
    },
    addButtonText: {
      fontSize: isTablet ? 20 : 14,
      color: Colors[colorScheme].primary,
      fontWeight: "500",
    },
    cancelButton: {
      marginTop: isTablet ? 6 : 4,
      alignSelf: "flex-end",
      paddingHorizontal: isTablet ? 12 : 8,
      paddingVertical: isTablet ? 6 : 4,
    },
    cancelText: {
      fontSize: isTablet ? 20 : 14,
      color: Colors[colorScheme].primary,
    },
  });

export default MerkPicker;
