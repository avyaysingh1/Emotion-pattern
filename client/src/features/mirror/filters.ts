export type MirrorFilterId = "natural" | "soft" | "warm" | "cool" | "mono" | "sepia" | "vivid";

export type MirrorFilter = {
  id: MirrorFilterId;
  label: string;
  css: string;
  swatch: string;
};

export const MIRROR_FILTERS: readonly MirrorFilter[] = [
  {
    id: "natural",
    label: "Natural",
    css: "none",
    swatch: "linear-gradient(135deg, #ead1bb 0 34%, #9ca987 34% 68%, #465748 68%)",
  },
  {
    id: "soft",
    label: "Soft",
    css: "brightness(1.06) saturate(.78) contrast(.94)",
    swatch: "linear-gradient(135deg, #f0e5d8 0 34%, #c5d8bf 34% 68%, #e7c7c3 68%)",
  },
  {
    id: "warm",
    label: "Warm",
    css: "sepia(.18) saturate(1.12) hue-rotate(-8deg)",
    swatch: "linear-gradient(135deg, #e6ab7c 0 34%, #b27d55 34% 68%, #684338 68%)",
  },
  {
    id: "cool",
    label: "Cool",
    css: "saturate(.9) hue-rotate(11deg) brightness(1.04)",
    swatch: "linear-gradient(135deg, #dce7ef 0 34%, #8ba9b6 34% 68%, #43596d 68%)",
  },
  {
    id: "mono",
    label: "Mono",
    css: "grayscale(1) contrast(1.06)",
    swatch: "linear-gradient(135deg, #f2f1ec 0 34%, #aaaaa6 34% 68%, #3b3b3b 68%)",
  },
  {
    id: "sepia",
    label: "Sepia",
    css: "sepia(.72) saturate(.9)",
    swatch: "linear-gradient(135deg, #e7d1a8 0 34%, #b99562 34% 68%, #644a32 68%)",
  },
  {
    id: "vivid",
    label: "Vivid",
    css: "saturate(1.35) contrast(1.06)",
    swatch: "linear-gradient(135deg, #f4bd79 0 34%, #61a796 34% 68%, #4f5740 68%)",
  },
];
