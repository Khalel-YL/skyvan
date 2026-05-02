"use client";

import type { SelectHTMLAttributes } from "react";

type AutoSubmitSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function AutoSubmitSelect(props: AutoSubmitSelectProps) {
  return (
    <select
      {...props}
      onChange={(event) => {
        props.onChange?.(event);
        event.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
