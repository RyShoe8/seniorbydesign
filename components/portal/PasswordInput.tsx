"use client";
import { useState, type InputHTMLAttributes } from "react";

/** A password field with a button that shows what was typed, so mistakes are easy to spot. */
export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="portal-password">
      <input {...props} type={visible ? "text" : "password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <button
        type="button"
        className="portal-password-toggle"
        aria-pressed={visible}
        aria-label="Show password"
        onClick={() => setVisible(!visible)}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </span>
  );
}
