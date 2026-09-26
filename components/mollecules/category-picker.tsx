import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import categoryApi from "@/services/endpoints/categories";
import { Category } from "@/types/api";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View, useWindowDimensions,
} from "react-native";
import AddCategoryModal from "../drawers/add-category-modal";
import { ThemedButton } from "../themed-button";

type CategoryPickerProps = {
  label?: string;
  value: string;
  onUpdate?: (next: Category) => void;
  onChange: (categoryId: string) => void;
  size?: "sm" | "md" | "base";
};

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  label = "Pilih Kategori",
  value,
  onUpdate,
  onChange,
  size = "md",
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const {width, height} = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const styles = createStyles(colorScheme, size, isTablet);
  const [visible, setVisible] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Animation for floating label
  const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  console.log("value", value);

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, focusAnim]);

  const [isAdd, setIsAdd] = React.useState(false);
  const [editingValue, setEditingValue] = React.useState<Category | undefined>(
    undefined
  );

  // Initial load so existing value can be resolved to its label immediately
  React.useEffect(() => {
    loadCategories();
  }, []);

  // Fetch categories on mount and when modal opens
  React.useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const storeId = await AsyncStorage.getItem("current_branch_id");
      const params = storeId ? { store_id: storeId } : undefined;
      const response = await categoryApi.getCategories(params);
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error: any) {
      console.error("❌ Failed to load categories:", error);
      Alert.alert("Error", "Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsAdd(false);
    setEditingValue(undefined);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setIsAdd(false);
    setEditingValue(undefined);
  };

  const handleSubmit = async (category: Category) => {
    try {
      setLoading(true);
      let savedCategory: Category;

      if (category.id) {
        // Update existing category
        const response = await categoryApi.updateCategory(category.id, {
          name: category.name,
        });
        savedCategory = response.data!;
        console.log("✅ Category updated:", savedCategory);
      } else {
        // Create new category
        const response = await categoryApi.createCategory({
          name: category.name,
        });
        savedCategory = response.data!;
        console.log("✅ Category created:", savedCategory);
      }

      // Refresh list
      await loadCategories();

      // Call onUpdate if provided
      if (onUpdate) {
        onUpdate(savedCategory);
      }

      // Select the new/updated category
      onChange(savedCategory.id);

      setVisible(false);
      setIsAdd(false);
      setEditingValue(undefined);
    } catch (error: any) {
      console.error("❌ Failed to save category:", error);
      Alert.alert("Error", error.message || "Gagal menyimpan kategori");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingValue(undefined);
    setIsAdd(true);
  };

  const handleEditCategory = (item: Category) => {
    setEditingValue(item);
    setIsAdd(true);
  };

  const selectedCategory = categories?.find(c => c.id === value);

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
          {selectedCategory?.name || label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={isTablet ? 24 : 18}
          color={Colors[colorScheme].icon}
        />
      </TouchableOpacity>

      <AddCategoryModal
        visible={Boolean(visible && isAdd)}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialValue={editingValue}
        label="Nama Kategori"
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
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
            </View>

            <ScrollView style={styles.listContainer}>
              {loading ? (
                <View style={{padding: 20, alignItems: "center"}}>
                  <ActivityIndicator
                    size="small"
                    color={Colors[colorScheme].primary}
                  />
                </View>
              ) : (
                categories.map(item => (
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
                      onPress={() => handleEditCategory(item)}
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
              title="Tambah Kategori"
              style={{
                marginTop: 8,
              }}
              onPress={handleAddCategory}
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
  size: "sm" | "md" | "base", isTablet: boolean
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

export default CategoryPicker;
