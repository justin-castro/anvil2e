/**
 * Wizard stepper component
 * Shows current step and progress in character creation
 */

interface Step {
  label: string
  description: string
}

interface WizardStepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isComplete = index < currentStep
          const isClickable = onStepClick && index < currentStep

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step circle */}
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
                  transition-all
                  ${isActive ? "bg-blue-600 text-white ring-4 ring-blue-600/20" : ""}
                  ${isComplete ? "bg-green-600 text-white" : ""}
                  ${!isActive && !isComplete ? "bg-slate-800 text-slate-400 border-2 border-slate-700" : ""}
                  ${isClickable ? "cursor-pointer hover:scale-110" : "cursor-default"}
                `}
              >
                {isComplete ? "✓" : index + 1}
              </button>

              {/* Step label */}
              <div className="ml-3 flex-1">
                <div className={`text-sm font-semibold ${isActive ? "text-blue-400" : "text-slate-300"}`}>
                  {step.label}
                </div>
                <div className="text-xs text-slate-500">{step.description}</div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 bg-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isComplete ? "bg-green-600 w-full" : "bg-slate-800 w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
