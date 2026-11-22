import type { SVGProps } from 'react';

export function SimpleGantLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="#246B59" height="32" rx="9" width="32" />
      <rect fill="#F7FBF9" height="4" rx="2" width="12" x="5" y="6" />
      <rect fill="#BFD9CF" height="4" rx="2" width="17" x="9" y="14" />
      <rect fill="#E9CFA4" height="4" rx="2" width="14" x="5" y="22" />
      <path d="M22.5 5.5V26.5" stroke="#F7FBF9" strokeLinecap="round" strokeOpacity="0.72" />
      <circle cx="22.5" cy="5.5" fill="#F7FBF9" r="1.5" />
    </svg>
  );
}
