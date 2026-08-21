"use client";

import { motion } from "framer-motion";
import { cx } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="mb-6 flex gap-1 rounded-2xl bg-sage-light/60 p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cx(
              "relative flex-1 rounded-xl px-3 py-2 text-[14px] font-medium transition-colors",
              isActive ? "text-primary-dark" : "text-muted hover:text-ink",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="tabs-active-pill"
                className="absolute inset-0 rounded-xl bg-surface shadow-soft"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            ) : null}
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
