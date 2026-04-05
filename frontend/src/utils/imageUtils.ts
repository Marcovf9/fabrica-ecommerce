export const optimizeCloudinaryUrl = (url: string | undefined, width: number = 800): string => {
    if (!url) return '';
    if (!url.includes('res.cloudinary.com')) return url;
    
    return url.replace('/upload/', `/upload/c_scale,w_${width},f_auto,q_auto/`);
};