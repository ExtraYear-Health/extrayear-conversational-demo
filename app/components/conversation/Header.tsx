import { Avatar } from "@nextui-org/react";

export interface HeaderProps {
  name?: string
  job?: string
}

export function Header({
  name,
  job
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800 ">
      <div className="flex items-center gap-3">
        <Avatar src="/devin_clark.svg" />
        <div>
          <div className="font-medium">Devin Clark</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Cognitive Therapist</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
      </div>
    </header>
  )
};