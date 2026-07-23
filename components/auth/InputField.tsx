import type { InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function InputField({ label, id, className, ...props }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-foreground/90">
        {label}
      </label>
      <input
        id={id}
        className={[
          "input-cosmic h-11 w-full rounded-lg px-3 text-sm text-foreground placeholder:text-foreground/40",
          className ?? "",
        ].join(" ")}
        {...props}
      />
    </div>
  );
}
