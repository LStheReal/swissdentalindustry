"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function NewNewsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Neue News
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <Link
            href="/admin/news/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="text-lg">✏️</span>
            <div>
              <p className="font-medium">Blog-Beitrag</p>
              <p className="text-xs text-slate-400">Eigenen Text verfassen</p>
            </div>
          </Link>
          <div className="border-t border-slate-100" />
          <Link
            href="/admin/news/new-link"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="text-lg">🔗</span>
            <div>
              <p className="font-medium">Link einfügen</p>
              <p className="text-xs text-slate-400">Externe URL verlinken</p>
            </div>
          </Link>
          <div className="border-t border-slate-100" />
          <Link
            href="/admin/news/new-youtube"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="text-lg">▶️</span>
            <div>
              <p className="font-medium">YouTube Video</p>
              <p className="text-xs text-slate-400">Video einbetten</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
