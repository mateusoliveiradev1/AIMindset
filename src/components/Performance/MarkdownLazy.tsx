import React, { Suspense } from 'react';

// Carrega ReactMarkdown e remark-gfm sob demanda em um chunk separado
const ReactMarkdownLazy = React.lazy(async () => {
  const [md, gfm] = await Promise.all([
    import('react-markdown'),
    import('remark-gfm')
  ]);
  return {
    default: (props: any) => (
      <md.default remarkPlugins={[gfm.default]} {...props} />
    )
  };
});

export function MarkdownLazy(props: any) {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando pré-visualização...</div>}>
      <ReactMarkdownLazy {...props} />
    </Suspense>
  );
}