import { ThemedInput } from "@/components/themed-input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { ThemedButton } from "../themed-button";

type CategoryModalProps = {
    visible: boolean;
    initialName?: string;
    onClose: () => void;
    onSubmit: (name: string) => void;
};

const CategoryModal: React.FC<CategoryModalProps> = ({
    visible,
    initialName = "",
    onClose,
    onSubmit,
}) => {
    const colorScheme = useColorScheme() ?? "light";
    const styles = createStyles(colorScheme);

    const [name, setName] = useState(initialName);

    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;
    console.log(visible);

    useEffect(() => {
        if (visible) {
            setName(initialName);
            opacity.setValue(1);
        }
    }, [visible, initialName, opacity]);

    const handleSave = () => {
        if (!name.trim()) {
            return;
        }
        onSubmit(name.trim());
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.root}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity }]} />
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.centerWrapper}
                >
                    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
                        <ThemedInput
                            label="Nama Kategori"
                            value={name}
                            onChangeText={setName}
                            isAutoFocusOnModal
                            width="100%"
                        />

                        <View style={styles.actionsRow}>
                            <ThemedButton onPress={onClose} size="medium" variant="cancel" title="Cancel" />
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
        },
        cancelText: {
            color: Colors[colorScheme].icon,
        },
        saveText: {
            color: Colors[colorScheme].primary,
            fontWeight: "600",
        },
    });

export default CategoryModal;

