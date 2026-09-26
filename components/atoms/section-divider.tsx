import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, useWindowDimensions, View } from "react-native";

const SectionDivider = () => {
    const colorScheme = useColorScheme() ?? "light";
    const { width, height } = useWindowDimensions();
    const isTablet = Math.min(width, height) >= 600;
    const styles = createStyles(colorScheme, isTablet);
    return <View style={styles.sectionDivider} />;
};


const createStyles = (colorScheme: "light" | "dark", isTablet: boolean) =>
    StyleSheet.create({
        sectionDivider: {
            backgroundColor: Colors[colorScheme].border2,
            height: isTablet ? 12 : 6,
        },
    });

export default SectionDivider;