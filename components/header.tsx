import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "./themed-text";

interface HeaderProps {
  onBackPress?: () => void;
  onHelpPress?: () => void;
  title?: string;
  showBack?: boolean;
  showHelp?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  center?: React.ReactNode;
  withNotificationButton?: boolean;
  withShadow?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onBackPress,
  onHelpPress,
  title,
  showBack = true,
  showHelp = true,
  withShadow = true,
  left,
  right,
  center,
  withNotificationButton = true,
}) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const styles = createStyles(colorScheme, withShadow, isTablet);
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerContent}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack}>
            <Ionicons
              name="arrow-back"
              size={isTablet ? 30 : 24}
              color={Colors[colorScheme].secondary}
            />
          </TouchableOpacity>
        ) : null}
        {left}

        {center ? (
          center
        ) : title ? (
          <ThemedText style={styles.titleText}>{title}</ThemedText>
        ) : null}
      </View>
      <View style={styles.rightArea}>
        {showHelp ? (
          <TouchableOpacity style={styles.helpButton} onPress={onHelpPress}>
            <ThemedText style={styles.helpButtonText}>Bantuan</ThemedText>
            <Ionicons
              name="help-circle-outline"
              size={isTablet ? 26 : 20}
              color={Colors[colorScheme].secondary}
            />
          </TouchableOpacity>
        ) : null}
        {withNotificationButton ? right : null}
      </View>
    </View>
  );
};

const createStyles = (
  colorScheme: "light" | "dark",
  withShadow: boolean,
  isTablet: boolean,
) =>
  StyleSheet.create({
    headerContainer: {
      
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      paddingVertical: isTablet ? 20 : 16,
      paddingHorizontal: isTablet ? 24 : 16,
      backgroundColor: Colors[colorScheme].primary,
      position: "relative",
      ...(withShadow ? {
        shadowColor: Colors[colorScheme].shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 6,
      } : {}),
      zIndex: 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors[colorScheme].border,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: isTablet ? 40 : 32,
    },
    leftArea: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rightArea: {
      flexDirection: "row",

      alignItems: "center",
      gap: 12,
    },
    helpButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 8 : 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
      backgroundColor: "transparent",
    },
    helpButtonText: {
      marginRight: 4,
      color: Colors[colorScheme].secondary,
      fontSize: isTablet ? 20 : 14,
      fontWeight: "500",
    },
    titleText: {
      fontSize: isTablet ? 26 : 18,
      color: Colors[colorScheme].secondary,
      fontWeight: "700",
      textAlign: "center",
    },
  });

export default Header;
