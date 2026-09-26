import Checkbox from "@/components/atoms/checkbox";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";

type AddCustomQuantityModalProps = {
    visible: boolean;
    productName?: string;
    initialQuantity?: number;
    initialNote?: string;
    minQuantity?: number;
    maxQuantity?: number;
    onClose: () => void;
    onSubmit: (payload: { quantity: number; note: string }) => void;
};

const AddCustomQuantityModal: React.FC<AddCustomQuantityModalProps> = ({
    visible,
    productName,
    initialQuantity = 1,
    initialNote = "",
    minQuantity = 1,
    maxQuantity,
    onClose,
    onSubmit,
}) => {
    const colorScheme = useColorScheme() ?? "light";
    const styles = createStyles(colorScheme);

    const [internalVisible, setInternalVisible] = useState(visible);
    const [quantity, setQuantity] = useState(initialQuantity);
    const [isEditingQuantity, setIsEditingQuantity] = useState(false);
    const [tempQuantity, setTempQuantity] = useState(initialQuantity.toString());

    const [enableNotes, setEnableNotes] = useState(false);
    const [notes, setNotes] = useState(initialNote ?? "");

    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            setInternalVisible(true);
            setQuantity(initialQuantity);
            setTempQuantity(initialQuantity.toString());
            setIsEditingQuantity(false);
            opacity.setValue(1);
            setEnableNotes(!!initialNote);
            setNotes(initialNote ?? "");
        } else {
            setInternalVisible(false);
        }
    }, [visible, initialQuantity, initialNote, opacity]);

    const handleChangeQty = (delta: number) => {
        setQuantity(prev => {
            let next = prev + delta;

            if (typeof minQuantity === "number") {
                next = Math.max(minQuantity, next);
            }

            if (typeof maxQuantity === "number") {
                next = Math.min(maxQuantity, next);
            }

            setTempQuantity(next.toString());
            return next;
        });
    };

    const handleQuantityTextPress = () => {
        setIsEditingQuantity(true);
        setTempQuantity(quantity.toString());
    };

    const handleQuantityTextSubmit = () => {
        const newQuantity = parseInt(tempQuantity, 10);
        if (!isNaN(newQuantity)) {
            let finalQuantity = newQuantity;
            
            if (typeof minQuantity === "number") {
                finalQuantity = Math.max(minQuantity, finalQuantity);
            }
            
            if (typeof maxQuantity === "number") {
                finalQuantity = Math.min(maxQuantity, finalQuantity);
            }
            
            setQuantity(finalQuantity);
            setTempQuantity(finalQuantity.toString());
        } else {
            setTempQuantity(quantity.toString());
        }
        setIsEditingQuantity(false);
    };

    const handleQuantityTextBlur = () => {
        handleQuantityTextSubmit();
    };

    const handleSave = () => {
        onSubmit({
            quantity,
            note: enableNotes ? notes.trim() : "",
        });
    };

    return (
        <Modal
            visible={internalVisible}
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
                        {productName ? (
                            <ThemedText type="subtitle-2" style={styles.title}>
                                {productName}
                            </ThemedText>
                        ) : null}

                        <View style={styles.qtyRow}>
                            <TouchableOpacity
                                style={styles.qtyButton}
                                onPress={() => handleChangeQty(-1)}
                            >
                                <ThemedText style={styles.qtyButtonText}>-</ThemedText>
                            </TouchableOpacity>

                            <View style={styles.qtyValueContainer}>
                                {isEditingQuantity ? (
                                    <View style={styles.qtyInputWrapper}>
                                        <TextInput
                                            style={[styles.qtyInput, { color: Colors[colorScheme].text }]}
                                            value={tempQuantity}
                                            onChangeText={setTempQuantity}
                                            onSubmitEditing={handleQuantityTextSubmit}
                                            onBlur={handleQuantityTextBlur}
                                            keyboardType="numeric"
                                            autoFocus
                                            selectTextOnFocus
                                            maxLength={6}
                                        />
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={handleQuantityTextPress}
                                        style={styles.qtyTouchable}
                                    >
                                        <ThemedText style={styles.qtyValue}>{quantity}</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.qtyButton}
                                onPress={() => handleChangeQty(1)}
                            >
                                <ThemedText style={styles.qtyButtonText}>+</ThemedText>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.optionSection}>
                            <Checkbox
                                checked={enableNotes}
                                label="Add short notes"
                                containerStyle={styles.optionCheckboxRow}
                                onPress={() => setEnableNotes(prev => !prev)}
                            />
                            {enableNotes ? (

                                <TextInput
                                    placeholder="Tuliskan catatan singkat"
                                    style={styles.noteInput}
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                />

                            ) : null}
                        </View>

                        <View style={styles.actionsRow}>
                            <ThemedButton onPress={onClose} size="medium" variant="cancel" title="Batal" />
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
            borderRadius: 16,
            backgroundColor: Colors[colorScheme].background,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
        },
        title: {
            marginBottom: 8,
        },
        label: {
            marginTop: 8,
        },
        qtyRow: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
            borderWidth: 1,
            borderColor: Colors[colorScheme].border,
            borderRadius: 8,
            overflow: "hidden",
        },
        qtyButton: {
            width: 48,
            height: 40,
            backgroundColor: Colors[colorScheme].border,
            alignItems: "center",
            justifyContent: "center",
        },
        qtyButtonText: {
            fontSize: 20,
            fontWeight: "600",
            color: Colors[colorScheme].text,
        },
        qtyValue: {
            fontSize: 18,
            fontWeight: "600",
            color: Colors[colorScheme].text,
        },
        qtyInput: {
            fontSize: 18,
            fontWeight: "600",
            textAlign: "center",
            width: 80,
            height: 40,
            padding: 0,
            margin: 0,
        },
        qtyInputWrapper: {
            width: 80,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
        },
        qtyTouchable: {
            width: 80,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
        },
        qtyValueContainer: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors[colorScheme].background,
        },
        optionSection: {
            marginTop: 16,
        },
        optionCheckboxRow: {
            marginBottom: 8,
        },
        discountRow: {
            flexDirection: "row",
            alignItems: "center",
            columnGap: 8,
        },
        discountInputContainer: {
            flex: 1,
        },
        discountTypeWrapper: {
            flexDirection: "row",
            borderWidth: 1,
            borderColor: Colors[colorScheme].border,
            borderRadius: 8,
            overflow: "hidden",
            marginLeft: 8,
        },
        discountTypeButton: {
            paddingHorizontal: 12,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: Colors[colorScheme].background,
        },
        noteInput: {
            minHeight: 100,
            borderWidth: 1,
            borderColor: Colors[colorScheme].border,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontSize: 15,
            textAlignVertical: "top",
            color: Colors[colorScheme].text,
        },
        discountTypeButtonActive: {
            backgroundColor: Colors[colorScheme].primary,
        },
        discountTypeText: {
            fontSize: 14,
            color: Colors[colorScheme].text,
        },
        discountTypeTextActive: {
            color: Colors[colorScheme].secondary,
            fontWeight: "600",
        },
        actionsRow: {
            marginTop: 24,
            flexDirection: "row",
            justifyContent: "space-between",
        },
    });

export default AddCustomQuantityModal;

