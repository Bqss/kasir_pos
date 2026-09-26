import { ThemedButton } from "@/components/themed-button";
import { ThemedInput } from "@/components/themed-input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type AddMerkModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialValue?: string;
  label?: string;
};

const AddMerkModal: React.FC<AddMerkModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialValue,
  label = "Nama Merek",
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);

  const [name, setName] = React.useState<string>(initialValue ?? "");
  const scale = React.useRef(new Animated.Value(0.96)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: false }),
      ]).start();
      setName(initialValue ?? "");
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.96, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: false }),
      ]).start();
    }
  }, [visible, initialValue, scale, opacity]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity }]} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.centerWrapper}>
          <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <ThemedInput label={label} value={name} onChangeText={setName} isAutoFocusOnModal width="100%" />

            <View style={styles.actionsRow}>
              <ThemedButton onPress={onClose} variant="cancel" size="medium" title="Batal" />
              <ThemedButton onPress={handleSave} size="medium" title="Simpan" />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (colorScheme: "light" | "dark") =>
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
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      width: "90%",
      maxWidth: 420,
      paddingHorizontal: 20,
      paddingVertical: 24,
      borderRadius: 12,
      backgroundColor: Colors[colorScheme].background,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    actionsRow: {
      marginTop: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
  });

export default AddMerkModal;
