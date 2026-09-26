import Checkbox from "@/components/atoms/checkbox";
import { ThemedButton } from "@/components/themed-button";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions,
} from "react-native";

export type FilterCategory = {
    id: string;
    name: string;
};

type FilterProductModalProps = {
    visible: boolean;
    categories: FilterCategory[];
    initialSelectedIds?: string[];
    onClose: () => void;
    onApply: (selectedIds: string[]) => void;
    onReset?: () => void;
};

const FilterProductModal: React.FC<FilterProductModalProps> = ({
    visible,
    categories,
    initialSelectedIds = [],
    onClose,
    onApply,
    onReset,
}) => {
    const colorScheme = useColorScheme() ?? "light";
    const {width, height} = useWindowDimensions();
    const isTablet = Math.min(width, height) >= 600;
    const styles = createStyles(colorScheme, isTablet);

    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

    useEffect(() => {
        if (visible) {
            setSearch("");
            setSelectedIds(initialSelectedIds);
        }
    }, [visible, initialSelectedIds]);

    const filteredCategories = useMemo(
        () =>
            categories.filter(category => {
                if (!search.trim()) return true;
                return category.name.toLowerCase().includes(search.toLowerCase());
            }),
        [categories, search]
    );

    const toggleCategory = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleReset = () => {
        setSelectedIds([]);
        setSearch("");
        onReset?.();
    };

    const handleApply = () => {
        onApply(selectedIds);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.root}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.centerWrapper}>
                    <View style={styles.card}>
                        <ThemedText style={styles.title}>
                            Pilih 1 atau lebih kategori
                        </ThemedText>

                        <ThemedInput
                            label="Cari Kategori"
                            value={search}
                            onChangeText={setSearch}
                            width="100%"
                            size="sm"
                            showLabel={false}
                            placeholder="Cari Kategori"
                            leftIconName="search"
                        />

                        <View style={styles.listContainer}>
                            {filteredCategories.length === 0 ? (
                                <View style={styles.emptyStateWrapper}>
                                    <ThemedText style={styles.emptyStateText}>
                                        Kategori tidak ditemukan
                                    </ThemedText>
                                </View>
                            ) : (
                                filteredCategories.map(category => {
                                    const checked = selectedIds.includes(category.id);
                                    return (
                                        <Checkbox
                                            key={category.id}
                                            checked={checked}
                                            label={category.name}
                                            containerStyle={styles.checkboxRow}
                                            onPress={() => toggleCategory(category.id)}
                                        />
                                    );
                                })
                            )}
                        </View>

                        <View style={styles.footerRow}>
                            <ThemedButton
                                title="Reset"
                                variant="secondary"
                                size="medium"
                                style={{ flex: 1 }}
                                onPress={handleReset}
                            />
                            <ThemedButton
                                title="Batal"
                                size="medium"
                                style={{ flex: 1 }}
                                variant="secondary"
                                onPress={onClose}
                            />
                            <ThemedButton title="Filter" size="medium" style={{ flex: 1 }} onPress={handleApply} />
                        </View>
                    </View>
                </View>
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
            zIndex: 20,
        },
        backdrop: {
            ...StyleSheet.absoluteFill,
            backgroundColor: "rgba(0,0,0,0.45)",
        },
        centerWrapper: {
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: isTablet ? 32 : 24,
        },
        card: {
            width: "100%",
            maxWidth: isTablet ? 520 : 420,
            borderRadius: isTablet ? 20 : 16,
            backgroundColor: Colors[colorScheme].background,
            paddingHorizontal: isTablet ? 28 : 20,
            paddingVertical: isTablet ? 32 : 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
        },
        title: {
            fontSize: isTablet ? 20 : 16,
            fontWeight: "600",
            marginBottom: isTablet ? 16 : 12,
            color: Colors[colorScheme].text,
        },
        listContainer: {
            marginTop: isTablet ? 24 : 16,
            marginBottom: isTablet ? 32 : 20,
            maxHeight: isTablet ? 340 : 260,
        },
        emptyStateWrapper: {
            flex: isTablet ? 0 : 1,
            minHeight: isTablet ? 120 : 80,
            paddingVertical: isTablet ? 24 : 16,
            justifyContent: "center",
            alignItems: "center",
        },
        emptyStateText: {
            fontSize: isTablet ? 18 : 14,
            color: Colors[colorScheme].icon,
            textAlign: "center",
        },
        checkboxRow: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: isTablet ? 16 : 12,
        },
        checkbox: {
            width: isTablet ? 28 : 22,
            height: isTablet ? 28 : 22,
            borderRadius: isTablet ? 6 : 4,
            borderWidth: 1,
            borderColor: Colors[colorScheme].border,
            marginRight: isTablet ? 16 : 12,
            backgroundColor: Colors[colorScheme].background,
            alignItems: "center",
            justifyContent: "center",
        },
        footerRow: {
            flexDirection: "row",
            gap: isTablet ? 12 : 8,
            justifyContent: "space-between",
        },
    });

export default FilterProductModal;

