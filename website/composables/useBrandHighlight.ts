const BRAND_SPAN = '<span class="text-[#7C3AED] font-bold">klangbild</span>';

export const useBrandHighlight = () => {
  const highlight = (text: string) => text.replace(/klangbild/g, BRAND_SPAN);

  return { highlight };
};
