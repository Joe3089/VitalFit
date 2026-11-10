import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface LoadingModalProps {
    visible: boolean;
    message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
    visible,
    message,
}) => {
    const { t } = useTranslation();
    const displayMessage = message || t('common.loading');
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text style={styles.message}>{displayMessage}</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        color: '#333333',
        textAlign: 'center',
    },
});
