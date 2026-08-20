import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const make = (d: string, viewBox = '0 0 24 24') => {
  const C: React.FC<IconProps> = ({ size = 24, className, style, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...rest}
    >
      <path d={d} />
    </svg>
  );
  C.displayName = `Icon(${d.slice(0, 12)})`;
  return C;
};

const makemulti = (children: React.ReactNode[]) => {
  const C: React.FC<IconProps> = ({ size = 24, className, style, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </svg>
  );
  return C;
};

export const LayoutDashboard = makemulti([
  <rect key="r1" width="7" height="9" x="3" y="3" rx="1" />,
  <rect key="r2" width="7" height="5" x="14" y="3" rx="1" />,
  <rect key="r3" width="7" height="9" x="14" y="12" rx="1" />,
  <rect key="r4" width="7" height="5" x="3" y="16" rx="1" />,
]);

export const Users = makemulti([
  <path key="p1" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />,
  <circle key="c1" cx="9" cy="7" r="4" />,
  <path key="p2" d="M22 21v-2a4 4 0 0 0-3-3.87" />,
  <path key="p3" d="M16 3.13a4 4 0 0 1 0 7.75" />,
]);

export const FolderKanban = makemulti([
  <path key="p1" d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />,
  <path key="p2" d="M8 10h2" />,
  <path key="p3" d="M12 10h2" />,
  <path key="p4" d="M8 14h2" />,
  <path key="p5" d="M12 14h2" />,
  <path key="p6" d="M8 18h2" />,
  <path key="p7" d="M12 18h2" />,
]);

export const Rocket = makemulti([
  <path key="p1" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91-2.18-2.18a2.4 2.4 0 0 0-2.91-.09z" />,
  <path key="p2" d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />,
  <path key="p3" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />,
  <path key="p4" d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />,
]);

export const Activity = make('M22 12h-4l-3 9L9 3l-3 9H2');

export const UserCog2 = makemulti([
  <path key="p1" d="M14 19a6 6 0 0 0-12 0" />,
  <circle key="c1" cx="8" cy="11" r="4" />,
  <circle key="c2" cx="19" cy="11" r="3" />,
  <path key="p2" d="M19 8v1" />,
  <path key="p3" d="m21.5 9.5-1 1" />,
  <path key="p4" d="M22 11h-1" />,
  <path key="p5" d="m21.5 12.5-1-1" />,
  <path key="p6" d="M19 13v-1" />,
  <path key="p7" d="m16.5 12.5 1-1" />,
  <path key="p8" d="M16 11h1" />,
  <path key="p9" d="m16.5 9.5 1 1" />,
]);

export const LogOut = makemulti([
  <path key="p1" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />,
  <polyline key="pl1" points="16 17 21 12 16 7" />,
  <line key="l1" x1="21" x2="9" y1="12" y2="12" />,
]);

export const Code2 = makemulti([
  <polyline key="pl1" points="16 18 22 12 16 6" />,
  <polyline key="pl2" points="8 6 2 12 8 18" />,
]);

export const Bell = makemulti([
  <path key="p1" d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />,
  <path key="p2" d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />,
]);

export const Menu = makemulti([
  <line key="l1" x1="4" x2="20" y1="12" y2="12" />,
  <line key="l2" x1="4" x2="20" y1="6" y2="6" />,
  <line key="l3" x1="4" x2="20" y1="18" y2="18" />,
]);

export const X = makemulti([
  <path key="p1" d="M18 6 6 18" />,
  <path key="p2" d="m6 6 12 12" />,
]);

export const Eye = makemulti([
  <path key="p1" d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />,
  <circle key="c1" cx="12" cy="12" r="3" />,
]);

export const EyeOff = makemulti([
  <path key="p1" d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />,
  <path key="p2" d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />,
  <path key="p3" d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39 1.61" />,
  <line key="l1" x1="2" x2="22" y1="2" y2="22" />,
]);

export const Loader2 = makemulti([
  <path key="p1" d="M21 12a9 9 0 1 1-6.219-8.56" fill="none" />,
]);

export const Plus = makemulti([
  <path key="p1" d="M5 12h14" />,
  <path key="p2" d="M12 5v14" />,
]);

export const TrendingUp = makemulti([
  <polyline key="pl1" points="22 7 13.5 15.5 8.5 10.5 2 17" />,
  <polyline key="pl2" points="16 7 22 7 22 13" />,
]);

export const CheckCircle2 = makemulti([
  <circle key="c1" cx="12" cy="12" r="10" />,
  <path key="p1" d="m9 12 2 2 4-4" />,
]);

export const AlertTriangle = makemulti([
  <path key="p1" d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />,
  <path key="p2" d="M12 9v4" />,
  <path key="p3" d="M12 17h.01" />,
]);

export const XCircle = makemulti([
  <circle key="c1" cx="12" cy="12" r="10" />,
  <path key="p1" d="m15 9-6 6" />,
  <path key="p2" d="m9 9 6 6" />,
]);

export const Clock = makemulti([
  <circle key="c1" cx="12" cy="12" r="10" />,
  <polyline key="pl1" points="12 6 12 12 16 14" />,
]);

export const RefreshCw = makemulti([
  <path key="p1" d="M3 12a9 9 0 0 1 15-6.7L21 8" />,
  <path key="p2" d="M21 3v5h-5" />,
  <path key="p3" d="M21 12a9 9 0 0 1-15 6.7L3 16" />,
  <path key="p4" d="M8 16H3v5" />,
]);

export const ChevronDown = make('m6 9 6 6 6-6');
export const ChevronUp = make('m18 15-6-6-6 6');
export const Play = make('M6 3l18 9-18 9V3z');

export const Shield = makemulti([
  <path key="p1" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
]);

export const UserCheck = makemulti([
  <path key="p1" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />,
  <circle key="c1" cx="9" cy="7" r="4" />,
  <polyline key="pl1" points="16 11 18 13 22 9" />,
]);

export const GitBranch = makemulti([
  <line key="l1" x1="6" x2="6" y1="3" y2="15" />,
  <circle key="c1" cx="18" cy="6" r="3" />,
  <circle key="c2" cx="6" cy="18" r="3" />,
  <path key="p1" d="M18 9a9 9 0 0 1-9 9" />,
]);
