import { Avatar } from '@nextui-org/react';

import { VerifiedIcon } from '../icons/VerifiedIcon';

export interface HeaderProps {
  avatarImage?: string;
  isTyping?: boolean;
  job?: string;
  name?: string;
}

export function Header({
  avatarImage,
  isTyping,
  job,
  name,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-default-100/50 z-50 backdrop-blur-md h-[64px]">
      <div className="flex items-center gap-3">
        <Avatar src={avatarImage} />
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium">
              {name}
            </div>
            <VerifiedIcon className="text-primary-500" />
          </div>
          <div className={`text-xs text-gray-500 dark:text-gray-400 ${isTyping ? 'italic' : ''}`}>
            {true ? 'typing...' : job}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
      </div>
    </header>
  );
};
