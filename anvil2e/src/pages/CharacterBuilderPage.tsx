import { useCharacterBuilder } from "@/store/character-builder"
import { WizardStepper } from "@/components/character/WizardStepper"
import { AncestryStep } from "@/components/character/steps/AncestryStep"
import { BackgroundStep } from "@/components/character/steps/BackgroundStep"
import { ClassStep } from "@/components/character/steps/ClassStep"
import { useNavigate } from "react-router"

const STEPS = [
  { label: "Ancestry", description: "Choose your heritage" },
  { label: "Background", description: "Select your past" },
  { label: "Class", description: "Pick your profession" },
  { label: "Abilities", description: "Assign ability scores" },
]

export function CharacterBuilderPage() {
  const navigate = useNavigate()
  const {
    currentStep,
    ancestry,
    background,
    class: classData,
    setCurrentStep,
    setAncestry,
    setBackground,
    setClass,
    canProceed,
  } = useCharacterBuilder()

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Final step - save character
      navigate("/characters")
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Character</h1>
        <p className="text-slate-400 mt-1">Build your Pathfinder 2e character step by step</p>
      </div>

      {/* Stepper */}
      <WizardStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(step) => {
          // Only allow clicking previous steps
          if (step < currentStep) {
            setCurrentStep(step)
          }
        }}
      />

      {/* Step content */}
      <div className="min-h-[500px] bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        {currentStep === 0 && (
          <AncestryStep selected={ancestry} onSelect={setAncestry} />
        )}
        {currentStep === 1 && (
          <BackgroundStep selected={background} onSelect={setBackground} />
        )}
        {currentStep === 2 && (
          <ClassStep selected={classData} onSelect={setClass} />
        )}
        {currentStep === 3 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Ability Scores</h2>
            <p className="text-slate-400">
              Ability score allocation coming soon...
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          ← Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          {currentStep === STEPS.length - 1 ? "Finish →" : "Next →"}
        </button>
      </div>
    </div>
  )
}
