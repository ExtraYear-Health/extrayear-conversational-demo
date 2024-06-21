'use client';

import { Card, CardProps, Image } from '@nextui-org/react';

function getIcon(icon: string) {
  try {
    const Icon = require(`lucide-react/dist/esm/icons/${icon}.js`).default;
    return <Icon />;
  } catch (error) {
    return null;
  }
}

export interface ActivityCardProps extends CardProps {
  therapistName?: string;
  avatarUrl?: string;
  category?: string;
  description?: string;
  icon?: string;
  selected?: boolean;
  title?: string;
}

export function ActivityCard({
  therapistName,
  avatarUrl,
  category,
  description,
  icon,
  selected,
  title,
  ...props
}: ActivityCardProps) {
  return (
    <Card
      className={`shrink-0 p-4 md:p-5 bg-white w-[280px] md:w-[300px] cursor-pointer text-left border-[4px] rounded-2xl md:rounded-3xl ${selected ? 'border-primary-500' : ''}`}
      isHoverable
      isPressable
      role="button"
      shadow="sm"
      {...props}
    >
      <div className="flex flex-col h-full w-full gap-8 w-full">
        <div>
          <p className="text-sm md:text-base text-slate-500">
            w/ {therapistName} · {category}
          </p>
          <h4 className="text-lg md:text-xl font-semibold truncate">{title}</h4>
        </div>

        <div className="flex-1 flex justify-center relative">
          <div className="relative">
            {icon && (
              <div className="bg-white absolute top-[-16px] left-[-16px] z-20 rounded-full w-[50px] h-[50px] flex items-center justify-center text-slate-500">
                {getIcon(icon)}
              </div>
            )}

            <Image
              isBlurred
              shadow="md"
              src={avatarUrl}
              alt={therapistName}
              className="rotate-2 rounded-2xl w-[150px] md:w-[175px]"
            />
          </div>
        </div>

        {description && (
          <div className="mt-2">
            <p className="text-xs md:text-sm text-slate-500">{description}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
