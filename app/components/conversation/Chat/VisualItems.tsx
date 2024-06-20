import { Chip, Image } from '@nextui-org/react';
import { useEffect, useState } from 'react';

import { useConversation } from '../context';

function VisualItem({ item }: { item?: string }) {
  const [src, setSrc] = useState<string>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    if (!src && !error) {
      fetch('/api/visualize-item', {
        method: 'POST',
        body: JSON.stringify({ item }),
      })
        .then((response) => response.json())
        .then((data) => setSrc(data.url))
        .catch((error) => setError(error));
    }
  }, [item, src, error]);

  return <Image isBlurred src={src} alt={item} />;
}

export function VisualItems() {
  const { visualItems } = useConversation();

  return (
    <div className="flex flex-col">
      <div className="flex px-3 gap-2 justify-center flex-wrap">
        {visualItems.map((item) => (
          <Chip key={item}>{item}</Chip>
        ))}
      </div>

      <div className="flex gap-2 md:gap-3 px-3 mt-5 md:max-w-[960px] mx-auto">
        {visualItems.map((item) => (
          <VisualItem key={item} item={item} />
        ))}
      </div>
    </div>
  );
}
