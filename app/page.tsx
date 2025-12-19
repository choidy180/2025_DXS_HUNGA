"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Header from "@/components/header";

// ❌ [삭제] 정적 데이터 import 제거
// import { ROW_MATERIALS_CODE_NAME_LIST } from "@/data/code-name-map";
import { LoadingSpinnerComponent } from "@/components/loading/loading-spinner";
import { codeMapping, downloadXlsxFromCases, LabDefaults } from "@/utils/makeExcel";
import { PageWrap, TopGrid, BottomGrid, ErrorBar } from "../styles/styles";
import { CaseCard, PredictionCard, Option, PredDetailRow, Ingredient } from "../types/types";

// 컴포넌트
import MaterialInputSection from "../components/material-input-section";
import PredictionListSection from "../components/prediction-list-section";
import ChartSection from "../components/chart-section";
import PredictionDetailModal from "../components/prediction-detail-modal";
import PropertySelectModal from "../components/property-select-modal";
import ResultPage from "@/components/resultPage";
import RelearningLogPage from "@/components/relearning-log-page";

const uuid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random()}`;

export default function DXHungaPage() {
  const [activeTab, setActiveTab] = useState("메인");
  const [mounted, setMounted] = useState(false);
  
  const [cases, setCases] = useState<CaseCard[]>([]);
  const [preds, setPreds] = useState<PredictionCard[]>([]); 
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<boolean>(false);

  // 모달 상태
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailRows, setDetailRows] = useState<PredDetailRow[]>([]);
  
  // 물성 관리 모달 상태
  const [propModalOpen, setPropModalOpen] = useState(false);
  const [allItemT, setAllItemT] = useState<Option[]>([]); 
  const [selectedItemT, setSelectedItemT] = useState<string[]>([]); 

  // ---------------------------------------------------------------------------
  // [Options] ✅ API 데이터로 관리하기 위해 State로 변경
  // ---------------------------------------------------------------------------
  const [materialOptions, setMaterialOptions] = useState<Option[]>([]);

  // ✅ [수정] 옵션 리스트가 아직 로드되지 않았을 경우를 대비하여 로직 수정
  // 특정 리스트(list)가 인자로 들어오면 그것을 쓰고, 아니면 state를 사용
  const pickLabelByIndex = (i: number, list?: Option[]) => {
    const targetList = list || materialOptions;
    if (targetList.length === 0) return `재료 ${i + 1}`;
    return targetList[(i + targetList.length) % targetList.length]?.label ?? `재료 ${i + 1}`;
  };

  const MAX_CASE = 10;
  const MAX_ING = 100;

  // ---------------------------------------------------------------------------
  // [Logic] Data Transformation & Defaults
  // ---------------------------------------------------------------------------
  // ✅ [수정] 초기 생성 시 사용할 옵션 리스트를 인자로 받을 수 있도록 변경
  const createDefaultCases = (options?: Option[]): CaseCard[] => {
    const defaultLabel = (options && options.length > 0) ? options[0].label : "원재료1";
    return [
      { id: uuid(), title: "case - 1", ingredients: [{ name: defaultLabel, value: 1 }] },
      { id: uuid(), title: "case - 2", ingredients: [{ name: defaultLabel, value: 1 }] }
    ];
  };

  // ✅ [수정] 변환 로직에서도 옵션 리스트를 인자로 받아 처리 (useEffect 내에서 최신 데이터 사용 위함)
  const transformDataToCases = (rows: any[], options?: Option[]): CaseCard[] => {
    const grouped = new Map<string, any[]>();
    rows.forEach(row => {
      const key = row.ID || row.RECIPE_IDX || row.TITLE || `case-${Math.random()}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(row);
    });

    const result: CaseCard[] = [];
    let index = 1;

    grouped.forEach((groupRows, key) => {
      if (index > MAX_CASE) return;
      const firstRow = groupRows[0];
      const caseTitle = firstRow.TITLE || firstRow.CASE_NAME || `Case - ${index}`;
      const ingredients: Ingredient[] = groupRows
        .filter((r: any) => r.CODE && r.CODE.includes("ITEM_M"))
        .map((r: any) => ({
          name: r.MAT_NAME || r.NAME || pickLabelByIndex(0, options),
          value: Number(r.VALUE ?? r.QUANTITY ?? 0)
        }));
      if (ingredients.length === 0) ingredients.push({ name: pickLabelByIndex(0, options), value: 0 });
      result.push({ id: String(key), title: caseTitle, ingredients: ingredients });
      index++;
    });

    if (result.length === 0) return createDefaultCases(options);
    result.forEach(c => { if(c.ingredients.length > 0) c.ingredients[0].value = 1; });
    return result;
  };

  // 예측 카드 업데이트 함수
  const updatePredictionCard = (selectedCodes: string[], sourceOptions: Option[]) => {
    const defaultTitle = "Test case - 1";
    
    // 🔍 코드에 해당하는 이름(Label) 찾기
    const mappedLabels = selectedCodes.map(code => {
      const found = sourceOptions.find(o => o.value === code);
      return found ? found.label : code; 
    });

    setPreds([{
      id: "pred-card-1",
      title: defaultTitle,
      checked: true,
      propCount: selectedCodes.length,
      caseId: "case-1",
      propKeys: mappedLabels,
      props: Array(selectedCodes.length).fill(0),
      ciLow: Array(selectedCodes.length).fill(0),
      ciHigh: Array(selectedCodes.length).fill(0),
    }]);
  };

  // ---------------------------------------------------------------------------
  // [Effect] Initial Fetch
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingState(true);
      try {
        const response = await fetch("http://1.254.24.170:24828/api/DX_API002002", {
          method: "GET", headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const result = await response.json();
        const allRows = Array.isArray(result) ? result : (result.rows || []);

        // ✅ [추가] 1. 원재료 (ITEM_M) 데이터 추출 및 옵션 생성
        const mRows = allRows.filter((r: any) => r.CODE && r.CODE.includes("ITEM_M"));
        
        // 원재료 옵션 리스트 생성
        const fetchedMOptions: Option[] = Array.from(new Set(mRows.map((r: any) => r.CODE)))
          .map(code => {
            const row = mRows.find((r: any) => r.CODE === code);
            return {
              value: String(code),
              label: row?.CODENAME || row?.MAT_NAME || row?.NAME || String(code)
            };
          });
        
        setMaterialOptions(fetchedMOptions);

        // 2. Cases 생성 (ITEM_M 데이터를 이용)
        // mRows가 있으면 그것으로 케이스를 만들되, 방금 만든 fetchedMOptions를 사용하여 라벨링
        if (mRows.length === 0) {
          setCases(createDefaultCases(fetchedMOptions));
        } else {
          // transformDataToCases 내에서 pickLabelByIndex를 사용할 때 fetchedMOptions를 참조하도록 전달
          setCases(transformDataToCases(mRows, fetchedMOptions).slice(0, 2));
        }

        // 3. Predictions (ITEM_T)
        const tRows = allRows.filter((r: any) => r.CODE && r.CODE.includes("ITEM_T"));
        
        const uniqueT = Array.from(new Set(tRows.map((r: any) => r.CODE)))
          .map((code) => {
            const strCode = String(code);
            const row = tRows.find((r: any) => r.CODE === strCode);
            return { 
              value: strCode, 
              label: row?.CODENAME || row?.MAT_NAME || row?.NAME || strCode 
            };
          });
        
        setAllItemT(uniqueT);

        // 초기 6개 선택
        const initialSelected = uniqueT.slice(0, 6).map(o => o.value);
        setSelectedItemT(initialSelected);
        
        updatePredictionCard(initialSelected, uniqueT);

      } catch (err: any) {
        console.warn("API Fail:", err);
        
        // 에러 시 폴백 데이터 설정
        // const mockM = [{ value: "ITEM_M_01", label: "원재료 A" }, { value: "ITEM_M_02", label: "원재료 B" }];
        // setMaterialOptions(mockM);
        // setCases(createDefaultCases(mockM));
        setCases(createDefaultCases()); // 완전 기본값

        const mockT = Array.from({ length: 10 }, (_, i) => ({ 
          value: `ITEM_T_${i+1}`, label: `Mock Property ${i+1}` 
        }));
        setAllItemT(mockT);
        
        const initialSelected = mockT.slice(0, 6).map(o => o.value);
        setSelectedItemT(initialSelected);
        updatePredictionCard(initialSelected, mockT);

        setErrorMsg("서버 응답 없음: 테스트 데이터로 초기화되었습니다.");
      } finally {
        setLoadingState(false);
      }
    };
    fetchInitialData();
  }, []);

  // ---------------------------------------------------------------------------
  // [Handlers]
  // ---------------------------------------------------------------------------
  const renameCases = (arr: CaseCard[]) => arr.map((c, i) => ({ ...c, title: `case - ${i + 1}` }));
  const addCase = () => setCases(prev => prev.length >= MAX_CASE ? prev : renameCases([...prev, { id: uuid(), title: "", ingredients: [{ name: pickLabelByIndex(0), value: 1 }] }]));
  const copyCase = (id: string) => setCases(prev => prev.length >= MAX_CASE ? prev : renameCases([...prev, { id: uuid(), title: "", ingredients: prev.find(c => c.id === id)!.ingredients.map(x => ({ ...x })) }]));
  const deleteCase = (id: string) => setCases(prev => prev.length <= 1 ? prev : renameCases(prev.filter(c => c.id !== id)));
  const addIngredient = (caseId: string) => setCases(prev => prev.map(c => c.id === caseId && c.ingredients.length < MAX_ING ? { ...c, ingredients: [...c.ingredients, { name: pickLabelByIndex(c.ingredients.length), value: 1 }] } : c));
  const removeIngredient = (caseId: string, idx: number) => setCases(prev => prev.map(c => c.id === caseId && c.ingredients.length > 1 ? { ...c, ingredients: c.ingredients.filter((_, i) => i !== idx) } : c));
  const updateIngredientValue = (caseId: string, idx: number, val: number) => setCases(prev => prev.map(c => c.id === caseId ? { ...c, ingredients: c.ingredients.map((ing, i) => i === idx ? { ...ing, value: val } : ing) } : c));
  const updateIngredientName = (caseId: string, idx: number, name: string) => setCases(prev => prev.map(c => c.id === caseId ? { ...c, ingredients: c.ingredients.map((ing, i) => i === idx ? { ...ing, name } : ing) } : c));

  // ---------------------------------------------------------------------------
  // [Handlers] Prediction & ETC
  // ---------------------------------------------------------------------------
  const runPrediction = async () => {
    setErrorMsg(null);
    setLoadingState(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://1.254.24.170:24828";

    // 1. 선택된 물성 코드들을 쉼표로 연결
    const predictListStr = selectedItemT.join(",");

    // 2. 요청 데이터 변환 (각 케이스마다 PREDICT_LIST 추가)
    const dataObject: Record<string, Record<string, string>> = Object.fromEntries(
      cases.map((c, idx) => {
        // 기존 원재료 데이터
        const ingredientsData = Object.fromEntries(
          (c.ingredients ?? []).map((ing, i) => [
            String((ing.name ?? `재료${i + 1}`).toString().trim()),
            String((ing.value ?? "").toString().trim()),
          ])
        );

        // 원재료 데이터 + PREDICT_LIST 합치기
        return [
          String(idx + 1),
          {
            ...ingredientsData,
            "PREDICT_LIST": predictListStr
          }
        ];
      })
    );

    try {
      // 3. 입력 데이터 전송 (INSERT)
      type InsertRes = { insertedRows?: { insertedId: number }[] };
      
      const insertRes = await fetch(`${API_BASE}/api/DX_API002003`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataObject }), 
      });

      if (!insertRes.ok) throw new Error(`Insert Failed: ${insertRes.status}`);
      const insertData = await insertRes.json() as InsertRes;

      const insertedIds = insertData.insertedRows?.map((r) => r.insertedId) || [];
      if (insertedIds.length === 0) throw new Error("서버에서 처리된 ID가 반환되지 않았습니다.");

      // 4. 예측 실행 (PREDICT)
      const predictRes = await fetch(`${API_BASE}/api/DX_API002004`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idList: insertedIds }),
      });

      if (!predictRes.ok) throw new Error(`Prediction Failed: ${predictRes.status}`);
      
      const predictData = await predictRes.json();
      
      let flatRows: any[] = [];
      if (Array.isArray(predictData)) flatRows = predictData;
      else if (predictData && typeof predictData === 'object') {
        flatRows = predictData.rows || predictData.data || predictData.items || predictData.result || [];
      }

      if (flatRows.length === 0) {
        throw new Error("예측 결과가 비어 있습니다.");
      }

      // 5. 결과 그룹화 (Key: RECIPE_IDX)
      const groupedMap = new Map<string, any[]>();
      flatRows.forEach((r) => {
        const rawId = r.RECIPE_IDX ?? r.recipe_idx;
        if (rawId === undefined || rawId === null) return;
        const key = String(rawId);
        if (!groupedMap.has(key)) groupedMap.set(key, []);
        groupedMap.get(key)?.push(r);
      });

      // 6. 카드 데이터 업데이트 (선택된 물성 selectedItemT 기준 매핑)
      const nextPreds: PredictionCard[] = cases.map((c, i) => {
        const serverId = String(insertedIds[i]); 
        const caseRows = groupedMap.get(serverId) ?? [];

        const mappedProps: number[] = [];
        const mappedCiLow: number[] = [];
        const mappedCiHigh: number[] = [];
        const mappedLabels: string[] = [];
        const mappedDetails: PredDetailRow[] = [];

        selectedItemT.forEach((code) => {
          const option = allItemT.find(o => o.value === code);
          const labelName = option ? option.label : code;
          mappedLabels.push(labelName);

          const matchedRow = caseRows.find((r) => r.CODE === code);

          const val = Number(matchedRow?.y_pred ?? 0);
          const low = Number(matchedRow?.ci_low ?? 0);
          const high = Number(matchedRow?.ci_high ?? 0);

          mappedProps.push(val);
          mappedCiLow.push(low);
          mappedCiHigh.push(high);

          mappedDetails.push({
            codeName: labelName,
            y_pred: val,
            ci_low: low,
            ci_high: high
          });
        });

        return {
          id: uuid(),
          title: c.title,
          checked: i === 0,
          propCount: selectedItemT.length,
          caseId: c.id,
          propKeys: mappedLabels,
          props: mappedProps,
          ciLow: mappedCiLow,
          ciHigh: mappedCiHigh,
          detailRows: mappedDetails,
        };
      });

      setPreds(nextPreds);

    } catch (err: any) {
      console.error("Run Prediction Error:", err);
      setErrorMsg(err.message || "예측 실행 중 오류가 발생했습니다.");
    } finally {
      setLoadingState(false);
    }
  };
  const handleDownloadXlsx = () => { /* ... */ };
  const togglePred = (id: string) => setPreds(prev => prev.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
  const openDetailFor = (pred: PredictionCard) => { setDetailTitle(pred.title); setDetailRows(pred.detailRows || []); setDetailOpen(true); };

  const handlePropertyConfirm = (newSelected: string[]) => {
    setSelectedItemT(newSelected);
    updatePredictionCard(newSelected, allItemT);
  };

  return (
    <Container>
      <Wrapper>
        <Header initialActiveTab={activeTab} onTabChange={setActiveTab} />
        {
          activeTab === "메인" &&
          (
            <PageWrap>
              <TopGrid>
                <MaterialInputSection 
                  cases={cases} maxCase={MAX_CASE} maxIng={MAX_ING} materialOptions={materialOptions}
                  onAddCase={addCase} onCopyCase={copyCase} onDeleteCase={deleteCase}
                  onAddIngredient={addIngredient} onRemoveIngredient={removeIngredient}
                  onUpdateIngredientValue={updateIngredientValue} onUpdateIngredientName={updateIngredientName}
                  onRunPrediction={runPrediction} onDownloadExcel={handleDownloadXlsx}
                />

                <PredictionListSection 
                  preds={preds} 
                  onTogglePred={togglePred} 
                  onOpenDetail={openDetailFor}
                  onManageProperties={() => setPropModalOpen(true)}
                />
              </TopGrid>

              {errorMsg && <ErrorBar role="alert"><strong>요청 실패</strong><span>{errorMsg}</span><button onClick={() => setErrorMsg(null)}>닫기</button></ErrorBar>}

              <BottomGrid>
                <ChartSection cases={cases} preds={preds} />
              </BottomGrid>

              <PredictionDetailModal open={detailOpen} title={detailTitle} rows={detailRows} onClose={() => setDetailOpen(false)} />
              
              <PropertySelectModal 
                open={propModalOpen}
                options={allItemT}
                selectedCodes={selectedItemT}
                onClose={() => setPropModalOpen(false)}
                onConfirm={handlePropertyConfirm}
              />

              {loadingState && <LoadingSpinnerComponent opacity={0.5} />}
            </PageWrap>
          )
        }
        {activeTab === "히스토리" && <ResultPage/>}
        {activeTab === "재학습" && <RelearningLogPage/>}
      </Wrapper>
    </Container>
  );
}

const Container = styled.div`width: 100%; min-height: 100vh; background-color: #F4F5F7; display: flex; flex-direction: row;`;
const Wrapper = styled.div`width: 100%; min-height: 100vh; display: flex; flex-direction: column;`;