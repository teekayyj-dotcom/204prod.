/**
 * Utility to process images before uploading:
 * - Read image file
 * - Resize to max dimensions
 * - Convert to WebP
 * - Generate a thumbnail
 */

export interface ProcessedImage {
  mainBlob: Blob;
  thumbBlob: Blob | null;
  width: number;
  height: number;
  mainSize: number;
  thumbSize: number;
  contentType: string;
}

const resizeAndConvert = (
  img: HTMLImageElement,
  maxWidth: number,
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return reject(new Error("Canvas context not available"));
    }

    let { width, height } = img;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      },
      "image/webp",
      quality
    );
  });
};

export const processImage = async (file: File, skipThumb: boolean = false): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("File must be an image"));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const originalWidth = img.width;
          const originalHeight = img.height;

          // Main image max width 1920
          const mainBlob = await resizeAndConvert(img, 1920, 0.85);
          
          let thumbBlob = null;
          let thumbSize = 0;
          if (!skipThumb) {
            // Thumbnail max width 400
            thumbBlob = await resizeAndConvert(img, 400, 0.7);
            thumbSize = thumbBlob.size;
          }

          resolve({
            mainBlob,
            thumbBlob,
            width: originalWidth,
            height: originalHeight,
            mainSize: mainBlob.size,
            thumbSize,
            contentType: "image/webp",
          });
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const uploadMediaPipeline = async (
  file: File,
  category: string,
  fetchApi: (url: string, options: any) => Promise<any>,
  onProgress?: (p: number) => void,
  clientSlug?: string | null,
  projectSlug?: string | null,
  folder?: string | null,
  skipThumb: boolean = false,
  folderId?: string | null
): Promise<any> => {
  if (file.type.startsWith("image/")) {
    const processed = await processImage(file, skipThumb);
    
    // 1. Get presigned URLs
    const presignedData = await fetchApi("/media/presigned-url", {
        method: "POST",
        body: JSON.stringify({
            filename: file.name,
            content_type: processed.contentType,
            file_size: processed.mainSize,
            category: category,
            client_slug: clientSlug || null,
            project_slug: projectSlug || null,
            folder: folder || null
        })
    });

    // 2. Upload to R2 directly
    const uploadToS3 = async (urlData: any, blob: Blob) => {
        if (!urlData || !urlData.url || !blob) return;
        const res = await fetch(urlData.url, {
            method: "PUT",
            headers: {
                "Content-Type": blob.type
            },
            body: blob
        });
        if (!res.ok) throw new Error("S3 Upload Failed");
    };

    await Promise.all([
        uploadToS3(presignedData.main_upload_data, processed.mainBlob),
        !skipThumb && processed.thumbBlob ? uploadToS3(presignedData.thumb_upload_data, processed.thumbBlob) : Promise.resolve()
    ]);

    // 3. Finalize upload
    return await fetchApi("/media/finalize", {
        method: "POST",
        body: JSON.stringify({
            asset_id: presignedData.asset_id,
            url: presignedData.main_url,
            thumbnail_url: skipThumb ? null : presignedData.thumb_url,
            alt: file.name,
            caption: `Uploaded: ${file.name}`,
            width: processed.width,
            height: processed.height,
            mime_type: processed.contentType,
            file_size: processed.mainSize,
            client_slug: clientSlug || null,
            project_slug: projectSlug || null,
            folder: folder || null,
            folder_id: folderId || null
        })
    });
  } else if (file.type.startsWith("video/")) {
    const tus = await import("tus-js-client");
    
    // Video upload using Bunny Stream TUS endpoint
    const { video_id, signature, expiration_time, library_id } = await fetchApi("/media/video/request-upload", {
        method: "POST",
        body: JSON.stringify({ filename: file.name, title: file.name })
    });
    
    await new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
            endpoint: "https://video.bunnycdn.com/tusupload",
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
                AuthorizationSignature: signature,
                AuthorizationExpire: expiration_time.toString(),
                VideoId: video_id,
                LibraryId: library_id,
            },
            metadata: {
                filetype: file.type,
                title: file.name,
            },
            onError: function (error) {
                reject(error);
            },
            onProgress: function (bytesUploaded, bytesTotal) {
                if (onProgress) {
                    const p = Math.round((bytesUploaded / bytesTotal) * 100);
                    onProgress(p);
                }
            },
            onSuccess: function () {
                resolve(true);
            }
        });
        upload.start();
    });
    
    return await fetchApi("/media/video/save-to-db", {
        method: "POST",
        body: JSON.stringify({
            video_id: video_id,
            title: file.name,
            client_slug: clientSlug || null,
            project_slug: projectSlug || null,
            folder: folder || null,
            folder_id: folderId || null
        })
    });
  } else {
    // Non-image, non-video upload (documents, etc) using traditional backend endpoint
    const formData = new FormData();
    formData.append("file", file);
    formData.append("alt", file.name);
    formData.append("caption", `Uploaded: ${file.name}`);
    if (clientSlug) formData.append("client_slug", clientSlug);
    if (projectSlug) formData.append("project_slug", projectSlug);
    if (folder) formData.append("folder", folder);
    if (folderId) formData.append("folder_id", folderId);
    return await fetchApi("/media/upload", {
        method: "POST",
        body: formData,
    });
  }

