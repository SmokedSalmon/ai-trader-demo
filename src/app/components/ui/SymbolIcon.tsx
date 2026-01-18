import Image, { ImageProps } from "next/image";
import { getSymbolLogo } from "../portfolio/logoAssets";

interface SymbolIconProp extends Omit<ImageProps, 'src'> {
    symbol: string
}

export default function SymbolIcon({ symbol, alt, width, height, className }: SymbolIconProp) {
    const src = getSymbolLogo(symbol)?.src
    return <Image
        src={src} 
        alt={alt} 
        className={className}
        width={width}
        height={height}
        onError={(e) => {
            // Fallback to a default icon if the specific one fails to load
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = getSymbolLogo('DEFAULT').src;
        }}
    />
}