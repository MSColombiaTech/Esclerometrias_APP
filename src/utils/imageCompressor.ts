/**
 * Compresor y optimizador de imágenes en el cliente mediante Canvas HTML5.
 * Reduce fotos de cámaras de alta resolución (5MB-15MB) a miniaturas optimizadas (~30KB-60KB),
 * evitando el error de QuotaExceededError en el almacenamiento del navegador.
 */

export async function compressImageFile(file: File, maxDimension = 800, quality = 0.68): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error('DataUrl vacío'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Escalar proporcionalmente si excede la dimensión máxima
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl); // Fallback
            return;
          }

          // Dibujar en canvas con suavizado
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a JPEG comprimido
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Fallo en compresión de canvas, usando fallback:', err);
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime un string base64 existente si es demasiado pesado
 */
export async function compressDataUrl(dataUrl: string, maxDimension = 700, quality = 0.6): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  
  // Si la cadena es pequeña (< 80KB), no es necesario recomprimir
  if (dataUrl.length < 110000) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
