import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

type ProductItemProps = {
    name: string;
    remaining: number;
    price: number;
    quantity?: number;
    isDisabled?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
};

export default function ProductItem({
    name,
    remaining,
    price,
    quantity = 0,
    isDisabled = false,
    onPress,
    onLongPress,
}: ProductItemProps) {

    const colorScheme = useColorScheme() ?? "light";
    const { width, height } = useWindowDimensions();
    const isTablet = Math.min(width, height) >= 600;
    const styles = createStyles(colorScheme, isTablet);

    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("");

    const formattedPrice = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    })
        .format(price)
        .replace("Rp", "Rp ")
        .trim();

    return (
        <TouchableOpacity
            style={[styles.container, isDisabled && styles.disabledContainer]}
            onLongPress={isDisabled ? undefined : onLongPress}
            onPress={isDisabled ? undefined : onPress}
            activeOpacity={isDisabled ? 1 : 0.7}
            disabled={isDisabled}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                    remaining {remaining} · {formattedPrice}
                </Text>
            </View>

            {isDisabled ? (
                <View style={styles.disabledBadge}>
                    <Text style={styles.disabledBadgeText}>Nonaktif</Text>
                </View>
            ) : (
                <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{quantity}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const createStyles = (colorScheme: "light" | "dark", isTablet: boolean) => StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: isTablet ? 14 : 10,
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
        paddingHorizontal: isTablet ? 16 : 12,
        backgroundColor: Colors[colorScheme].background,
        borderRadius: isTablet ? 10 : 8,
    },
    disabledContainer: {
        opacity: 0.5,
    },
    avatar: {
        width: isTablet ? 52 : 40,
        height: isTablet ? 52 : 40,
        borderRadius: isTablet ? 10 : 8,
        backgroundColor: Colors[colorScheme].border,
        alignItems: "center",
        justifyContent: "center",
        marginRight: isTablet ? 16 : 12,
    },
    avatarText: {
        fontSize: isTablet ? 20 : 16,
        fontWeight: "600",
        color: Colors[colorScheme].text,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: isTablet ? 18 : 14,
        fontWeight: "500",
        color: Colors[colorScheme].text,
        marginBottom: isTablet ? 4 : 2,
    },
    meta: {
        fontSize: isTablet ? 16 : 12,
        color: Colors[colorScheme].text,
    },
    quantityBadge: {
        minWidth: isTablet ? 36 : 28,
        height: isTablet ? 36 : 28,
        borderRadius: isTablet ? 8 : 6,
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: isTablet ? 8 : 6,
        marginLeft: isTablet ? 16 : 12,
    },
    quantityText: {
        fontSize: isTablet ? 18 : 14,
        fontWeight: "500",
        color: Colors[colorScheme].text,
    },
    disabledBadge: {
        backgroundColor: Colors[colorScheme].border,
        paddingHorizontal: isTablet ? 12 : 8,
        paddingVertical: isTablet ? 6 : 4,
        borderRadius: isTablet ? 6 : 4,
        marginLeft: isTablet ? 16 : 12,
    },
    disabledBadgeText: {
        color: Colors[colorScheme].icon,
        fontSize: isTablet ? 14 : 10,
        fontWeight: "600",
    },
});
