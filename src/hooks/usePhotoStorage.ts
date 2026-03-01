import { useState, useRef, useEffect } from 'react';

export const usePhotoStorage = (key: string) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    setPhoto(saved || null);
  }, [key]);

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (base64: string, maxWidth: number = 400): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Export as JPEG with 0.7 quality to save space
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const compressed = await compressImage(base64);
        localStorage.setItem(key, compressed);
        setPhoto(compressed);
      } catch (error) {
        console.error('Error saving photo:', error);
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          alert('Espaço de armazenamento cheio. Remova fotos antigas para adicionar novas.');
        } else {
          alert('Erro ao processar a imagem. Tente uma foto menor.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    localStorage.removeItem(key);
    setPhoto(null);
  };

  return {
    photo,
    fileInputRef,
    triggerInput,
    handleFileChange,
    removePhoto,
  };
};
