import Header from "@/components/header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProductFormStore } from "@/stores/product-form-store";
import { useVariantBarcodeStore } from "@/stores/variant-barcode-store";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";

export default function AddBarcodeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const {width, height} = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const styles = createStyles(colorScheme, isTablet, isTabletLandscape);
  const router = useRouter();
  const setProductBarcode = useProductFormStore(state => state.setBarcode);
  const setVariantBarcode = useVariantBarcodeStore(state => state.setBarcode);
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [scanned, setScanned] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const result = await requestPermission();
        if (!isMounted || !result) return;

        if (!result.granted) {
          setHasPermission("denied");
          router.back();
        } else {
          setHasPermission("granted");
        }
      } catch (e) {
        if (!isMounted) return;
        setHasPermission("denied");
        router.back();
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [requestPermission, router]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanAnim]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    console.log("Barcode scanned:", data);
    if (from === "variant") {
      setVariantBarcode(String(data));
    } else {
      setProductBarcode(String(data));
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header title="Tambah Barcode" showHelp={false} />
      <View style={styles.scannerContainer}>
        {hasPermission === "granted" && !scanned ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
          />
        ) : null}

        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.mask} />
          <View style={styles.centerRow}>
            <View style={styles.mask} />
            <View style={styles.scanBox}>
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 276],
                        }),
                      },
                    ],
                    opacity: scanAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.mask} />
          </View>
          <View style={styles.mask} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colorScheme: "light" | "dark", isTablet: boolean, isTabletLandscape: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    contentWrapper: {
      width: "100%",
      maxWidth: isTabletLandscape ? 960 : undefined,
      alignSelf: "center",
    },
    scannerContainer: {
      flex: 1,
      backgroundColor: "#000",
      position: "relative",
      overflow: "hidden",
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
    },
    centerRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    mask: {
      flex: 1,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.52)",
    },
    scanBox: {
      width: isTablet ? 400 : 300,
      height: isTablet ? 400 : 300,
      borderRadius: isTablet ? 16 : 12,
      overflow: "hidden",
      backgroundColor: "transparent",
    },
    scanLine: {
      position: "absolute",
      left: isTablet ? 16 : 12,
      right: isTablet ? 16 : 12,
      top: isTablet ? 16 : 12,
      height: isTablet ? 2 : 1,
      backgroundColor: "#ff0000ff",
      borderRadius: 999,
    },
  });

