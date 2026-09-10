export const transformBunnyUrl = (url: string | undefined): string => {
  if (!url) return "";
  let processedUrl = url;
  if (processedUrl.includes("video-1952.mediadelivery.net") || processedUrl.includes("vz-f1a07f87-b02.b-cdn.net")) {
    processedUrl = processedUrl.replace("video-1952.mediadelivery.net", "media.204prod.vn");
    processedUrl = processedUrl.replace("vz-f1a07f87-b02.b-cdn.net", "media.204prod.vn");
  }
  return processedUrl;
};
