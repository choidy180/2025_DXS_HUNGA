// utils/makeExcel.ts
import * as XLSX from "xlsx";

/* ================= Types ================= */
export type Ingredient = { name: string; value: number };
export type CaseItem = { id: string; title: string; ingredients: Ingredient[] };

export type CodeMapping = Record<string, string>; // 재료명 → 컬럼명 (ITEM_M_x / ITEM_T_x)

export type LabDefaults = Partial<{
  LAB_GID: string | number;
  LAB_YMD: string | number; // 예: 20251031
  LAB_TITLE: string;        // 예: "20251031 case - 1"
  LAB_BIGO01: string;
  LAB_EMP: string | number;
  LAB_NO: string | number;
  LAB_UNIT: string;         // 예: "Phr"
}>;

export type LabDefaultsInput =
  | LabDefaults
  | ((caseItem: CaseItem, index: number) => LabDefaults);

/* ============ Helpers: column sorting (M 우선, 숫자 오름차순) ============ */
const getColNum = (col: string) => {
  const m = col.match(/_(\d+)$/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
};
const sortColumns = (a: string, b: string) => {
  const am = a.startsWith("ITEM_M_");
  const bm = b.startsWith("ITEM_M_");
  if (am && !bm) return -1;
  if (!am && bm) return 1;
  return getColNum(a) - getColNum(b);
};

/* ================= Core: row builder ================= */
function buildRowFromCase(
  item: CaseItem,
  codeMapping: CodeMapping,
  allHeaders: string[],
  perCaseDefaults: LabDefaults
) {
  const row: Record<string, any> = {};
  for (const h of allHeaders) row[h] = "";

  // LAB_* 채우기
  row.LAB_GID = perCaseDefaults.LAB_GID ?? item.id;
  row.LAB_YMD = perCaseDefaults.LAB_YMD ?? "";
  row.LAB_TITLE =
    perCaseDefaults.LAB_TITLE ??
    `${perCaseDefaults.LAB_YMD ?? ""} ${item.title}`.trim();
  row.LAB_BIGO01 = perCaseDefaults.LAB_BIGO01 ?? "";
  row.LAB_EMP = perCaseDefaults.LAB_EMP ?? "";
  row.LAB_NO = perCaseDefaults.LAB_NO ?? "";
  row.LAB_UNIT = perCaseDefaults.LAB_UNIT ?? "Phr";

  // 동일 name 합산
  const agg = new Map<string, number>();
  for (const ing of item.ingredients || []) {
    const prev = agg.get(ing.name) ?? 0;
    agg.set(ing.name, prev + (Number(ing.value) || 0));
  }

  // 매핑 채우기
  for (const [name, sumValue] of agg) {
    const col = codeMapping[name];
    if (!col) continue;
    if (!allHeaders.includes(col)) continue;
    row[col] = sumValue;
  }

  return row;
}

/* ================= Export: XLSX ================= */
export function downloadXlsxFromCases(
  cases: CaseItem[],
  codeMapping: CodeMapping,
  labDefaults: LabDefaultsInput,
  filename = "output.xlsx"
) {
  const LAB_HEADERS = [
    "LAB_GID",
    "LAB_YMD",
    "LAB_TITLE",
    "LAB_BIGO01",
    "LAB_EMP",
    "LAB_NO",
    "LAB_UNIT",
  ];
  const mappedCols = Array.from(new Set(Object.values(codeMapping))).sort(sortColumns);
  const headers = [...LAB_HEADERS, ...mappedCols];

  const rows = cases.map((c, i) =>
    buildRowFromCase(
      c,
      codeMapping,
      headers,
      typeof labDefaults === "function" ? labDefaults(c, i) : labDefaults
    )
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers, skipHeader: false });
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}

