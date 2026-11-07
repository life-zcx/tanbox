import assets from '../../data/bannerAssets.json';

// A hidden <img> still downloads. Art direction selects an inline placeholder
// below the desktop breakpoint, so no decorative banner is transferred there.
export function ResponsiveBanner({ src, alt, className, width, height, eager = false }: {
  src: string; alt: string; className?: string; width?: number; height?: number; eager?: boolean;
}) {
  const asset = (assets as Record<string, { src: string; width: number; height: number }>)[src.split('?')[0]];
  return <picture>
    <source media="(min-width: 768px)" srcSet={asset?.src || src} />
    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E" alt={alt}
      width={width || asset?.width} height={height || asset?.height} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  </picture>;
}
