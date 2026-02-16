import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WORKFLOW_STEPS, type ProjectStatus } from '@/types/project';

interface WorkflowProgressProps {
  currentStep: ProjectStatus;
  onStepClick?: (step: ProjectStatus) => void;
}

export function WorkflowProgress({ currentStep, onStepClick }: WorkflowProgressProps) {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center overflow-x-auto scrollbar-thin px-4 py-3 bg-card/50 backdrop-blur rounded-xl border border-border gap-0 min-w-0">
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isClickable = index <= currentIndex && onStepClick;

        return (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2 transition-all duration-200",
                isClickable && "cursor-pointer hover:opacity-80",
                !isClickable && "cursor-default"
              )}
            >
              <div
                className={cn(
                  "step-indicator",
                  isCompleted && "completed bg-success",
                  isActive && "active",
                  !isCompleted && !isActive && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive && "text-primary",
                    isCompleted && "text-success",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </button>

            {index < WORKFLOW_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 mx-2 transition-colors duration-300",
                  index < currentIndex ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
