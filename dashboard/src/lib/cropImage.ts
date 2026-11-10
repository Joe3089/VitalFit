export type PixelCrop = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export async function getCroppedBlob(
    imageSrc: string,
    crop: PixelCrop,
    rotation: number = 0,
    quality: number = 0.92
): Promise<Blob> {
    const image = await loadImage(imageSrc);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) { throw new Error("No canvas context"); }

    // Ajusta el canvas al tamaño del recorte
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Aplica rotación si corresponde
    if (rotation !== 0) {
        const radians = (rotation * Math.PI) / 180;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Dibuja el recorte
    ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) { return reject(new Error("Canvas toBlob failed")); }
                resolve(blob);
            },
            "image/jpeg",
            quality
        );
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}