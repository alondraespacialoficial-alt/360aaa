import React from 'react';
import { FacebookIcon, InstagramIcon } from './icons';
import { CHARLITRON_FACEBOOK_URL, CHARLITRON_INSTAGRAM_URL } from '../env';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'fill' | 'outline';

interface SocialButtonsProps {
  className?: string;
  size?: Size;
  align?: 'left' | 'center' | 'right';
  variant?: Variant;
}

const sizeClasses: Record<Size, { btn: string; icon: string }> = {
  sm: { btn: 'px-3 py-1 text-sm', icon: 'h-4 w-4' },
  md: { btn: 'px-4 py-2 text-base', icon: 'h-5 w-5' },
  lg: { btn: 'px-5 py-2 text-lg', icon: 'h-6 w-6' },
};

/**
 * SocialButtons: Botones de Facebook e Instagram con diseño responsivo.
 * - En móvil: iconos con texto reducido (el texto se oculta si es necesario).
 * - En pantallas medianas en adelante: botones tipo "pill" con icono + etiqueta.
 */
export const SocialButtons: React.FC<SocialButtonsProps> = ({ className = '', size = 'md', align = 'center', variant = 'fill' }) => {
  const s = sizeClasses[size];
  const containerAlign = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
  const facebookClasses = variant === 'fill'
    ? `rounded-full bg-blue-600 text-white hover:bg-blue-700`
    : `rounded-full border border-blue-600 text-blue-700 bg-white hover:bg-blue-50`;
  const instagramClasses = variant === 'fill'
    ? `rounded-full bg-pink-600 text-white hover:bg-pink-700`
    : `rounded-full border border-pink-600 text-pink-700 bg-white hover:bg-pink-50`;

  return (
    <div className={`flex items-center ${containerAlign} gap-3 ${className}`}>
      <a
        href={CHARLITRON_FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 transition ${s.btn} ${facebookClasses}`}
        aria-label="Facebook Charlitron Eventos 360"
      >
        <FacebookIcon className={s.icon} />
        <span className="hidden sm:inline">Facebook</span>
      </a>
      <a
        href={CHARLITRON_INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 transition ${s.btn} ${instagramClasses}`}
        aria-label="Instagram Charlitron Eventos 360"
      >
        <InstagramIcon className={s.icon} />
        <span className="hidden sm:inline">Instagram</span>
      </a>
    </div>
  );
};

export default SocialButtons;
