import { Avatar } from '@nextui-org/react';
import { BadgeCheck } from 'lucide-react';

export interface HeaderProps {
  avatarImage?: string;
  isResponding?: boolean;
  job?: string;
  name?: string;
}

export function Header({ avatarImage, isResponding, job, name }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-default-100/50 z-50 backdrop-blur-md h-[64px]">
      <div className="flex items-center gap-3 max-w-full overflow-hidden">
        <Avatar src={avatarImage} />
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="font-regular truncate">{name}</div>
            <BadgeCheck size={18} className="-mt-0.5 text-primary-500" />
          </div>
          <div
            className={`text-xs text-gray-500 light:text-gray-400 ${isResponding ? 'italic' : ''}`}
          >
            {isResponding ? 'responding...' : job}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2"></div>
    </header>
  );
}
