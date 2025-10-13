
import React from 'react';

export const SearchIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export const ChevronLeftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>
);

export const WhatsAppIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M16.75 13.96c.25.13.43.2.5.25.13.06.14.25.12.38-.02.12-.25.37-.38.5-.12.12-.25.18-.5.12-.25-.06-1.12-.37-2.12-1.25-.81-.69-1.25-1.5-1.38-1.75-.12-.25-.06-.38.06-.5s.25-.25.38-.38c.12-.12.18-.25.25-.37s.06-.25 0-.38c-.06-.12-.5-.12-1-1.12s-1-1-1.12-1c-.13 0-.25 0-.38.06s-.37.12-.5.25-.5.62-.5 1.25.5 1.5 1 1.62.75.81 1.25 1.25 1.13 1.06 1.88 1.5c.69.38 1.12.5 1.5.62.38.13.63.12.88.06.25-.06.75-.31.88-.62.12-.25.12-.5 0-.62-.12-.12-.25-.18-.38-.25s-.25-.12-.5-.25zM12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10c-1.29 0-2.52-.25-3.66-.69L2 22l1.38-4.5C2.5 15.66 2 13.88 2 12 2 6.48 6.48 2 12 2zm0 2c-4.42 0-8 3.58-8 8 0 1.73.56 3.35 1.5 4.7l-1 3.25 3.38-1.03A7.94 7.94 0 0 0 12 20c4.42 0 8-3.58 8-8s-3.58-8-8-8z"></path></svg>
);

export const PlusCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
);

export const MinusCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
);

export const ShoppingCartIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
);

// Brand icons
export const FacebookIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="currentColor"
        className={className}
    >
        <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24h11.495v-9.294H9.691V11.02h3.129V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.917c-1.504 0-1.796.715-1.796 1.764v2.31h3.587l-.467 3.686h-3.12V24h6.116C23.403 24 24 23.403 24 22.676V1.325C24 .597 23.403 0 22.675 0z" />
    </svg>
);

export const InstagramIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="currentColor"
        className={className}
    >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.427.403a4.92 4.92 0 0 1 1.78 1.16 4.92 4.92 0 0 1 1.16 1.78c.163.457.35 1.257.403 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.427a4.92 4.92 0 0 1-1.16 1.78 4.92 4.92 0 0 1-1.78 1.16c-.457.163-1.257.35-2.427.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.427-.403a4.92 4.92 0 0 1-1.78-1.16 4.92 4.92 0 0 1-1.16-1.78c-.163-.457-.35-1.257-.403-2.427C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.427a4.92 4.92 0 0 1 1.16-1.78 4.92 4.92 0 0 1 1.78-1.16c.457-.163 1.257-.35 2.427-.403C8.416 2.175 8.796 2.163 12 2.163zm0 1.837c-3.157 0-3.532.012-4.781.069-.98.045-1.511.208-1.863.346-.469.181-.803.398-1.153.748-.35.35-.567.684-.748 1.153-.138.352-.301.883-.346 1.863-.057 1.249-.069 1.624-.069 4.781s.012 3.532.069 4.781c.045.98.208 1.511.346 1.863.181.469.398.803.748 1.153.35.35.684.567 1.153.748.352.138.883.301 1.863.346 1.249.057 1.624.069 4.781.069s3.532-.012 4.781-.069c.98-.045 1.511-.208 1.863-.346.469-.181.803-.398 1.153-.748.35-.35.567-.684 0-.748-.138-.352-.301-.883-.346-1.863-.057-1.249-.069-1.624-.069-4.781s.012-3.532.069-4.781c.045-.98.208-1.511.346-1.863.181-.469.398-.803.748-1.153.35-.35.684-.567 1.153-.748.352-.138.883-.301 1.863-.346 1.249-.057 1.624-.069 4.781-.069zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.168a4.006 4.006 0 1 1 0-8.012 4.006 4.006 0 0 1 0 8.012zm6.406-10.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
    </svg>
);
