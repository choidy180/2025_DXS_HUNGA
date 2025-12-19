import { useMemo } from "react";
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
  ChartData,
  ChartOptions
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";
import { Card, SectionHeader, ChartWrap } from "../styles/styles";
import { CaseCard, PredictionCard } from "../types/types";

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

interface Props {
  cases: CaseCard[];
  preds: PredictionCard[];
  theme?: "light" | "dark";
}

export default function ChartSection({ cases, preds, theme = "light" }: Props) {
  const tickColor = theme === "dark" ? "#C3C6D4" : "#666";
  const gridColor = theme === "dark" ? "rgba(70,78,94,1)" : "rgba(0,0,0,0.1)";

  // --- Bar Chart Logic ---
  const barData: ChartData<"bar"> = useMemo(() => {
    // ✅ [Fix] cases가 없거나 비어있으면 빈 데이터 반환 (에러 방지)
    if (!cases || cases.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = cases.map((c) => c.title);
    
    // 가장 원재료가 많은 케이스 찾기 (Reduce 에러 방지됨)
    const longest = cases.reduce((a, b) =>
      (a.ingredients?.length ?? 0) >= (b.ingredients?.length ?? 0) ? a : b
    );
    
    const dsLabels = (longest?.ingredients ?? []).map((ing, i) => ing?.name || `재료${i + 1}`);

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
      
      // 해당 인덱스의 라벨이 없으면 기본값 사용
      const label = dsLabels[ingIdx] ?? `재료${ingIdx + 1}`;

      return {
        label,
        data: dataPerCase,
        backgroundColor: pal[ingIdx % pal.length],
        borderColor: palB[ingIdx % palB.length],
        borderWidth: 1,
      };
    });

    return { labels, datasets };
  }, [cases]);

  const barOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 14 } },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: { color: tickColor, font: { size: 14 } },
          grid: { color: gridColor },
        },
      },
      plugins: {
        legend: { position: "top", labels: { color: tickColor, font: { size: 14 } } },
        tooltip: { enabled: true },
      },
      elements: { bar: { borderRadius: 3 } },
    }),
    [tickColor, gridColor]
  );

  // --- Radar Chart Logic ---
  const radarData: ChartData<"radar"> = useMemo(() => {
    const checkedPreds = preds.filter((p) => p.checked);

    if (checkedPreds.length === 0) {
      // 기본 축 라벨만 보여주거나 빈 상태
      return { 
        labels: ["물성1", "물성2", "물성3", "물성4", "물성5", "물성6"], 
        datasets: [] 
      };
    }

    // 첫 번째 체크된 아이템의 키를 기준으로 라벨 설정
    const labels = (checkedPreds[0].propKeys && checkedPreds[0].propKeys.length > 0)
      ? checkedPreds[0].propKeys
      : ["물성1", "물성2", "물성3", "물성4", "물성5", "물성6"];

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
      data: labels.map((_, idx) => Number(p.props[idx] ?? 0)),
      backgroundColor: palFill[i % palFill.length],
      borderColor: palStroke[i % palStroke.length],
      pointBackgroundColor: palStroke[i % palStroke.length],
      borderWidth: 1,
      pointRadius: 3,
    }));

    return { labels, datasets };
  }, [preds]);

  const radarOptions: ChartOptions<"radar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { display: true },
          suggestedMin: 0,
          // suggestedMax: 100, // 필요시 주석 해제
          ticks: { backdropColor: "transparent", color: "#666", font: { size: 12 } },
          grid: { color: "#e5e7eb" },
          pointLabels: { color: "#666", font: { size: 14, weight: 600 } },
        },
      },
      plugins: {
        legend: { position: "top", labels: { color: "#666", font: { size: 14 } } },
      },
    }),
    []
  );

  return (
    <>
      <Card>
        <SectionHeader style={{ marginBottom: 0 }}>
          <h3>케이스별 원재료 Bar</h3>
        </SectionHeader>
        <ChartWrap>
          <Bar data={barData} options={barOptions} />
        </ChartWrap>
      </Card>

      <Card>
        <SectionHeader style={{ marginBottom: 0 }}>
          <h3>예측 레이더</h3>
        </SectionHeader>
        <ChartWrap>
          <Radar data={radarData} options={radarOptions} />
        </ChartWrap>
      </Card>
    </>
  );
}