import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;

if (!IMGBB_API_KEY) {
    console.warn('Alerta de Seguridad: La variable de entorno EXPO_PUBLIC_IMGBB_API_KEY no está configurada.');
}

const IMGBB_UPLOAD_URL = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;

export const uploadProfilePicture = async (uri: string): Promise<string> => {
    if (!IMGBB_API_KEY) {
        throw new Error('Fallo en la configuración: La API Key de ImgBB no está disponible.');
    }

    try {
        const manipulatedImage = await manipulateAsync(
            uri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: SaveFormat.JPEG, base64: true }
        );

        if (!manipulatedImage.base64) {
            throw new Error('No se pudo obtener la imagen en base64');
        }

        const formData = new FormData();
        formData.append('image', manipulatedImage.base64);

        const response = await fetch(IMGBB_UPLOAD_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || 'Error al subir la imagen a ImgBB');
        }
    } catch (error) {
        throw new Error(`Fallo en la subida: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
};