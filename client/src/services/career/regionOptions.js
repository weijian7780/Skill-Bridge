export const regionOptions = [
  { id: "all-malaysia", label: "All Malaysia", searchValue: "Malaysia", analysisCopy: "across Malaysia" },
  { id: "remote-malaysia", label: "Remote Malaysia", searchValue: "Remote Malaysia", analysisCopy: "in Remote Malaysia" },
  { id: "sabah", label: "Sabah", searchValue: "Sabah, Malaysia", analysisCopy: "in Sabah" },
  { id: "sarawak", label: "Sarawak", searchValue: "Sarawak, Malaysia", analysisCopy: "in Sarawak" },
  { id: "selangor", label: "Selangor", searchValue: "Selangor, Malaysia", analysisCopy: "in Selangor" },
  { id: "kuala-lumpur", label: "Kuala Lumpur", searchValue: "Kuala Lumpur, Malaysia", analysisCopy: "in Kuala Lumpur" },
  { id: "penang", label: "Penang", searchValue: "Penang, Malaysia", analysisCopy: "in Penang" },
  { id: "johor", label: "Johor", searchValue: "Johor, Malaysia", analysisCopy: "in Johor" },
  { id: "perak", label: "Perak", searchValue: "Perak, Malaysia", analysisCopy: "in Perak" },
  { id: "pahang", label: "Pahang", searchValue: "Pahang, Malaysia", analysisCopy: "in Pahang" },
  { id: "kelantan", label: "Kelantan", searchValue: "Kelantan, Malaysia", analysisCopy: "in Kelantan" },
  { id: "terengganu", label: "Terengganu", searchValue: "Terengganu, Malaysia", analysisCopy: "in Terengganu" },
  { id: "kedah", label: "Kedah", searchValue: "Kedah, Malaysia", analysisCopy: "in Kedah" },
  { id: "negeri-sembilan", label: "Negeri Sembilan", searchValue: "Negeri Sembilan, Malaysia", analysisCopy: "in Negeri Sembilan" },
  { id: "melaka", label: "Melaka", searchValue: "Melaka, Malaysia", analysisCopy: "in Melaka" },
  { id: "perlis", label: "Perlis", searchValue: "Perlis, Malaysia", analysisCopy: "in Perlis" },
  { id: "putrajaya", label: "Putrajaya", searchValue: "Putrajaya, Malaysia", analysisCopy: "in Putrajaya" },
  { id: "labuan", label: "Labuan", searchValue: "Labuan, Malaysia", analysisCopy: "in Labuan" },
];

const regionAliases = new Map([
  ["malaysia", "all-malaysia"],
  ["all malaysia", "all-malaysia"],
  ["remote", "remote-malaysia"],
  ["remote malaysia", "remote-malaysia"],
  ["sabah, malaysia", "sabah"],
  ["kuala lumpur", "kuala-lumpur"],
  ["kuala lumpur, malaysia", "kuala-lumpur"],
]);

export function normaliseRegionId(region) {
  const value = String(region || "").trim();
  const directMatch = regionOptions.find((option) => option.id === value);
  if (directMatch) {
    return directMatch.id;
  }

  const labelMatch = regionOptions.find((option) => option.label.toLowerCase() === value.toLowerCase());
  if (labelMatch) {
    return labelMatch.id;
  }

  return regionAliases.get(value.toLowerCase()) ?? "all-malaysia";
}

export function getRegionOption(region) {
  const regionId = normaliseRegionId(region);
  return regionOptions.find((option) => option.id === regionId) ?? regionOptions[0];
}

export function getRegionSearchValue(region) {
  return getRegionOption(region).searchValue;
}

export function getRegionAnalysisCopy(region) {
  return getRegionOption(region).analysisCopy;
}
