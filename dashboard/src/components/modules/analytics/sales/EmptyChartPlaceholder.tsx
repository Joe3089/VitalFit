export function EmptyChartPlaceholder({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 h-[400px] bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mt-2 text-center max-w-[220px]">
        {description}
      </p>
    </div>
  );
}