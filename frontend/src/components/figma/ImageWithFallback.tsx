export function ImageWithFallback({ src, alt, className, style }: any) {
  return <img src={src} alt={alt} className={className} style={style} />;
}