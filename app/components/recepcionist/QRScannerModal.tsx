import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onScan: (data: string) => Promise<void>;
}

export const QRScannerModal: React.FC<Props> = ({ visible, onClose, onScan }) => {
    const { t } = useTranslation();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" transparent>
                <ThemedView style={styles.container}>
                    <Text className='font-body' style={styles.message}>{t('scanner.permission.message')}</Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.button}>
                        <Text className='font-body' style={styles.buttonText}>{t('scanner.permission.button')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={styles.closeButtonText}>
                        <Text className='font-body' style={{ color: 'white', marginTop: 20 }}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </ThemedView>
            </Modal>
        );
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || processing) return;

        setScanned(true);
        setProcessing(true);

        try {
            await onScan(data);
        } catch {
            Alert.alert(t('common.error.title'), t('scanner.error.cameraAccess'));
        } finally {
            setTimeout(() => {
                setProcessing(false);
                setScanned(false);
            }, 2000);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />

                <View style={styles.overlay}>
                    <View style={styles.unfocusedContainer}></View>
                    <View style={styles.middleContainer}>
                        <View style={styles.unfocusedContainer}></View>
                        <View style={styles.focusedContainer}>
                            {processing && <ActivityIndicator size="large" color="#F27F2A" />}
                            {!processing && <View style={styles.cornerMarkers} />}
                        </View>
                        <View style={styles.unfocusedContainer}></View>
                    </View>
                    <View style={styles.unfocusedContainer}></View>
                </View>

                <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                    <Ionicons name="close-circle" size={50} color="white" />
                </TouchableOpacity>

                <View style={styles.instructionContainer}>
                    <Text className='font-body' style={styles.instructionText}>
                        {processing ? t('scanner.validating') : t('scanner.instruction')}
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }, 
    message: { textAlign: 'center', paddingBottom: 10, color: 'white', marginHorizontal: 20 },
    button: { backgroundColor: '#F27F2A', padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 20 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    closeButtonText: { alignItems: 'center' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
    middleContainer: { flexDirection: 'row', flex: 1.5 },
    focusedContainer: { flex: 10, justifyContent: 'center', alignItems: 'center' },
    cornerMarkers: { width: 200, height: 200, borderWidth: 2, borderColor: '#F27F2A', backgroundColor: 'transparent' },

    closeIcon: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    instructionContainer: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
    instructionText: { color: 'white', fontSize: 18, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 }
});
