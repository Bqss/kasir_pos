import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { ThemedButton } from "./themed-button";
import { ThemedInput } from "./themed-input";

export interface PickerItem {
    label: string;
    value: string;
    subtitle?: string;
}

interface SearchablePickerProps {
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    items: PickerItem[];
    value: string | null;
    onValueChange: (value: string) => void;
    size?: "sm" | "md" | "base";
}

export function SearchablePicker({
    label = "Select Item",
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    items = [],
    value,
    onValueChange,
    size = "md",
}: SearchablePickerProps) {
    const colorScheme = useColorScheme() ?? "light";
    const { width, height } = useWindowDimensions();
    const isTablet = Math.min(width, height) >= 600;
    const styles = createStyles(colorScheme, size, isTablet);

    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredItems, setFilteredItems] = useState(items);

    const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value, focusAnim]);

    useEffect(() => {
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = items.filter(
                (item) =>
                    item.label.toLowerCase().includes(lowerQuery) ||
                    (item.subtitle && item.subtitle.toLowerCase().includes(lowerQuery))
            );
            setFilteredItems(filtered);
        } else {
            setFilteredItems(items);
        }
    }, [searchQuery, items]);

    const handleSelect = (val: string) => {
        onValueChange(val);
        setVisible(false);
        setSearchQuery("");
    };

    const selectedItem = items.find((item) => item.value === value);

    const labelTopRange: [number, number] =
        size === "sm" ? [14, -8] : size === "md" ? [16, -8] : [18, -8];

    const labelFontRange: [number, number] =
        size === "sm"
            ? isTablet
                ? [18, 14]
                : [14, 12]
            : size === "md"
                ? isTablet
                    ? [20, 14]
                    : [15, 12]
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
            outputRange: [Colors[colorScheme].icon, Colors[colorScheme].primary],
        }),
        backgroundColor: Colors[colorScheme].background,
        paddingHorizontal: 4,
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.inputLike}
                activeOpacity={0.7}
                onPress={() => setVisible(true)}
            >
                <Animated.Text style={[styles.floatingLabel, labelStyle]}>
                    {label}
                </Animated.Text>
                <Text
                    style={[
                        styles.inputText,
                        {
                            color: value ? Colors[colorScheme].text : "transparent",
                        },
                    ]}
                >
                    {selectedItem ? selectedItem.label : placeholder}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={isTablet ? 24 : 18}
                    color={Colors[colorScheme].icon}
                />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalRoot}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => setVisible(false)}
                    />
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                        </View>
                        <View style={{ paddingHorizontal: isTablet ? 24 : 16, marginTop: 12 }}>
                            <ThemedInput
                                label=""
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                leftIconName="search"
                                size={isTablet ? "md" : "sm"}
                            />
                        </View>
                        <FlatList
                            data={filteredItems}
                            keyExtractor={(item) => item.value}
                            style={styles.listContainer}
                            contentContainerStyle={{ paddingHorizontal: isTablet ? 24 : 16 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.listItem}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <View>
                                        <Text
                                            style={[
                                                styles.listItemText,
                                                item.value === value && {
                                                    color: Colors[colorScheme].primary,
                                                    fontWeight: "600",
                                                },
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                        {item.subtitle && (
                                            <Text style={styles.listItemSubtitle}>{item.subtitle}</Text>
                                        )}
                                    </View>
                                    {item.value === value && (
                                        <Ionicons
                                            name="checkmark"
                                            size={isTablet ? 24 : 20}
                                            color={Colors[colorScheme].primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ditemukan</Text>
                                </View>
                            )}
                        />
                        <View style={styles.modalFooter}>
                            <ThemedButton
                                size="sm"
                                variant="secondary"
                                title="Batal"
                                onPress={() => setVisible(false)}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const createStyles = (
    colorScheme: "light" | "dark",
    size: "sm" | "md" | "base",
    isTablet: boolean
) =>
    StyleSheet.create({
        container: {
            width: "100%",
            marginVertical: isTablet
                ? size === "sm"
                    ? 10
                    : size === "md"
                        ? 12
                        : 14
                : size === "sm"
                    ? 6
                    : size === "md"
                        ? 8
                        : 10,
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
                ? size === "sm"
                    ? 14
                    : size === "md"
                        ? 18
                        : 16
                : size === "sm"
                    ? 10
                    : size === "md"
                        ? 14
                        : 12,
            height: isTablet
                ? size === "sm"
                    ? 56
                    : size === "md"
                        ? 62
                        : 68
                : size === "sm"
                    ? 48
                    : size === "md"
                        ? 52
                        : 56,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: Colors[colorScheme].background,
        },
        inputText: {
            fontSize: isTablet
                ? size === "sm"
                    ? 18
                    : size === "md"
                        ? 20
                        : 22
                : size === "sm"
                    ? 14
                    : size === "md"
                        ? 15
                        : 16,
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
            width: isTablet ? "60%" : "90%",
            maxHeight: "80%",
            borderRadius: isTablet ? 16 : 12,
            backgroundColor: Colors[colorScheme].background,
            overflow: "hidden",
        },
        modalHeader: {
            paddingVertical: isTablet ? 16 : 14,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: Colors[colorScheme].border,
            alignItems: "center",
        },
        modalTitle: {
            fontSize: isTablet ? 20 : 16,
            fontWeight: "600",
            color: Colors[colorScheme].text,
        },
        listContainer: {
            marginTop: 8,
        },
        listItem: {
            paddingVertical: isTablet ? 16 : 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: Colors[colorScheme].border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        listItemText: {
            fontSize: isTablet ? 18 : 16,
            color: Colors[colorScheme].text,
        },
        listItemSubtitle: {
            fontSize: isTablet ? 14 : 12,
            color: Colors[colorScheme].icon,
            marginTop: 2,
        },
        emptyContainer: {
            padding: 20,
            alignItems: "center",
        },
        emptyText: {
            color: Colors[colorScheme].icon,
            fontSize: isTablet ? 16 : 14,
        },
        modalFooter: {
            marginTop: 8,
            padding: isTablet ? 24 : 16,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: Colors[colorScheme].border,
            alignItems: "flex-end",
        },
    });
