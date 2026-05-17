import { ReactNode } from "react";
import { NeuCard } from "./ui";

export function EmptyState({ icon: Icon, title, hint, action }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; title: string; hint?: string; action?: ReactNode }) {
  return (
    <NeuCard className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="font-display font-semibold text-lg">{title}</div>
      {hint && <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </NeuCard>
  );
}