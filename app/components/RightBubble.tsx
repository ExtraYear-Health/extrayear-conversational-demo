import { TextContent } from './TextContext';

interface RightBubbleProps {
  text?: string;
}

export const RightBubble = ({ text }: RightBubbleProps) => {
  return (
    <div className="col-start-2 md:col-start-6 xl:col-start-8 col-end-13 px-3 pt-3">
      <div className="flex justify-start flex-row-reverse gap-2">
        <div className="relative text-sm py-3 px-4 shadow rounded-s-xl rounded-ee-xl bg-gradient-to-r from-primary-400 to-primary-500">
          <div className="text-sm font-normal text-white/80 markdown min-w-[10em]">
            <TextContent text={text ?? ''} />
          </div>
        </div>
      </div>
    </div>
  );
};
