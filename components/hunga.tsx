// app/(demo)/materials/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";
import { LuCopy } from "react-icons/lu";
import { GoTrash } from "react-icons/go";

// ✅ 원재료 코드/이름 상수 가져오기
import { ROW_MATERIALS_CODE_NAME_LIST } from "@/data/code-name-map";
// ✅ 로딩 스피너
import { LoadingSpinnerComponent } from "@/components/loading/loading-spinner";
import { codeMapping, downloadXlsxFromCases, LabDefaults } from "@/utils/makeExcel";
import { IoMdCheckmarkCircle } from "react-icons/io";
import { MdDownload } from "react-icons/md";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

/* --------------------------------- Utils / Types --------------------------------- */

/** 표시용 포맷: 소수점 3자리 */
const fmt3 = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : "0.000";
};

type Ingredient = { name: string; value: number };
type CaseCard = { id: string; title: string; ingredients: Ingredient[] };
type PredDetailRow = {
  codeName: string;
  y_pred: number;
  ci_low: number;
  ci_high: number;
};
type PredictionCard = {
  id: string;
  title: string;
  checked: boolean;
  propCount: number;
  caseId: string;
  /** 그래프/입력값 (y_pred) */
  props: number[]; // 물성1~6 (요약)
  /** ▼ API에서 받은 보조정보(라벨/CI) */
  propKeys?: string[]; // 항목 라벨 (없으면 물성1~6)
  ciLow?: number[]; // 신뢰구간 하한
  ciHigh?: number[]; // 신뢰구간 상한
  /** 팝업에 풀데이터로 표시할 전체 행들 */
  detailRows?: PredDetailRow[];
};

type Option = { value: string; label: string };

/* --------------------------------- SelectPopup --------------------------------- */

