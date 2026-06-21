"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  formId: string;
  initialLogoUrl: string | null;
}

export function LogoUploadField({ formId, initialLogoUrl }: Props) {
  const [selectedObjectUrl, setSelectedObjectUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = selectedObjectUrl ?? initialLogoUrl;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedObjectUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return null;
      });
      setSelectedFileName(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedObjectUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return objectUrl;
    });
    setSelectedFileName(file.name);
  }

  useEffect(() => {
    return () => {
      if (selectedObjectUrl) URL.revokeObjectURL(selectedObjectUrl);
    };
  }, [selectedObjectUrl]);

  const [removeLogo, setRemoveLogo] = useState(false);
  const previewUrlFinal = removeLogo ? null : previewUrl;

  const statusText = previewUrlFinal
    ? null
    : selectedFileName
    ? selectedFileName
    : "Kein Logo ausgewählt";

  function handleRemove() {
    setRemoveLogo(true);
    setSelectedFileName(null);
    setSelectedObjectUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  const hasLogo = !!previewUrlFinal;

  return (
    <section className="border border-[#e2e2e7] bg-[#fafaf8] p-4">
      <div className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
        Logo
      </div>

      <div className="mt-3 flex h-[132px] items-center justify-center rounded-[2px] border border-[#e2e2e7] bg-white">
        {previewUrlFinal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrlFinal} alt="" className="max-h-28 max-w-full object-contain p-2" />
        ) : (
          <span className="font-sdi-mono text-lg font-bold tracking-[0.04em] text-[#c4c4cc]">
            SDI
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        form={formId}
        name="logo"
        type="file"
        accept="image/*"
        onChange={(e) => { setRemoveLogo(false); handleFileChange(e); }}
        className="sr-only"
      />
      <input form={formId} type="hidden" name="remove_logo" value={removeLogo ? "1" : "0"} />

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-2 text-[12px] font-semibold text-[#0a0a0b] hover:bg-[#f2f2f0] active:bg-[#e8e8e5]"
        >
          {hasLogo ? "Logo ändern" : "Datei auswählen"}
        </button>
        {hasLogo && (
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 rounded-[3px] border border-[#e1000f] px-3 py-2 text-[12px] font-semibold text-[#e1000f] hover:bg-[#fdecec] active:bg-[#fad9d9]"
          >
            Entfernen
          </button>
        )}
        {statusText && (
          <span className="font-sdi-mono truncate text-[11px] text-[#9595a0]">
            {statusText}
          </span>
        )}
      </div>
    </section>
  );
}
