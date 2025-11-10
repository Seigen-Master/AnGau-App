import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string | ReactNode;
  children?: ReactNode; // For action buttons etc.
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline md:text-3xl">
            {title}
          </h1>
          {description && (
            <div className="mt-1 text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {children && <div className="flex shrink-0 gap-2">{children}</div>}
      </div>
    </div>
  );
}