const SelectPopup = ({
  open,
  options,
  value,
  onClose,
  onSelect,
  width = 480,
  maxHeight = 480,
}: {
  open: boolean;
  options: Option[];
  value?: string;
  onClose: () => void;
  onSelect: (opt: Option) => void;
  width?: number;
  maxHeight?: number;
}) => {
  const popRef = useRef<HTMLDivElement | null>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term)
    );
  }, [q, options]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      const idx = filtered.findIndex((o) => o.value === value || o.label === value);
      setActive(idx >= 0 ? idx : 0);
      setTimeout(() => {
        popRef.current?.querySelector<HTMLInputElement>("input")?.focus();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((p) => Math.min(p + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((p) => Math.max(p - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const opt = filtered[active];
        if (opt) onSelect(opt);
      }
    };
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
  }, [open, filtered, active, onClose, onSelect]);

  if (!open) return null;

  return (
    <>
      <div className="list-box-dark-box" onMouseDown={onClose} aria-hidden />
      <div
        ref={popRef}
        role="dialog"
        className="list-box-content"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width,
          zIndex: 10001,
          borderRadius: 10,
          boxShadow: "0 12px 24px rgba(0,0,0,.14)",
          background: "#fff",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 10, borderBottom: "1px solid #f1f5f9", background: "#dfe3eb" }}>
          <input
            placeholder="검색 (코드/이름)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%",
              height: 36,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              outline: "none",
            }}
          />
        </div>
        <div role="listbox" style={{ maxHeight, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ padding: 12, color: "#6b7280" }}>검색 결과 없음</div>
          )}
          {filtered.map((o, i) => {
            const isActive = i === active;
            const isSelected = value === o.value || value === o.label;
            return (
              <div
                key={o.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(o);
                }}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: isActive ? "#f1f5f9" : isSelected ? "#eef2ff" : "#fff",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <span
                  style={{
                    minWidth: 92,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: "#334155",
                  }}
                >
                  {o.value}
                </span>
                <span style={{ color: "#111827" }}>{o.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

/* --------------------------------- Modal --------------------------------- */

function PredictionDetailModal({
  open,
  title,
  rows,
  onClose,
}: {
  open: boolean;
  title: string;
  rows: PredDetailRow[];
  onClose: () => void;
}) {
  // ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalOverlay onMouseDown={onClose} role="dialog" aria-modal="true">
      <ModalPanel onMouseDown={(e) => e.stopPropagation()}>
        <ModalHead>
          <h4>{title} 상세</h4>
          <button onClick={onClose} aria-label="닫기">✕</button>
        </ModalHead>
        <ModalBody>
          <DetailTable>
            <thead>
              <tr>
                <th>CODENAME</th>
                <th>예측물성</th>
                <th>하한값</th>
                <th>상한값</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.codeName}-${i}`}>
                  <td>{r.codeName}</td>
                  <td>{fmt3(r.y_pred)}</td>
                  <td>{fmt3(r.ci_low)}</td>
                  <td>{fmt3(r.ci_high)}</td>
                </tr>
              ))}
            </tbody>
          </DetailTable>
        </ModalBody>
      </ModalPanel>
    </ModalOverlay>
  );
}

interface IngredientCustom {
  name: string;
  value: number;
}

interface CaseItem {
  id: string;
  title: string;
  ingredients: IngredientCustom[];
}

/* --------------------------------- Page --------------------------------- */

export default function DXHungaPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const MATERIAL_OPTIONS: Option[] = useMemo(
    () =>
      ROW_MATERIALS_CODE_NAME_LIST.map((x) => ({
        value: x.code,
        label: x.name,
      })),
    []
  );

  const pickLabelByIndex = (i: number) =>
    MATERIAL_OPTIONS[(i + MATERIAL_OPTIONS.length) % MATERIAL_OPTIONS.length]?.label ??
    `재료 ${i + 1}`;

  // ✅ [수정] 상수 변경 (최대 100, 최소 5)
  const MAX_CASE = 10;
  const MAX_ING = 100;
  const MIN_ING = 1;

  // ✅ [수정] 초기값 30개로 설정
  const [cases, setCases] = useState<CaseCard[]>([
    {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "case-1",
      title: "case - 1",
      ingredients: Array.from({ length: 1 }, (_, i) => ({
        name: pickLabelByIndex(i),
        value: 1,
      })),
    },
    {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "case-2",
      title: "case - 2",
      ingredients: Array.from({ length: 1 }, (_, i) => ({
        name: pickLabelByIndex(i + 5),
        value: 1,
      })),
    },
  ]);

  // 예측물성(레이더/테이블용)
  const [preds, setPreds] = useState<PredictionCard[]>([
    {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "pred-1",
      title: "Test case - 1",
      checked: true,
      propCount: 6,
      caseId: "",
      props: [0, 0, 0, 0, 0, 0],
      propKeys: ["물성1", "물성2", "물성3", "물성4", "물성5", "물성6"],
      ciLow: [0, 0, 0, 0, 0, 0],
      ciHigh: [0, 0, 0, 0, 0, 0],
      detailRows: [], // 초기엔 없음
    },
  ]);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    if (!mounted) return;
    document.body.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme, mounted]);

  async function safeFetchJSON<T>(
      url: string,
      options: RequestInit = {},
      timeoutMs = 15000
    ): Promise<T> {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 200)}` : ""}`);
        }
        return (await res.json()) as T;
      } catch (e: any) {
        if (e?.name === "AbortError") throw new Error("요청이 시간 초과되었습니다.");
        if (typeof window !== "undefined" && !navigator.onLine)
          throw new Error("오프라인 상태입니다. 인터넷 연결을 확인해 주세요.");
        if (e?.message?.includes("Failed to fetch"))
          throw new Error("서버에 연결하지 못했습니다. 서버 주소 또는 CORS 설정을 확인해 주세요.");
        throw e instanceof Error ? e : new Error("알 수 없는 오류가 발생했습니다.");
      } finally {
        clearTimeout(id);
      }
    }

  const renameCases = (arr: CaseCard[]) =>
    arr.map((c, i) => ({ ...c, title: `case - ${i + 1}` }));

  const uuid = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `id-${Math.random().toString(36).slice(2)}`;

  // ✅ [수정] 케이스 추가 시에도 기본 30개(또는 이전 케이스 길이) 유지
  const addCase = () => {
    setCases((prev) => {
      if (prev.length >= MAX_CASE) return prev;
      
      // 기존 라벨링 순서를 유지하기 위해 누적 개수 계산
      const already = prev.reduce((sum, c) => sum + c.ingredients.length, 0);
      
      // ✅ length를 1로 고정하여 원재료 1개만 생성
      const nextIng = Array.from({ length: 1 }, (_, i) => ({
        name: pickLabelByIndex(already + i),
        value: 1, // 빈 값이 아닌 1로 초기화
      }));

      const next: CaseCard = { id: uuid(), title: "", ingredients: nextIng };
      return renameCases([...prev, next]);
    });
  };

  const copyCase = (id: string) => {
    setCases((prev) => {
      if (prev.length >= MAX_CASE) return prev;
      const found = prev.find((c) => c.id === id);
      if (!found) return prev;
      const next: CaseCard = {
        id: uuid(),
        title: "",
        ingredients: found.ingredients.map((x) => ({ ...x })),
      };
      return renameCases([...prev, next]);
    });
  };

  const deleteCase = (id: string) => {
    setCases((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((c) => c.id !== id);
      return renameCases(next);
    });
  };

  const addIngredient = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        if (c.ingredients.length >= MAX_ING) return c;
        const idx = c.ingredients.length;
        return {
          ...c,
          ingredients: [...c.ingredients, { name: pickLabelByIndex(idx), value: 1 }],
        };
      })
    );
  };

  const removeIngredient = (caseId: string, index: number) => {
    // 1. 현재 상태(cases)에서 해당 케이스를 먼저 찾습니다.
    const targetCase = cases.find((c) => c.id === caseId);

    // 2. 케이스가 있고, 원재료가 1개 이하인지 확인합니다.
    if (targetCase && targetCase.ingredients.length <= 1) {
      alert("최소 1개의 원재료는 필수입니다.");
      return; // ⛔️ 여기서 함수를 종료하여 setCases가 실행되지 않게 합니다.
    }

    // 3. 검증 통과 시에만 상태를 업데이트합니다.
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const arr = [...c.ingredients];
        arr.splice(index, 1);
        return { ...c, ingredients: arr };
      })
    );
  };

  const [openIdx, setOpenIdx] = useState<{ caseId: string; index: number } | null>(null);

  const [loadingState, setLoadingState] = useState<boolean>(false);

  // ─────────────────────────────────────────
  // runPrediction: ID 기준으로 그룹화하여 전체 물성 표시
  // ─────────────────────────────────────────
  const runPrediction = async () => {
    setErrorMsg(null);
    setLoadingState(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://1.254.24.170:24828";

    // 케이스 → dataObject 변환
    const dataObject: Record<string, Record<string, string>> = Object.fromEntries(
      cases.map((c, idx) => [
        String(idx + 1),
        Object.fromEntries(
          (c.ingredients ?? []).map((ing, i) => [
            String((ing.name ?? `재료${i + 1}`).toString().trim()),
            String((ing.value ?? "").toString().trim()),
          ])
        ),
      ])
    );

    try {
      // 1) 첫 요청 → insertedIds
      type InsertRes = {
        insertedRows?: { insertedId: number }[];
      };

      const data1 = await safeFetchJSON<InsertRes>(`${API_BASE}/api/DX_API002003`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataObject }),
      });

      const insertedIds =
        Array.isArray(data1?.insertedRows) && data1.insertedRows.length > 0
          ? data1.insertedRows.map((r) => r.insertedId)
          : [];

      if (insertedIds.length === 0) {
        throw new Error("서버에서 처리된 ID가 반환되지 않았습니다.");
      }

      // 2) 두 번째 요청 → 전체 결과
      // 예상 응답 필드: RECIPE_IDX (또는 recipe_idx)가 포함되어 있어야 그룹핑 가능
      type PredictRow = {
        RECIPE_IDX?: number | string; // ✅ 그룹핑 기준 키
        recipe_idx?: number | string; // (소문자 대응)
        CODENAME?: string;
        CODE?: string;
        target?: string;
        y_pred?: any;
        ci_low?: any;
        ci_high?: any;
      };
      
      type PredictRes =
        | PredictRow[]
        | { rows?: PredictRow[]; data?: PredictRow[]; items?: PredictRow[]; result?: PredictRow[]; results?: PredictRow[] };

      const data2 = await safeFetchJSON<PredictRes>(
        `${API_BASE}/api/DX_API002004`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idList: insertedIds }),
        },
        20000
      );

      // 배열 꺼내기
      const toArray = (v: PredictRes): PredictRow[] => {
        if (Array.isArray(v)) return v;
        if (v && typeof v === "object") {
          for (const k of ["rows", "data", "items", "result", "results"] as const) {
            const arr = (v as any)[k];
            if (Array.isArray(arr)) return arr;
          }
        }
        return [];
      };

      const flat = toArray(data2);
      if (flat.length === 0) {
        throw alert("예측 결과가 비어 있습니다.");
      }

      // ✅ [수정] 결과 데이터를 recipe_idx(insertedId) 기준으로 그룹화
      const groupedMap = new Map<string, PredDetailRow[]>();

      flat.forEach((r, idx) => {
        // API에서 반환하는 그룹핑 ID 찾기 (RECIPE_IDX, recipe_idx 없으면 순서 보장 가정 불가하므로 주의)
        const rawId = r.RECIPE_IDX ?? r.recipe_idx; 
        
        // 만약 ID가 없으면 에러가 날 수 있으나, 일단 건너뜀
        if (rawId === undefined || rawId === null) return;

        const groupKey = String(rawId);
        
        const codeName = String(r.CODENAME ?? r.CODE ?? r.target ?? `물성${idx + 1}`).trim();
        const rowData: PredDetailRow = {
          codeName,
          y_pred: Number(r.y_pred ?? 0),
          ci_low: Number(r.ci_low ?? 0),
          ci_high: Number(r.ci_high ?? 0),
        };

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, []);
        }
        groupedMap.get(groupKey)?.push(rowData);
      });

      // ✅ [수정] 케이스 순서(insertedIds)대로 매칭하여 카드 생성
      const nextPreds: PredictionCard[] = cases.map((c, i) => {
        const serverId = String(insertedIds[i]); // 현재 케이스에 해당하는 DB ID
        const rows = groupedMap.get(serverId) ?? []; // 해당 ID로 그룹핑된 데이터 가져오기

        // 데이터가 없으면 빈 값 처리
        if (rows.length === 0) {
          return {
            id: uuid(),
            title: c.title,
            checked: i === 0,
            propCount: 0,
            caseId: c.id,
            props: [],
            propKeys: [],
            ciLow: [],
            ciHigh: [],
            detailRows: [],
          };
        }

        return {
          id: uuid(),
          title: c.title,
          checked: i === 0,
          propCount: rows.length,
          caseId: c.id,
          // 그래프/테이블용 배열들
          props: rows.map(r => r.y_pred),
          propKeys: rows.map(r => r.codeName),
          ciLow: rows.map(r => r.ci_low),
          ciHigh: rows.map(r => r.ci_high),
          detailRows: rows, // 전체 데이터 포함
        };
      });

      setPreds(nextPreds);
    } catch (err: any) {
      console.error("❌ runPrediction error:", err);
      // 에러 시 사용자 알림이 필요하면 주석 해제
      // setErrorMsg(err?.message ?? "오류 발생"); 
    } finally {
      setLoadingState(false);
    }
  };


  // 색상
  const tickColor = theme === "dark" ? "#C3C6D4" : "#666";
  const gridColor = theme === "dark" ? "rgba(70,78,94,1)" : "rgba(0,0,0,0.1)";

  // ✅ “세로 그룹 바”: X축 = 케이스, 데이터셋 = 원재료 인덱스
  const { labelsCaseRows, datasetLabels } = useMemo(() => {
    const labels = cases.map((c) => c.title);
    const longest = cases.reduce((a, b) =>
      (a.ingredients?.length ?? 0) >= (b.ingredients?.length ?? 0) ? a : b
    );
    const dsLabels = (longest?.ingredients ?? []).map((ing, i) => ing?.name || `재료${i + 1}`);
    return { labelsCaseRows: labels, datasetLabels: dsLabels };
  }, [cases]);

  const barDataRows: ChartData<"bar"> = useMemo(() => {
    const pal = [
      "rgba(255, 99, 132, 0.5)", "rgba(75, 192, 192, 0.5)", "rgba(255, 206, 86, 0.5)",
      "rgba(153, 102, 255, 0.5)", "rgba(255, 159, 64, 0.5)", "rgba(54, 162, 235, 0.5)",
      "rgba(201, 203, 207, 0.5)", "rgba(0, 0, 0, 0.12)",
    ];
    const palB = [
      "rgba(255, 99, 132, 1)", "rgba(75, 192, 192, 1)", "rgba(255, 206, 86, 1)",
      "rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)", "rgba(54, 162, 235, 1)",
      "rgba(201, 203, 207, 1)", "rgba(0, 0, 0, 0.6)",
    ];

    const maxCount = Math.max(...cases.map((c) => c.ingredients.length), 0);
    const datasets = Array.from({ length: maxCount }, (_, ingIdx) => {
      const dataPerCase = cases.map((c) => Number(c.ingredients[ingIdx]?.value ?? 0));
      const label =
        datasetLabels[ingIdx] ?? (cases[0]?.ingredients?.[ingIdx]?.name ?? `재료${ingIdx + 1}`);
      return {
        label,
        data: dataPerCase,
        backgroundColor: pal[ingIdx % pal.length],
        borderColor: palB[ingIdx % palB.length],
        borderWidth: 1,
      };
    });

    return { labels: labelsCaseRows, datasets };
  }, [cases, labelsCaseRows, datasetLabels]);

  const barOptionsRows: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 18 } },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: { color: tickColor, font: { size: 18 } },
          grid: { color: gridColor },
        },
      },
      plugins: {
        legend: { position: "top", labels: { color: tickColor, font: { size: 16 } } },
        tooltip: { enabled: true },
      },
      elements: { bar: { borderRadius: 3 } },
    }),
    [tickColor, gridColor]
  );

  // ✅ 레이더(합쳐진 형태)
  const checkedPreds = useMemo(() => preds.filter((p) => p.checked), [preds]);
  const radarLabels = useMemo(() => {
    if (checkedPreds.length > 0 && checkedPreds[0].propKeys) {
      return checkedPreds[0].propKeys;
    }
    return ["물성1", "물성2", "물성3", "물성4", "물성5", "물성6"];
  }, [checkedPreds]);

  const combinedRadarData: ChartData<"radar"> = useMemo(() => {
    if (checkedPreds.length === 0) return { labels: radarLabels, datasets: [] };

    const palFill = [
      "rgba(255, 99, 132, 0.18)", "rgba(75, 192, 192, 0.18)", "rgba(255, 206, 86, 0.18)",
      "rgba(153, 102, 255, 0.18)", "rgba(255, 159, 64, 0.18)", "rgba(54, 162, 235, 0.18)",
    ];
    const palStroke = [
      "rgba(255, 99, 132, 1)", "rgba(75, 192, 192, 1)", "rgba(255, 206, 86, 1)",
      "rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)", "rgba(54, 162, 235, 1)",
    ];

    const datasets = checkedPreds.map((p, i) => ({
      label: p.title,
      data: radarLabels.map((_, idx) => Number(p.props[idx] ?? 0)),
      backgroundColor: palFill[i % palFill.length],
      borderColor: palStroke[i % palStroke.length],
      pointBackgroundColor: palStroke[i % palStroke.length],
      borderWidth: 1,
      pointRadius: 3,
    }));

    return { labels: radarLabels, datasets };
  }, [checkedPreds, radarLabels]);

  const radarOptions: ChartOptions<"radar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { display: true },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { backdropColor: "transparent", color: "#666", font: { size: 20 } },
          grid: { color: "#e5e7eb" },
          pointLabels: { color: "#666", font: { size: 20, weight: 600 } },
        },
      },
      plugins: {
        legend: { position: "top", labels: { color: "#666", font: { size: 18 } } },
      },
    }),
    []
  );

  const togglePred = (id: string) => {
    setPreds((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p));
      if (!next.some((p) => p.checked) && next.length) next[0].checked = true;
      return next;
    });
  };

  /* ---------------------- Detail Modal state & handlers ---------------------- */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailRows, setDetailRows] = useState<PredDetailRow[]>([]);

  // 카드 클릭 → 상세 열기 (이미 열려있으면 닫기)
  const openDetailFor = (pred: PredictionCard) => {
    if (detailOpen) {
      setDetailOpen(false);
      return;
    }
    // ✅ 팝업은 "전체 데이터" 사용 (detailRows가 우선)
    if (pred.detailRows && pred.detailRows.length > 0) {
      setDetailTitle(pred.title);
      setDetailRows(pred.detailRows);
      setDetailOpen(true);
      return;
    }
    // detailRows가 없으면 props/ci로 최대 길이만큼 구성 (폴백)
    const count = Math.max(
      pred.propCount ?? 0,
      pred.props?.length ?? 0,
      pred.ciLow?.length ?? 0,
      pred.ciHigh?.length ?? 0
    );
    const rows: PredDetailRow[] = Array.from({ length: count }, (_, i) => ({
      codeName: pred.propKeys?.[i] ?? `물성${i + 1}`,
      y_pred: Number(pred.props?.[i] ?? 0),
      ci_low: Number(pred.ciLow?.[i] ?? 0),
      ci_high: Number(pred.ciHigh?.[i] ?? 0),
    }));
    setDetailTitle(pred.title);
    setDetailRows(rows);
    setDetailOpen(true);
  };
  const closeDetail = () => setDetailOpen(false);

  function mergeAllIngredients(cases: CaseItem[]): Ingredient[] {
    return cases.flatMap(c => c.ingredients || []);
  }

  const getTodayYMD = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  };

  const today = getTodayYMD();

  const perCaseDefaults = (_c: CaseItem, index: number): LabDefaults => ({
    LAB_GID: _c.id,
    LAB_YMD: today,
    LAB_TITLE: `${today} case - ${index + 1}`,
    LAB_BIGO01: "",
    LAB_EMP: "",
    LAB_NO: "",
    LAB_UNIT: "Phr",
  });

  const handleDownloadXlsx = () => {
    downloadXlsxFromCases(cases, codeMapping, perCaseDefaults, "result.xlsx");
  };


  return (
    <PageWrap>
      <TopGrid>
        {/* 좌상단: 원재료 입력 */}
        <Card>
          <SectionHeader>
            <h3 onClick={()=> console.log(mergeAllIngredients(cases))}>원재료 입력</h3>
            <AddBtn onClick={addCase}>+ case 추가 ({cases ? cases.length : 0}/{MAX_CASE})</AddBtn>
          </SectionHeader>

          <CaseGrid>
            {cases.map((c) => (
              <CaseBox className={`${cases.length > 1 ? "mutiple" : ""}`} key={c.id}>
                <CaseHead>
                  <span>{'Test ' + c.title}</span>
                  <div className="actions">
                    <button title="복사" onClick={() => copyCase(c.id)}>
                      <LuCopy />
                    </button>
                    <button title="삭제" onClick={() => deleteCase(c.id)}>
                      <GoTrash />
                    </button>
                  </div>
                </CaseHead>

                <Inputs>
                  {c.ingredients.map((ing, idx) => {
                    const selected =
                      MATERIAL_OPTIONS.find((o) => o.value === ing.name || o.label === ing.name) ??
                      MATERIAL_OPTIONS[0];

                    return (
                      <Row key={`${c.id}-${idx}`}>
                        <button
                          type="button"
                          className="select-like"
                          onClick={() => setOpenIdx({ caseId: c.id, index: idx })}
                        >
                          {selected?.label ?? `재료 ${idx + 1}`}
                        </button>

                        <input
                          type="number"
                          min={1}
                          value={ing.value || ""} // 0일 경우 빈카드로 보여주거나 0으로 표시 (UX 선택)
                          onChange={(e) => {
                            const valStr = e.target.value;
                            
                            // 빈 값(지움)은 허용하되, 숫자가 입력되면 1 이상인지 체크
                            // 1 미만(0, 음수) 입력 시 상태 업데이트 안 함
                            if (valStr !== "" && Number(valStr) < 1) {
                              return;
                            }

                            const num = Number(valStr);
                            
                            setCases((prev) =>
                              prev.map((pc) => {
                                if (pc.id !== c.id) return pc;
                                const arr = [...pc.ingredients];
                                arr[idx] = { ...arr[idx], value: num };
                                return { ...pc, ingredients: arr };
                              })
                            );
                          }}
                        />

                        <IconBtn onClick={() => removeIngredient(c.id, idx)} title="삭제">
                          <GoTrash />
                        </IconBtn>

                        <SelectPopup
                          open={openIdx?.caseId === c.id && openIdx?.index === idx}
                          options={MATERIAL_OPTIONS}
                          value={selected?.label}
                          onClose={() => setOpenIdx(null)}
                          onSelect={(opt) => {
                            setOpenIdx(null);
                            setCases((prev) =>
                              prev.map((pc) => {
                                if (pc.id !== c.id) return pc;
                                const arr = [...pc.ingredients];
                                arr[idx] = { ...arr[idx], name: opt.label };
                                return { ...pc, ingredients: arr };
                              })
                            );
                          }}
                        />
                      </Row>
                    );
                  })}
                </Inputs>

                <SubBar>
                  <AddSmall onClick={() => addIngredient(c.id)}>
                    원재료 추가 ({c.ingredients.length}/{MAX_ING})
                  </AddSmall>
                </SubBar>
              </CaseBox>
            ))}
          </CaseGrid>
          <p className="left-right">
            {cases.length > 2 ? "← 좌우로 스크롤하여 다른 케이스를 확인하세요 →" : ""}
          </p>
          <FooterRow>
            <RunBtn onClick={runPrediction}><IoMdCheckmarkCircle />물성 예측 실행</RunBtn>
            <ExcelBtn onClick={handleDownloadXlsx}><MdDownload />레시피 다운로드 (Excel)</ExcelBtn>
          </FooterRow>
        </Card>

        {/* 우상단: 예측 물성 (테이블/클릭 → 상세 모달) */}
        <Card>
          <SectionHeader>
            <h3>예측 물성</h3>
          </SectionHeader>

          <PredGrid>
            {preds.map((p) => {
              const rowsCount = Math.max(
                p.propCount ?? 0,
                p.props?.length ?? 0,
                p.ciLow?.length ?? 0,
                p.ciHigh?.length ?? 0
              );
              return (
                <PredCard
                  className={`${preds.length > 1 ? "mutiple" : ""}`}
                  key={p.id}
                  onClick={() => openDetailFor(p)}
                  role="button"
                  aria-label={`${p.title} 상세 보기`}
                  tabIndex={0}
                >
                  <PredHead>
                    <span>{p.title}</span>
                    <input
                      className="checkbox"
                      type="checkbox"
                      checked={p.checked}
                      onClick={(e) => e.stopPropagation()} // 모달 열림 방지
                      onChange={() => togglePred(p.id)}
                    />
                  </PredHead>

                  {/* ✅ 스크롤을 위한 Wrapper */}
                  <PredTableWrap>
                    <PredTable>
                      <thead>
                        <tr>
                          <th>CODENAME</th>
                          <th>예측물성</th>
                          <th>하한값</th>
                          <th>상한값</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: rowsCount }, (_, i) => {
                          const codeName = p.propKeys?.[i] ?? `물성${i + 1}`;
                          const v = Number(p.props?.[i] ?? 0);
                          const lo = Number(p.ciLow?.[i] ?? 0);
                          const hi = Number(p.ciHigh?.[i] ?? 0);
                          return (
                            <tr key={`${p.id}-row-${i}`}>
                              {/* ✅ 툴팁이 적용된 Label Cell */}
                              <td className="label">
                                <div className="cell-inner">
                                  <span className="text-content">{codeName}</span>
                                  {/* Hover시 나타나는 툴팁 */}
                                  <span className="tooltip-box">{codeName}</span>
                                </div>
                              </td>
                              <td><input readOnly value={fmt3(v)} /></td>
                              <td><input readOnly value={fmt3(lo)} /></td>
                              <td><input readOnly value={fmt3(hi)} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </PredTable>
                  </PredTableWrap>
                </PredCard>
              );
            })}
          </PredGrid>
        </Card>
      </TopGrid>
      {errorMsg && <ErrorBar role="alert">
        <strong>요청 실패</strong>
        <span>{errorMsg}</span>
        <button onClick={() => setErrorMsg(null)} aria-label="닫기">닫기</button>
      </ErrorBar>}

      {/* 하단: 좌 — 세로 그룹 바, 우 — 합쳐진 레이더 */}
      <BottomGrid>
        <Card>
          <SectionHeader style={{ marginBottom: 0 }}>
            <h3>케이스별 원재료 Bar</h3>
          </SectionHeader>
          <ChartWrap>
            <Bar data={barDataRows} options={barOptionsRows} />
          </ChartWrap>
        </Card>

        <Card>
          <SectionHeader style={{ marginBottom: 0 }}>
            <h3>예측 레이더</h3>
          </SectionHeader>
          <ChartWrap>
            <Radar data={combinedRadarData} options={radarOptions} />
          </ChartWrap>
        </Card>
      </BottomGrid>

      {/* 상세 모달 */}
      <PredictionDetailModal
        open={detailOpen}
        title={detailTitle}
        rows={detailRows}
        onClose={closeDetail}
      />

      {loadingState === true && <LoadingSpinnerComponent opacity={0.5} />}
    </PageWrap>
  );
}

export const PageWrap = styled.main`
  width: 100%;
  min-height: 100vh;
  max-width: 100vw;
  position: relative;
  padding: 12px;
  background: var(--background-mainbase-100, #f7f8fa);
  font-family: 'Pretendard';
  letter-spacing: -.6px;

  .list-box-content {
    z-index: 10001;
  }
  .list-box-dark-box {
    position: fixed;
    inset: 0;
    opacity: 0.6;
    background-color: #000000;
    z-index: 10000;
  }
`;

export const TopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch; /* ✅ 서로 높이 맞춤 */
  width: 100%;
  max-width: 100%;

  & > * { min-width: 0; }

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

export const BottomGrid = styled.div`
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;

  & > * { min-width: 0; }

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.section`
  width: 100%;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  background: #fff;
  border: 1px solid #CACADE;
  border-radius: 8px;
  padding: 35px;
  box-sizing: border-box;

  .left-right {
    width: 100%;
    text-align: center;
    margin-top: 15px;
    font-size: 1.15rem;
    color: var(--text-neutral-medium);
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  height: 40px;

  h3 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
`;

export const AddBtn = styled.button`
  border-radius: 6px;
  padding: 6px 10px;
  font-weight: 600;
  background-color: var(--background-gray-200);
`;

export const CaseGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 20px;
  min-width: 0;
  align-items: stretch; /* ✅ 내부 카드 높이 동기화 */
`;

export const CaseBox = styled.div`
  background-color: var(--background-gray-100);
  border: 1px solid #CACADE;
  border-radius: 8px;
  width: 100%;
  padding: 20px;
  flex-shrink: 0;
  
  /* ✅ [수정] 고정 높이 제거, 내용물에 따라 늘어나되 100% 채움 */
  min-height: 300px; 
  height: 100%; 
  /* max-height 제거됨 */
  
  transition: width 0.3s ease-in-out;
  &.mutiple {
    width: calc(50% - 11px);
  }
  
  display: flex;
  flex-direction: column;
`;

export const CaseHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  span {
    font-size: 1.2rem;
    font-weight: 500;
  }
  .actions {
    display: inline-flex;
    gap: 0px;
  }
  button {
    width: 30px;
    height: 30px;
    padding: 4px 6px;
    border-radius: 6px;
    transform: scale(1.1);
  }
`;

export const Inputs = styled.div`
  background: #fff;
  border-radius: 6px;
  padding: 8px;
  border: 1px solid #CACADE;
  
  /* ✅ [수정] 12개 정도의 높이(약 580px)까지만 늘어나고 그 후엔 스크롤 */
  max-height: 580px;
  overflow-y: auto;
  
  /* flex: 1 제거하여 내용물이 없으면 높이를 차지하지 않도록 함 (다만 stretch를 위해 flex-grow 필요시 조정) */
  flex-grow: 1; 
`;

export const Row = styled.div`
  width: 100%;
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 1.2rem;

  .select-like {
    border: 1.4px solid #CACADE;
    border-radius: 6px;
    padding: 0 18px;
    background: #fff;
    width: 100%;
    height: 44px;
    text-align: left;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .select-like:hover { border-color: #94a3b8; }

  input {
    border: 1.4px solid #CACADE;
    border-radius: 6px;
    padding: 8px;
    background: #fff;
    width: 100%;
    height: 40px;
    text-align: right;
  }
`;

export const IconBtn = styled.button`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e4ea;
  background: #e0e4ea;
  color: var(--text-neutral-strong);
  border-radius: 9999px;
  height: 34px;
  width: 34px;
`;

export const SubBar = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: center;
  width: 100%;
  button { width: 100%; background-color: var(--background-gray-200); }
`;

export const AddSmall = styled.button`
  background: #dfe5ef;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1.2rem;
`;

export const FooterRow = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  button {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;

    svg {
      transform: scale(1.1);
    }
  }
`;

export const RunBtn = styled.button`
  background: #e95a5a;
  color: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 1.3rem;
`;

export const ExcelBtn = styled.button`
  background: #3a4658;
  color: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 1.3rem;
  svg {
    margin-top: 2px;
  }
`;

export const PredGrid = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 12px;
  min-width: 0;
  align-items: stretch; /* ✅ 내부 카드 높이 동기화 */
`;

export const PredCard = styled.div`
  width: 100%;
  background-color: var(--background-gray-100);
  border: 1px solid var(--line-border);
  border-radius: 8px;
  padding: 20px;
  flex-shrink: 0;
  
  /* ✅ [수정] 고정 높이 제거, 높이 100%로 설정하여 CaseBox와 키 맞춤 */
  min-height: 300px; 
  height: 100%;
  /* max-height 제거됨 */

  display: flex;
  flex-direction: column;
  overflow: hidden; 

  transition: width 0.3s ease-in-out;
  cursor: pointer;

  &.mutiple {
    width: calc(50% - 11px);
  }
`;

export const PredHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 1.4rem;

  span {
    font-weight: 600;
    font-size: var(--font-size-sm);
  }
  .checkbox {
    transform: scale(1.6);
    cursor: pointer;
  }
`;

// ✅ [수정] 예측 테이블 스크롤 Wrapper
export const PredTableWrap = styled.div`
  flex-grow: 1;         
  overflow-y: auto;     
  min-height: 0;        
  margin-top: 4px;
  
  /* ✅ 원재료 박스와 높이 균형을 맞추기 위한 최대 높이 설정 */
  max-height: 580px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
`;

// ✅ [수정] Tooltip이 포함된 테이블 스타일링
export const PredTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: #ffffff;
  thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    
    color: white;
    font-size: 1.2rem;
    font-weight: 500;
    padding: 10px 8px;
    border-bottom: 2px solid #e2e8f0;
    text-align: center;
    white-space: nowrap;
    font-style: normal;
    vertical-align: middle;
    line-height: 1.2;
  }
  
  thead th:first-child {
    text-align: left;
    padding-left: 12px;
  }

  tbody td {
    padding: 8px 6px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  
  /* ✅ Label Cell 스타일 수정: Tooltip 로직 추가 */
  td.label {
    padding: 0; /* 내부 div가 패딩을 담당 */
    vertical-align: middle;
  }

  /* 툴팁을 위한 내부 Wrapper */
  .cell-inner {
    padding: 8px 6px 8px 12px; /* 기존 td 패딩 복구 */
    position: relative;
    width: 100%;
    max-width: 200px;
    display: flex;
    align-items: center;
  }

  /* 말줄임표 처리된 텍스트 */
  .text-content {
    display: block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    color: #1e293b;
    font-size: 1.2rem;
  }

  /* 툴팁 박스 (Hover시 등장) */
  .tooltip-box {
    display: none;
    position: absolute;
    top: -30px; /* 텍스트 바로 위쪽 */
    left: 12px;
    z-index: 100;
    
    background-color: #1e293b;
    color: #fff;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    pointer-events: none; /* 툴팁 위에서 마우스 간섭 방지 */
  }

  /* 화살표 장식 (옵션) */
  .tooltip-box::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 10px;
    border-width: 5px;
    border-style: solid;
    border-color: #1e293b transparent transparent transparent;
  }

  /* Hover 효과 */
  .cell-inner:hover .tooltip-box {
    display: block;
  }

  td input {
    width: 100%;
    height: 36px;
    padding: 0 8px;
    border-radius: 6px;
    text-align: right;
    font-size: 14px;
    font-weight: 600;
    outline: none;
    border: 1px solid transparent;
    font-style: normal;
  }

  td:nth-child(2) input {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    font-size: 1.2rem;
  }

  td:nth-child(3) input,
  td:nth-child(4) input {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
    font-size: 1.2rem;
  }
  thead {
    border-top-left-radius: 6px !important;
    border-top-right-radius: 6px !important;
    overflow: hidden;
    background-color: #81889E !important;
  }
`;

export const PredHint = styled.div`
  margin-top: 15px;
  font-size: var(--font-size-base);
  color: var(--text-neutral-medium);
`;

export const ChartWrap = styled.div`
  height: 420px;
`;

// ... Modal 관련 스타일들은 기존 그대로 유지 ...
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 10050;
  display: grid;
  place-items: center;
`;

const ModalPanel = styled.div`
  width: min(860px, 92vw);
  max-height: 80vh;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  font-size: 1.2rem;
`;

const ModalHead = styled.div`
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef2f7;
  background-color: #fff;

  h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  button {
    border: 0;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 6px 10px;
    font-weight: 700;
    cursor: pointer;
  }
`;

const ModalBody = styled.div`
  padding: 0 16px 18px 16px;
  overflow: auto;
`;

const DetailTable = styled.table`
  min-width: 100%;
  overflow-x: scroll;
  border-collapse: separate;
  border-spacing: 0;
  
  th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #81889E;
    color: #FFFFFF;
    font-weight: 600;
    padding: 10px;
    border-bottom: 2px solid #e2e8f0;
    text-align: center;
    font-style: normal;
    vertical-align: middle;
    font-size: 1.2rem;
  }
  
  th:first-child { text-align: left; }
  
  td {
    border-bottom: 1px solid #f1f5f9;
    padding: 10px 12px;
    font-size: 14px;
    color: #334155;
    vertical-align: middle;
    font-style: normal;
    font-size: 1.2rem;
  }

  td:not(:first-child) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  td:nth-child(2) {
    color: #1d4ed8;
    font-weight: 600;
    background-color: #eff6ff;
  }
`;

const ErrorBar = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #7f1d1d;
  border-radius: 8px;
  strong { font-weight: 800; }
  span { flex: 1; }
  button {
    background: #fecaca; color:#7f1d1d; border:0; padding:6px 10px;
    border-radius:6px; cursor:pointer;
  }
`;