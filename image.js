// Foto a vin yon ti kare (320 × 320 ≈ 20 KB) pou l pa peze sou baz done a.
// Nou koupe mitan foto a pou l kare.
export async function squarePhoto(file, size = 320) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Nou pa ka li foto sa a. Chwazi yon lòt."));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    const webp = canvas.toDataURL("image/webp", 0.8);
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
