import { useCallback } from 'react';
import { KBarResults, useMatches } from 'kbar';
import ResultItem from './result-item';
import type { Action } from 'kbar';

export default function RenderResults() {
  const { results, rootActionId } = useMatches();

  const renderItem = useCallback(
    ({ item, active }: { item: Action | string; active: boolean }) => {
      if (typeof item === 'string') {
        return <div className='text-muted-foreground px-4 py-2 text-sm uppercase'>{item}</div>;
      }
      return <ResultItem action={item} active={active} currentRootActionId={rootActionId ?? ''} />;
    },
    [rootActionId]
  );

  return <KBarResults items={results} onRender={renderItem} />;
}
