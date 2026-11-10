import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-2">

      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-[350px]" />
        <Skeleton className="h-5 w-[200px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-4 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px] mt-2" />
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
                <Skeleton className="h-8 w-[90px] rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[200px] mt-2" />
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-xl flex gap-4">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[80%]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}