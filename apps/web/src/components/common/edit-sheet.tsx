import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@scp/ui";

import { LocationPicker } from "./location-picker.js";
import { AddressAutocomplete } from "./address-autocomplete.js";

export type EditSheetField = {
  label: string;
  max?: number;
  maxLength?: number;
  min?: number;
  name: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  type?: "email" | "number" | "select" | "textarea" | "text" | "location" | "address";
};

type Values = Record<string, string | number | null | undefined>;

function asInputValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function parseValue(field: EditSheetField, value: string) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return undefined;
  }

  if (field.type === "number") {
    return Number(trimmed);
  }

  return trimmed;
}

export function EditSheet({
  description,
  fields,
  initialValues,
  onClose,
  onSubmit,
  submitLabel = "Save changes",
  title,
}: {
  description?: string;
  fields: EditSheetField[];
  initialValues: Values;
  onClose: () => void;
  onSubmit: (values: Values) => Promise<void>;
  submitLabel?: string;
  title: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.flatMap((field) =>
        field.type === "location"
          ? [
              ["latitude", asInputValue(initialValues["latitude"])],
              ["longitude", asInputValue(initialValues["longitude"])],
            ]
          : [[field.name, asInputValue(initialValues[field.name])]]
      )
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const requiredFields = useMemo(() => fields.filter((field) => field.required).map((field) => field.name), [fields]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const missing = requiredFields.find((fieldName) => !values[fieldName]);
    if (missing) {
      setError("Fill every required field before saving.");
      return;
    }

    const invalidNumber = fields.find((field) => {
      if (field.type !== "number" || !values[field.name]) {
        return false;
      }
      const parsed = Number(values[field.name]);
      return !Number.isFinite(parsed) || (field.min !== undefined && parsed < field.min) || (field.max !== undefined && parsed > field.max);
    });
    if (invalidNumber) {
      setError(`${invalidNumber.label} must be a valid number${invalidNumber.min !== undefined || invalidNumber.max !== undefined ? ` between ${invalidNumber.min ?? "-∞"} and ${invalidNumber.max ?? "∞"}` : ""}.`);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(
        Object.assign(
          {},
          ...fields.map((field) => {
            if (field.type === "location") {
              return { latitude: Number(values.latitude), longitude: Number(values.longitude) };
            }
            return { [field.name]: parseValue(field, values[field.name] ?? "") };
          })
        )
      );
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-overlay" role="presentation">
      <button aria-label="Close edit panel" className="sheet-scrim" onClick={onClose} type="button" />
      <aside aria-label={title} className="record-sheet">
        <header>
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <Button aria-label="Close" onClick={onClose} size="icon" type="button" variant="ghost">
            <X size={15} />
          </Button>
        </header>

        <form onSubmit={(event) => void submit(event)}>
          <div className="sheet-fields">
            {fields.map((field) => (
              <label className={field.type === "textarea" || field.type === "location" || field.type === "address" ? "span-2" : undefined} key={field.name}>
                <span>{field.label}</span>
                {field.type === "select" ? (
                  <select
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    required={field.required}
                    value={values[field.name] ?? ""}
                  >
                    {!field.required && <option value="">None</option>}
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    maxLength={field.maxLength}
                    value={values[field.name] ?? ""}
                  />
                ) : field.type === "location" ? (
                  <LocationPicker
                    latitude={Number(values["latitude"]) || 0}
                    longitude={Number(values["longitude"]) || 0}
                    onChange={(lat, lng) => setValues((current) => ({ ...current, latitude: String(lat), longitude: String(lng) }))}
                  />
                ) : field.type === "address" ? (
                  <AddressAutocomplete
                    placeholder={field.placeholder}
                    required={field.required}
                    value={values[field.name] ?? ""}
                    onChange={(val) => setValues((current) => ({ ...current, [field.name]: val }))}
                    onLocationFound={(lat, lng) => {
                      if (fields.some(f => f.type === "location")) {
                        setValues((current) => ({ ...current, latitude: String(lat), longitude: String(lng) }));
                      }
                    }}
                  />
                ) : (
                  <input
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder}
                    required={field.required}
                    max={field.max}
                    maxLength={field.maxLength}
                    min={field.min}
                    step={field.type === "number" ? "any" : undefined}
                    type={field.type ?? "text"}
                    value={values[field.name] ?? ""}
                  />
                )}
              </label>
            ))}
          </div>

          {error && <p className="sheet-error">{error}</p>}

          <footer>
            <Button disabled={saving} onClick={onClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={saving} type="submit" variant="primary">
              {saving ? "Saving..." : submitLabel}
            </Button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