/* ================= Export: CSV (옵션) ================= */
export function downloadCsvFromCases(
  cases: CaseItem[],
  codeMapping: CodeMapping,
  labDefaults: LabDefaultsInput,
  filename = "output.csv"
) {
  const LAB_HEADERS = [
    "LAB_GID",
    "LAB_YMD",
    "LAB_TITLE",
    "LAB_BIGO01",
    "LAB_EMP",
    "LAB_NO",
    "LAB_UNIT",
  ];
  const mappedCols = Array.from(new Set(Object.values(codeMapping))).sort(sortColumns);
  const headers = [...LAB_HEADERS, ...mappedCols];

  const rows = cases.map((c, i) =>
    buildRowFromCase(
      c,
      codeMapping,
      headers,
      typeof labDefaults === "function" ? labDefaults(c, i) : labDefaults
    )
  );

  const esc = (v: any) => {
    const s = (v ?? "").toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = headers.join(",");
  const body = rows.map((r) => headers.map((h) => esc(r[h])).join(",")).join("\n");
  const csv = head + "\n" + body;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ================= Full codeMapping (생략 없음) ================= */
export const codeMapping: CodeMapping = {
  "10/20": "ITEM_M_1",
  "SBR-1500": "ITEM_M_2",
  "SBR-1502": "ITEM_M_3",
  "SBR-1502M": "ITEM_M_4",
  "SBR-1712": "ITEM_M_5",
  "SBR-1723": "ITEM_M_6",
  "SBR-1778": "ITEM_M_7",
  "SBR-1783": "ITEM_M_8",
  "SBR-1789": "ITEM_M_9",
  "BR-01": "ITEM_M_10",
  "NdBR-40": "ITEM_M_11",
  "NdBR-60": "ITEM_M_12",
  "NBR KNB-35L": "ITEM_M_13",
  "NBR 240S": "ITEM_M_14",
  "KHS-68": "ITEM_M_15",
  "RR 천연 SP": "ITEM_M_16",
  "RR 천연 TR": "ITEM_M_17",
  "RR 부틸": "ITEM_M_18",
  "RR 라텍스": "ITEM_M_19",
  "IIR Butyl-268(BK-1675N)": "ITEM_M_20",
  "CR M-41": "ITEM_M_21",
  "DCR-34": "ITEM_M_22",
  "\"IIR CHHT-1066(CBK-139": "ITEM_M_23",
  "IIR Bromo 2222 (B2232)": "ITEM_M_24",
  "A-86": "ITEM_M_25",
  "산화마그네슘 MgO": "ITEM_M_26",
  "KS-2(ZnO)": "ITEM_M_81",
  "AP-1(ZnO)": "ITEM_M_28",
  "Stearic Acid": "ITEM_M_29",
  "ISAF N-220": "ITEM_M_30",
  "ISAF N-234": "ITEM_M_94",
  "HAF N-330": "ITEM_M_31",
  "T-HS N-351": "ITEM_M_32",
  "HAF/HS N-375": "ITEM_M_33",
  "FEF N-550": "ITEM_M_34",
  "GPF N-660": "ITEM_M_35",
  "SRF N-774": "ITEM_M_36",
  "MT N-990": "ITEM_M_37",
  "아세틸렌": "ITEM_M_38",
  "전도성 카본": "ITEM_M_39",
  "GCB 774G": "ITEM_M_40",
  "VN3GR": "ITEM_M_41",
  "SI-69": "ITEM_M_42",
  "RD": "ITEM_M_43",
  "SP-N": "ITEM_M_44",
  "6PPD": "ITEM_M_45",
  "RA-101": "ITEM_M_46",
  "BLEN": "ITEM_M_95",
  "Sunprax-602 (REDEZON-601)": "ITEM_M_47",
  "Sunprax-652 (REDEZON-510)": "ITEM_M_48",
  "Sunprax-672(C-251)": "ITEM_M_49",
  "P-90": "ITEM_M_50",
  "C-1100": "ITEM_M_51",
  "U-HI": "ITEM_M_52",
  "KORESIN": "ITEM_M_96",
  "KPT-1250K/S-1503": "ITEM_M_53",
  "KPA-1350K": "ITEM_M_54",
  "HISTAR": "ITEM_M_55",
  "40 MS(CH-400)": "ITEM_M_56",
  "120 NS (POLYETHYLENE WAX)": "ITEM_M_57",
  "DR-603": "ITEM_M_58",
  "DR-903": "ITEM_M_59",
  "OPPERA 383": "ITEM_M_60",
  "GUM ROSIN": "ITEM_M_61",
  "DBM": "ITEM_M_62",
  "DF-909F": "ITEM_M_63",
  "DF-908F": "ITEM_M_64",
  "UPA-750": "ITEM_M_65",
  "KPR-1300": "ITEM_M_66",
  "MANOBAND C-22.5": "ITEM_M_67",
  "Clay K-3": "ITEM_M_68",
  "경탄": "ITEM_M_69",
  "중탄": "ITEM_M_70",
  "HV-311": "ITEM_M_71",
  "DM": "ITEM_M_88",
  "LUB-2032": "ITEM_M_73",
  "DOA": "ITEM_M_74",
  "A-2(RAE)": "ITEM_M_75",
  "프로세스유 P-3": "ITEM_M_76",
  "Paraffinic Oil (KP-4)": "ITEM_M_77",
  "황 Midas-101": "ITEM_M_78",
  "MUCRON": "ITEM_M_79",
  "불용성 유황 OT-20": "ITEM_M_80",
  "TT": "ITEM_M_82",
  "TS": "ITEM_M_83",
  "TMU": "ITEM_M_84",
  "NS": "ITEM_M_85",
  "NBS": "ITEM_M_86",
  "CZ": "ITEM_M_87",
  "D": "ITEM_M_89",
  "Vulkalent B/C": "ITEM_M_90",
  "KFC-PR": "ITEM_M_91",
  "RA-65 (HM-N)": "ITEM_M_92",
  "PVI": "ITEM_M_93",

  "Mooney Viscosity (CMB) : ML1+4 at 100℃": "ITEM_T_1",
  "Mooney Viscosity (FMB) : ML1+4 at 100℃": "ITEM_T_2",
  "Rheometer(MDR) ML : 145℃": "ITEM_T_3",
  "Rheometer(MDR) MH : 145℃": "ITEM_T_4",
  "Rheometer(MDR) Ts2 : 145℃": "ITEM_T_5",
  "Rheometer(MDR) T10 : 145℃": "ITEM_T_6",
  "Rheometer(MDR) T50 : 145℃": "ITEM_T_7",
  "Rheometer(MDR) T90 : 145℃": "ITEM_T_8",
  "Rheometer(MDR) Tmax : 145℃": "ITEM_T_9",

  "Rheometer(MDR) ML : 160℃": "ITEM_T_57",
  "Rheometer(MDR) MH : 160℃": "ITEM_T_58",
  "Rheometer(MDR) Ts2 : 160℃": "ITEM_T_59",
  "Rheometer(MDR) T10 : 160℃": "ITEM_T_60",
  "Rheometer(MDR) T50 : 160℃": "ITEM_T_61",
  "Rheometer(MDR) T90 : 160℃": "ITEM_T_62",
  "Rheometer(MDR) Tmax : 160℃": "ITEM_T_63",

  "Rheometer(MDR) ML : 165℃": "ITEM_T_10",
  "Rheometer(MDR) MH : 165℃": "ITEM_T_11",
  "Rheometer(MDR) Ts2 : 165℃": "ITEM_T_12",
  "Rheometer(MDR) T10 : 165℃": "ITEM_T_13",
  "Rheometer(MDR) T50 : 165℃": "ITEM_T_14",
  "Rheometer(MDR) T90 : 165℃": "ITEM_T_15",
  "Rheometer(MDR) Tmax : 165℃": "ITEM_T_16",

  "Hardness : Cure 145℃×T90*1.5": "ITEM_T_17",
  "100% Modulus : Cure 145℃×T90*1.5": "ITEM_T_18",
  "300% Modulus : Cure 145℃×T90*1.5": "ITEM_T_19",
  "Tensile Strength : Cure 145℃×T90*1.5": "ITEM_T_20",
  "Elongation : Cure 145℃×T90*1.5": "ITEM_T_21",
  "Specific Gravity : Cure 145℃×T90*1.5": "ITEM_T_22",

  "Hardness : Cure 165℃×T90*1.5": "ITEM_T_23",
  "100% Modulus : Cure 165℃×T90*1.5": "ITEM_T_24",
  "300% Modulus : Cure 165℃×T90*1.5": "ITEM_T_25",
  "Tensile Strength : Cure 165℃×T90*1.5": "ITEM_T_26",
  "Elongation : Cure 165℃×T90*1.5": "ITEM_T_27",
  "Specific Gravity : Cure 165℃×T90*1.5": "ITEM_T_28",

  "Hardness : Cure 165℃×5min": "ITEM_T_29",
  "100% Modulus : Cure 165℃×5min": "ITEM_T_30",
  "300% Modulus : Cure 165℃×5min": "ITEM_T_31",
  "Tensile Strength : Cure 165℃×5min": "ITEM_T_32",
  "Elongation : Cure 165℃×5min": "ITEM_T_33",

  "Hardness : Cure 165℃×10min": "ITEM_T_34",
  "100% Modulus : Cure 165℃×10min": "ITEM_T_35",
  "300% Modulus : Cure 165℃×10min": "ITEM_T_36",
  "Tensile Strength : Cure 165℃×10min": "ITEM_T_37",
  "Elongation : Cure 165℃×10min": "ITEM_T_38",
  "Specific Gravity : Cure 165℃×10min": "ITEM_T_39",

  "Hardness : Cure 165℃×15min": "ITEM_T_40",
  "100% Modulus : Cure 165℃×15min": "ITEM_T_41",
  "300% Modulus : Cure 165℃×15min": "ITEM_T_42",
  "Tensile Strength : Cure 165℃×15min": "ITEM_T_43",
  "Elongation : Cure 165℃×15min": "ITEM_T_44",

  "DIN Abrasion : Cure 145℃×T90*2.0": "ITEM_T_45",
  "DIN Abrasion : Cure 165℃×T90*2.0": "ITEM_T_46",
  "DIN Abrasion : Cure 165℃×10min": "ITEM_T_47",

  "Rebound : Cure 145℃×T90*2.0": "ITEM_T_48",
  "Rebound : Cure 165℃×T90*2.0": "ITEM_T_49",
  "Rebound : Cure 165℃×20min": "ITEM_T_54",

  "H.B.U (ΔT) : Cure 145℃×T90*2.0": "ITEM_T_50",
  "H.B.U (ΔT) : Cure 165℃×T90*2.0": "ITEM_T_51",
  "H.B.U (ΔT) : Cure 165℃×20min": "ITEM_T_55",

  "Cut &amp; Chip (loss ㎣) : Cure 145℃×T90*2.0": "ITEM_T_52",
  "Cut &amp; Chip (loss ㎣) : Cure 165℃×T90*2.0": "ITEM_T_53",
  "Cut &amp; Chip (loss ㎣) : Cure 165℃×20min": "ITEM_T_56",
};
