import React, { useState } from "react";

export interface WizardStep {
  id: string;
  title: string;
  render: () => React.ReactNode;
  canProceed?: boolean;
}

interface WizardProps {
  title: string;
  steps: WizardStep[];
  onCancel: () => void;
  onFinish: () => void | Promise<void>;
  finishLabel?: string;
}

export default function Wizard({ title, steps, onCancel, onFinish, finishLabel = "Confirm" }: WizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: 560 }}>
        <h3>{title}</h3>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {steps.map((s, i) => (
            <div
              key={s.id}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 11,
                padding: "6px 4px",
                borderRadius: 6,
                background: i === stepIndex ? "var(--accent)" : "var(--bg)",
                color: i === stepIndex ? "var(--accent-contrast)" : "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              {i + 1}. {s.title}
            </div>
          ))}
        </div>

        <div style={{ minHeight: 160 }}>{step.render()}</div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <button className="btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {stepIndex > 0 && (
              <button className="btn secondary" onClick={() => setStepIndex((i) => i - 1)}>
                Back
              </button>
            )}
            {!isLast && (
              <button
                className="btn"
                disabled={step.canProceed === false}
                onClick={() => setStepIndex((i) => i + 1)}
              >
                Next
              </button>
            )}
            {isLast && (
              <button
                className="btn"
                disabled={step.canProceed === false || submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onFinish();
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? "Please wait..." : finishLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
