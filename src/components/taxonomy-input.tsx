import { useId } from "react";
import { Input } from "@/components/ui/input";

/**
 * Input with taxonomy-backed suggestions.
 *
 * Uses a native <datalist>, so it stays keyboard accessible, works in RTL and
 * never blocks the user from typing their own wording — the taxonomy suggests,
 * it does not decide.
 */
export function TaxonomyInput({
  value,
  onChange,
  options,
  placeholder,
  id,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const listId = `${useId()}-taxonomy`;
  return (
    <>
      <Input
        id={id}
        list={listId}
        className={className}
        aria-label={ariaLabel}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}
