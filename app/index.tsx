import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUserStore } from "@/stores/user-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const colorScheme = useColorScheme() ?? "light";
  const navigation = useNavigation();
  const router = useRouter();
  const { setUser, startPeriodicFetch } = useUserStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = Math.min(screenWidth, screenHeight) >= 600;
  const isLandscape = screenWidth > screenHeight;
  const isTabletLandscape = isTablet && isLandscape;

  const styles = createStyles({ deviceWidth: screenWidth, isTabletLandscape });

  const getSlideSize = (width: number, height: number) => {
    const scale = isTabletLandscape ? 1.8 : isTablet ? 1.4 : 1;
    return { width: width * scale, height: height * scale };
  };

  const getSlideMarginBottom = (id: number) => {
    return slides[id].marginBottom;
  };

  const widthForSlide = carouselWidth || screenWidth;
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const slides = [
    {
      id: 0,
      title: "Cukup 2 menit untuk registrasi",
      description:
        "Daftarin usahamu untuk catat transaksi dan pantau laporan penjualan.",
      image: require("../assets/ilustrations/signup.png"),

      width: 300,
      height: 300,
      marginBottom: -40,
    },
    {
      id: 1,
      title: "Satu akun untuk banyak cabang",
      description:
        "Kelola beberapa cabang usaha dalam satu aplikasi. Pantau performa tiap toko tanpa harus datang ke lokasi.",
      image: require("../assets/ilustrations/multi-store.png"),
      width: 300,
      height: 300,
      marginBottom: -40,
    },
    {
      id: 2,
      title: "Produk rapi, transaksi otomatis tercatat",
      description:
        "Atur katalog produk, harga, dan stok dengan mudah. Setiap transaksi langsung tercatat rapi di laporan.",
      image: require("../assets/ilustrations/trx.png"),
      width: 250,
      height: 250,
      marginBottom: -10,
    },
  ];

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const {contentOffset, layoutMeasurement} = event.nativeEvent;
    const index = Math.round(contentOffset.x / layoutMeasurement.width);
    setActiveSlide(index);
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      console.log("🔑 Checking auth token:", token ? "Found" : "Not found");

      if (token) {
        // Load user data from AsyncStorage
        const userDataStr = await AsyncStorage.getItem("user_data");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          console.log("✅ User data loaded from storage");
        }
        
        // Start periodic fetching
        startPeriodicFetch();
        
        console.log("✅ User is authenticated, redirecting to dashboard...");
        router.replace("/dashboard/home");
      } else {
        console.log("❌ User is not authenticated, showing onboarding...");
        setIsCheckingAuth(false);
      }
    } catch (error) {
      console.error("❌ Error checking auth:", error);
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (isCheckingAuth) return; // Don't start carousel while checking auth

    const interval = setInterval(() => {
      setActiveSlide(prev => {
        const nextIndex = (prev + 1) % slides.length;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: nextIndex * widthForSlide,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [widthForSlide, slides.length, isCheckingAuth]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {backgroundColor: Colors[colorScheme].background},
        ]}
      >
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
          <ThemedText style={{marginTop: 16}}>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        isTablet && styles.containerLarge,
        isTabletLandscape && styles.containerTabletLandscape,
        {backgroundColor: Colors[colorScheme].background},
      ]}
    >
      <View
        style={[styles.carouselContainer, isTablet && styles.carouselContainerLarge]}
        onLayout={event => {
          const { width } = event.nativeEvent.layout;
          setCarouselWidth(width);
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {slides.map(slide => (
            <View
              key={slide.id}
              style={[
                styles.slide,
                isTabletLandscape && styles.slideLarge,
                { width: widthForSlide },
              ]}
            >
              <View style={[styles.imageContainer, isTabletLandscape && styles.imageContainerLarge]}>
                <Image
                  source={slide.image}
                  style={[
                    styles.ilustration,
                    getSlideSize(slide.width, slide.height),
                    {
                      marginBottom: isTabletLandscape
                        ? 0
                        : getSlideMarginBottom(slide.id),
                    },
                  ]}
                />
              </View>
              <View
                style={[
                  styles.textContainer,
                  isTabletLandscape && styles.textContainerLarge,
                ]}
              >
                <ThemedText
                  type="subtitle-2"
                  style={[
                    styles.title,
                    isTablet && styles.titleLarge,
                    isTabletLandscape && styles.titleTabletLandscape,
                  ]}
                >
                  {slide.title}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.subtitle,
                    isTablet && styles.subtitleLarge,
                    isTabletLandscape && styles.subtitleTabletLandscape,
                    { color: Colors[colorScheme].icon },
                  ]}
                >
                  {slide.description}
                </ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={[styles.dotsContainer, isTablet && styles.dotsContainerLarge]}>
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeSlide && styles.dotActive]}
            />
          ))}
        </View>
      </View>
      <View
        style={[
          styles.buttonContainer,
          isTablet && styles.buttonContainerLarge,
          isTabletLandscape && styles.buttonContainerTabletLandscape,
        ]}
      >
        <ThemedButton
          title="Daftar Sekarang"
          variant="primary"
          onPress={() =>
            navigation.navigate("auth/Register/register" as never)
          }
        />
        <ThemedButton
          title="Masuk"
          variant="secondary"
          style={[
            !isTabletLandscape && { marginTop: 16 },
            isTabletLandscape && { marginLeft: 16 },
          ]}
          onPress={() => navigation.navigate("auth/Login/login" as never)}
        />
      </View>
    </SafeAreaView>
  );
}
const createStyles = ({ deviceWidth, isTabletLandscape }: { deviceWidth: number; isTabletLandscape: boolean }) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20
  },
    containerLarge: {
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  containerTabletLandscape: {
    paddingVertical: 24,
    paddingHorizontal: 80,
    justifyContent: "center",
  },
  carouselContainer: {
    width: "100%",
    flex: 1,
  },
  carouselContainerLarge: {
    maxWidth: deviceWidth,
    alignSelf: "center",
  },
  slide: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  slideLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  imageContainer: {
    flexDirection: "column",
    borderRadius: 10,
    alignItems: "center",
  },
  imageContainerLarge: {
    flex: 1,
  },
  ilustration: {
    resizeMode: "contain",
  },
  textContainer: {
    marginTop: 50,
  },
  textContainerLarge: {
    flex: 1,
    marginTop: 0,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
    fontSize: 20,
    fontWeight: "600",
  },
  titleLarge: {
    fontSize: 28,
  },
  titleTabletLandscape: {
    textAlign: "left",
    alignSelf: "flex-start",
    fontSize: 30,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 20,
  },
  subtitleLarge: {
    fontSize: 20,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  subtitleTabletLandscape: {
    textAlign: "left",
    paddingHorizontal: 0,
    fontSize: 18,
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
    paddingBottom: 20,
  },
  dotsContainerLarge: {
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E1E3E8",
  },
  dotActive: {
    backgroundColor: Colors.light.primary,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  buttonContainerLarge: {
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  buttonContainerTabletLandscape: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
