import Image from "next/image";
import type { Photo } from "@/lib/types";

interface PhotoImageProps {
  photo: Photo;
  className?: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
}

/**
 * Shared next/image wrapper: lazy-loads, applies the stored blur-up
 * placeholder, and preserves each photo's intrinsic aspect ratio.
 */
export function PhotoImage({
  photo,
  className,
  sizes,
  priority = false,
  quality = 80,
  fill = false,
}: PhotoImageProps) {
  const alt = photo.caption || "Earth Unseen photograph";
  if (fill) {
    return (
      <Image
        src={photo.imageUrl}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder="blur"
        blurDataURL={photo.blurDataUrl}
        className={className}
      />
    );
  }
  return (
    <Image
      src={photo.imageUrl}
      alt={alt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      placeholder="blur"
      blurDataURL={photo.blurDataUrl}
      className={className}
    />
  );
}
