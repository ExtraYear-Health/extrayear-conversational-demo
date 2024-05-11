import { Avatar } from '@nextui-org/react';

export interface HeaderProps {
  avatarImage?: string;
  name?: string;
  job?: string;
}

export function Header({
  avatarImage,
  name,
  job,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-default-50/60 z-50 backdrop-blur-md h-[64px] fixed top-0 left-0 right-0">
      <div className="flex items-center gap-3">
        <Avatar src={avatarImage} />
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{job}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
      </div>
    </header>
  );
};
