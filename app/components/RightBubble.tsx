import { Message } from "ai/react";
import { MessageMeta } from "./MessageMeta";
import { TextContent } from "./TextContext";
import { UserAvatar } from "./UserAvatar";
import { extractResponseText } from "../lib/helpers";

export const RightBubble = ({
  message,
  text,
}: {
  message?: Message;
  text?: string;
}) => {
  return (
    <>
      <div className="col-start-6 col-end-13 p-3">
        <div className="flex justify-start flex-row-reverse gap-2">
          <div className="self-end md:self-start h-6 w-6 text-white shrink-0 pt-1 mt-1 rounded-full bg-black border border-zinc-300 overflow-hidden responsive-hide">
            <UserAvatar />
          </div>
          <div className="glass relative text-sm py-2 px-4 shadow rounded-s-xl rounded-ee-xl">
            <div className="text-sm font-normal text-white/80 markdown min-w-[10em]">
              <TextContent text={message?.content ?? text ?? ""} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};








// import { Message } from "ai/react";
// import { MessageMeta } from "./MessageMeta";
// import { TextContent } from "./TextContext";
// import { UserAvatar } from "./UserAvatar";
// import { extractResponseText } from "../lib/helpers";

// export const RightBubble = ({
//   message,
//   text,
// }: {
//   message?: Message;
//   text?: string;
// }) => {
//   // Extract response text from the message content if available
//   const responseText = message?.content ? extractResponseText(message.content) : null;

//   return (
//     <>
//       <div className="col-start-6 col-end-13 p-3">
//         <div className="flex justify-start flex-row-reverse gap-2">
//           <div className="h-6 w-6 text-white shrink-0 pt-1 mt-1 rounded-full bg-black border border-zinc-300 overflow-hidden responsive-hide">
//             <UserAvatar />
//           </div>
//           <div className="glass relative text-sm py-2 px-4 shadow rounded-s-xl rounded-ee-xl">
//             <div className="text-sm font-normal text-white/80 markdown min-w-[10em]">
//               {/* Use the extracted response text or fallback to the original text or an empty string */}
//               <TextContent text={responseText ?? text ?? ""} />
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

