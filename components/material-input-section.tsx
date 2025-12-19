import { useState } from "react";
import { LuCopy } from "react-icons/lu";
import { GoTrash } from "react-icons/go";
import { IoMdCheckmarkCircle } from "react-icons/io";
import { MdDownload } from "react-icons/md";
import { 
  Card, SectionHeader, AddBtn, CaseGrid, CaseBox, CaseHead, Inputs, Row, IconBtn, 
  SubBar, AddSmall, FooterRow, RunBtn, ExcelBtn 
} from "../styles/styles";
import { CaseCard, Option } from "../types/types";
import SelectPopup from "./select-popup"; 

interface Props {
  cases: CaseCard[];
  maxCase: number;
  maxIng: number;
  materialOptions: Option[];
  onAddCase: () => void;
  onCopyCase: (id: string) => void;
  onDeleteCase: (id: string) => void;
  onAddIngredient: (caseId: string) => void;
  onRemoveIngredient: (caseId: string, idx: number) => void;
  onUpdateIngredientValue: (caseId: string, idx: number, val: number) => void;
  onUpdateIngredientName: (caseId: string, idx: number, name: string) => void;
  onRunPrediction: () => void;
  onDownloadExcel: () => void;
}

export default function MaterialInputSection({
  cases, maxCase, maxIng, materialOptions,
  onAddCase, onCopyCase, onDeleteCase, 
  onAddIngredient, onRemoveIngredient, 
  onUpdateIngredientValue, onUpdateIngredientName,
  onRunPrediction, onDownloadExcel
}: Props) {
  
  const [openIdx, setOpenIdx] = useState<{ caseId: string; index: number } | null>(null);

  // ✅ [핸들러] 입력창 포커스 해제(Blur) 시 유효성 검사
  const handleBlur = (caseId: string, idx: number, value: number) => {
    // 0 이하인 경우(0 또는 음수) 경고 및 1로 초기화
    if (value <= 0) {
      alert("입력값은 0보다 커야 합니다.\n(기본값 1로 초기화됩니다.)");
      onUpdateIngredientValue(caseId, idx, 1);
    }
  };

  return (
    <Card>
      <SectionHeader>
        <h3>원재료 입력</h3>
        <AddBtn onClick={onAddCase}>+ case 추가 ({cases.length}/{maxCase})</AddBtn>
      </SectionHeader>

      <CaseGrid>
        {cases.map((c) => (
          <CaseBox className={`${cases.length > 1 ? "mutiple" : ""}`} key={c.id}>
            <CaseHead>
              <span>{'Test ' + c.title}</span>
              <div className="actions">
                <button title="복사" onClick={() => onCopyCase(c.id)}><LuCopy /></button>
                <button title="삭제" onClick={() => onDeleteCase(c.id)}><GoTrash /></button>
              </div>
            </CaseHead>

            <Inputs>
              {c.ingredients.map((ing, idx) => {
                const selected = materialOptions.find((o) => o.value === ing.name || o.label === ing.name) ?? materialOptions[0];
                return (
                  <Row key={`${c.id}-${idx}`}>
                    <button
                      type="button"
                      className="select-like"
                      onClick={() => setOpenIdx({ caseId: c.id, index: idx })}
                    >
                      {selected?.label ?? `재료 ${idx + 1}`}
                    </button>

                    {/* ✅ [수정됨] Input 로직 적용 */}
                    <input
                      type="number"
                      min={0}
                      step="any" // 소수점 입력 허용
                      // [수정 포인트] 0일 때 빈 값("")으로 치환하던 로직 제거 -> 0이 보이도록 함
                      value={ing.value} 
                      onChange={(e) => {
                        const valStr = e.target.value;
                        
                        // 1. 내용을 다 지웠을 때 (일시적으로 0으로 처리)
                        if (valStr === "") {
                          onUpdateIngredientValue(c.id, idx, 0); 
                          return;
                        }

                        const val = Number(valStr);

                        // 2. 음수 입력 방지 (0은 입력 가능)
                        if (val < 0) return;

                        // 3. 값 업데이트
                        onUpdateIngredientValue(c.id, idx, val);
                      }}
                      // 4. 포커스 나갈 때 0 이하면 Alert & 1로 변경
                      onBlur={() => handleBlur(c.id, idx, ing.value)} 
                    />

                    <IconBtn onClick={() => onRemoveIngredient(c.id, idx)} title="삭제">
                      <GoTrash />
                    </IconBtn>

                    <SelectPopup
                      open={openIdx?.caseId === c.id && openIdx?.index === idx}
                      options={materialOptions}
                      value={selected?.label}
                      onClose={() => setOpenIdx(null)}
                      onSelect={(opt) => {
                        setOpenIdx(null);
                        onUpdateIngredientName(c.id, idx, opt.label);
                      }}
                    />
                  </Row>
                );
              })}
            </Inputs>

            <SubBar>
              <AddSmall onClick={() => onAddIngredient(c.id)}>
                원재료 추가 ({c.ingredients.length}/{maxIng})
              </AddSmall>
            </SubBar>
          </CaseBox>
        ))}
      </CaseGrid>
      
      <p className="left-right">
        {cases.length > 2 ? "← 좌우로 스크롤하여 다른 케이스를 확인하세요 →" : ""}
      </p>

      <FooterRow>
        <RunBtn onClick={onRunPrediction}><IoMdCheckmarkCircle />물성 예측 실행</RunBtn>
        <ExcelBtn onClick={onDownloadExcel}><MdDownload />레시피 다운로드 (Excel)</ExcelBtn>
      </FooterRow>
    </Card>
  );
}