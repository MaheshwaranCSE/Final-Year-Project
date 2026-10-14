import React from 'react';

export interface BlockVaultLogoProps {
  size?: number;
  color?: string;
}

const BlockVaultLogo: React.FC<BlockVaultLogoProps> = ({ size = 32, color = '#3B82F6' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield Outline */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      
      {/* Vault Keyhole */}
      <circle cx="12" cy="11" r="2" />
      <path d="M11 13h2v3h-2z" fill={color} />
      
      {/* Blockchain Nodes */}
      <circle cx="8" cy="8" r="1" fill={color} stroke="none" />
      <circle cx="16" cy="8" r="1" fill={color} stroke="none" />
      <path d="M8 8l4-3 4 3" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
};

export default BlockVaultLogo;
