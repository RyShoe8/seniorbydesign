import Image, { type ImageProps } from 'next/image';

type SeoImageBaseProps = {
  alt: string;
  className?: string;
  sizes?: string;
  unoptimized?: boolean;
  quality?: number;
  onError?: ImageProps['onError'];
};

type SeoImageFillProps = SeoImageBaseProps & {
  fill: true;
  width?: never;
  height?: never;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
};

type SeoImageSizedProps = SeoImageBaseProps & {
  fill?: false;
  width: number;
  height: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
};

export type SeoImageProps = (SeoImageFillProps | SeoImageSizedProps) & {
  src: ImageProps['src'];
  style?: ImageProps['style'];
};

/**
 * next/image wrapper for public SEO images.
 * Use fill only when the parent has position:relative and a defined aspect ratio or height.
 * Defaults: loading="lazy" unless priority is set (then eager).
 */
export default function SeoImage({
  alt,
  src,
  className,
  sizes,
  unoptimized,
  quality,
  onError,
  style,
  priority = false,
  loading,
  ...rest
}: SeoImageProps) {
  const resolvedLoading = loading ?? (priority ? 'eager' : 'lazy');

  if ('fill' in rest && rest.fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        unoptimized={unoptimized}
        quality={quality}
        onError={onError}
        style={style}
        priority={priority}
        loading={priority ? undefined : resolvedLoading}
      />
    );
  }

  const { width, height } = rest as SeoImageSizedProps;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      unoptimized={unoptimized}
      quality={quality}
      onError={onError}
      style={style}
      priority={priority}
      loading={priority ? undefined : resolvedLoading}
    />
  );
}
