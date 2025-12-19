import styled from "styled-components";
import { MdSettings } from "react-icons/md";
import { 
  Card, SectionHeader, PredGrid, PredCard, PredHead, PredTableWrap, PredTable 
} from "../styles/styles";
import { PredictionCard } from "../types/types";

const fmt3 = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : "0.000";
};

interface Props {
  preds: PredictionCard[];
  onTogglePred: (id: string) => void;
  onOpenDetail: (pred: PredictionCard) => void;
  onManageProperties: () => void; // ✅ [추가] 물성 관리 핸들러
}

export default function PredictionListSection({ 
  preds, onTogglePred, onOpenDetail, onManageProperties 
}: Props) {
  
  // 데이터가 없어도 UI 형태 유지를 위한 더미
  const displayPreds = preds.length > 0 ? preds : [{
    id: "default-pred",
    title: "Test case - 1",
    checked: true, // ✅ 기본 체크
    propKeys: ["물성1", "물성2", "물성3", "물성4", "물성5", "물성6"],
    props: Array(6).fill(0),
    ciLow: Array(6).fill(0),
    ciHigh: Array(6).fill(0),
    propCount: 6,
  } as PredictionCard];

  return (
    <Card style={{ paddingBottom: 0 }}>
      <SectionHeader>
        <h3>예측 물성</h3>
      </SectionHeader>

      <PredGrid>
        {displayPreds.map((p) => {
          const rowsCount = p.propKeys?.length || 6;
          
          return (
            <PredCard
              className={`${preds.length > 1 ? "mutiple" : ""}`}
              key={p.id}
              onClick={() => preds.length > 0 ? onOpenDetail(p) : null}
              role="button"
              tabIndex={0}
              style={{ cursor: preds.length > 0 ? 'pointer' : 'default' }}
            >
              <PredHead style={{ justifyContent: 'space-between' }}> {/* ✅ 우측 정렬 명시 */}
                <span>{p.title}</span>
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={p.checked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => preds.length > 0 ? onTogglePred(p.id) : null}
                  disabled={preds.length === 0}
                />
              </PredHead>

              <PredTableWrap>
                <PredTable>
                  <thead>
                    <tr>
                      <th>CODENAME</th><th>예측물성</th><th>하한값</th><th>상한값</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: rowsCount }, (_, i) => {
                      const codeName = p.propKeys?.[i] ?? `물성${i+1}`;
                      const v = Number(p.props?.[i] ?? 0);
                      const lo = Number(p.ciLow?.[i] ?? 0);
                      const hi = Number(p.ciHigh?.[i] ?? 0);
                      return (
                        <tr key={`${p.id}-row-${i}`}>
                          <td className="label">
                            <div className="cell-inner">
                              <span className="text-content">{codeName}</span>
                              <span className="tooltip-box">{codeName}</span>
                            </div>
                          </td>
                          {/* 예측물성 Blue 텍스트 */}
                          <td>
                            <input readOnly value={fmt3(v)} style={{ color: '#2563eb', fontWeight: 700, background:'#fff' }} />
                          </td>
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

      {/* ✅ [연결] 물성 관리 버튼 */}
      <ManageButtonArea>
        <ManageButton onClick={onManageProperties}>
          <MdSettings /> 물성 관리
        </ManageButton>
      </ManageButtonArea>
    </Card>
  );
}

const ManageButtonArea = styled.div`
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  display: flex; justify-content: center;
`;
const ManageButton = styled.button`
  width: 100%; height: 48px;
  background-color: #374151; color: white;
  border: none; border-radius: 8px;
  font-size: 18px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer;
  &:hover { background-color: #1f2937; }
  svg { font-size: 18px; }
`;