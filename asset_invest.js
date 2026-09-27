// ============================================================
// 퇴직연금 적립식 투자 시뮬레이션 - 렌더링 스크립트
// DATA 는 data.js 에서 주입됨 (analysis.py 의 계산 결과)
// ============================================================

const won = (n) => {
  const sign = n < 0 ? "-" : "";
  n = Math.abs(Math.round(n));
  if (n >= 100000000) return sign + (n / 100000000).toFixed(n >= 1000000000 ? 1 : 2) + "억원";
  if (n >= 10000) return sign + (n / 10000).toFixed(0) + "만원";
  return sign + n.toLocaleString() + "원";
};
const wonFull = (n) => Math.round(n).toLocaleString() + "원";
const pct = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%";
const pct2 = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";

document.getElementById("metaPeriod").textContent = `${DATA.start} ~ ${DATA.end} (${DATA.months}개월)`;
document.getElementById("metaMonthly").textContent = wonFull(DATA.monthly_total);
document.getElementById("metaPrincipal").textContent = won(DATA.total_principal);
document.getElementById("genDate").textContent = `생성일: ${DATA.generated}`;

// ---------------- 1) KPI ----------------
const kpiGrid = document.getElementById("kpiGrid");
const kpis = [
  { label: "5년 누적 투자 원금", value: won(DATA.total_principal), sub: `월 ${wonFull(DATA.monthly_total)} × 60개월` },
  { label: "Normal 케이스 5년 후 평가금액", value: won(DATA.base_future.normal), sub: pct(DATA.base_future.normal / DATA.total_principal - 1) + " 누적수익률" },
  { label: "Best 케이스 5년 후 평가금액", value: won(DATA.base_future.best), sub: pct(DATA.base_future.best / DATA.total_principal - 1) + " 누적수익률" },
  { label: "Worst 케이스 5년 후 평가금액", value: won(DATA.base_future.worst), sub: pct(DATA.base_future.worst / DATA.total_principal - 1) + " 누적수익률" },
];
kpiGrid.innerHTML = kpis.map(k => `
  <div class="kpi">
    <div class="label">${k.label}</div>
    <div class="value">${k.value}</div>
    <div class="sub">${k.sub}</div>
  </div>`).join("");

// ---------------- 2) Case cards ----------------
const caseMeta = {
  best: { title: "Best (호황)", tag: "BEST", desc: "각 상품이 추종하는 자산군의 실제 있었던 최선의 5년 구간(또는 상품 상장이후 최고 실측 구간) 연복리수익률을 적용" },
  normal: { title: "Normal (기본)", tag: "NORMAL", desc: "각 상품(또는 추종 자산군)의 20년 전체 실측 연복리수익률, 또는 상품 상장이후 실측 연환산수익률을 적용" },
  worst: { title: "Worst (악화)", tag: "WORST", desc: "각 상품이 추종하는 자산군의 실제 있었던 최악의 5년 구간(또는 상품 실측 최저 구간) 연복리수익률을 적용" },
};
const caseGrid = document.getElementById("caseGrid");
caseGrid.innerHTML = ["best", "normal", "worst"].map(c => {
  const fv = DATA.base_future[c];
  const profit = fv - DATA.total_principal;
  const roi = profit / DATA.total_principal;
  const top3 = Object.values(DATA.base_per_asset)
    .sort((a, b) => (b.values[c] - b.principal) - (a.values[c] - a.principal))
    .slice(0, 3);
  return `
  <div class="case-card ${c}">
    <span class="tag">${caseMeta[c].tag}</span>
    <h3>${caseMeta[c].title}</h3>
    <div class="final">${won(fv)} <small>평가금액</small></div>
    <div class="profit ${profit >= 0 ? 'pos' : 'neg'}">${profit >= 0 ? '+' : ''}${won(profit)} 손익 (${pct(roi)})</div>
    <div class="basis">
      <div>${caseMeta[c].desc}</div>
      <ul>
        ${top3.map(a => `<li>${a.name}: ${wonFull(a.values[c])} (월 ${wonFull(a.monthly)} 적립)</li>`).join("")}
      </ul>
    </div>
  </div>`;
}).join("");

// ---------------- 3) Trajectory chart ----------------
try {
  if (typeof Chart === "undefined") throw new Error("Chart.js library failed to load (offline?)");
  const labels = DATA.principal_path.map((_, i) => {
    const m = i + 1;
    const y = 2026 + Math.floor((8 + m) / 12);
    const mo = ((8 + m) % 12) + 1;
    return `${y}.${String(mo).padStart(2, "0")}`;
  });
  new Chart(document.getElementById("trajChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "누적 원금", data: DATA.principal_path, borderColor: "#8892a8", borderDash: [4, 3], pointRadius: 0, borderWidth: 1.5, tension: 0 },
        { label: "Best", data: DATA.value_path.best, borderColor: "#3ddc97", backgroundColor: "rgba(61,220,151,.08)", pointRadius: 0, borderWidth: 2, fill: true, tension: 0.15 },
        { label: "Normal", data: DATA.value_path.normal, borderColor: "#4f8cff", backgroundColor: "rgba(79,140,255,.10)", pointRadius: 0, borderWidth: 2.4, fill: true, tension: 0.15 },
        { label: "Worst", data: DATA.value_path.worst, borderColor: "#ff6b6b", backgroundColor: "rgba(255,107,107,.06)", pointRadius: 0, borderWidth: 2, fill: true, tension: 0.15 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#9aa5bd", usePointStyle: true } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${wonFull(ctx.parsed.y)}` } },
      },
      scales: {
        x: { ticks: { color: "#9aa5bd", maxTicksLimit: 12 }, grid: { color: "rgba(154,165,189,.08)" } },
        y: { ticks: { color: "#9aa5bd", callback: (v) => won(v) }, grid: { color: "rgba(154,165,189,.08)" } },
      },
    },
  });
} catch (err) {
  console.error(err);
  const box = document.querySelector(".chart-box");
  if (box) box.innerHTML = `<div style="color:var(--muted);padding:20px;font-size:.85rem">그래프 라이브러리를 불러오지 못했습니다(오프라인 상태일 수 있습니다). 인터넷 연결 후 새로고침해주세요. 아래 표의 데이터는 정상적으로 표시됩니다.</div>`;
}

// ---------------- 4) Holdings table ----------------
const hTbody = document.querySelector("#holdingsTable tbody");
hTbody.innerHTML = DATA.base_holdings.map(h => `
  <tr>
    <td style="text-align:left">${h.name}<div style="color:var(--muted);font-size:.75rem">${h.code}</div></td>
    <td style="text-align:left">${h.sector}</td>
    <td>${h.qty}주</td>
    <td>${h.price.toLocaleString()}원</td>
    <td>${wonFull(h.monthly)}</td>
    <td>${(h.weight * 100).toFixed(1)}%</td>
    <td class="${h.normal >= 0 ? 'pos' : 'neg'}">${pct2(h.normal)}</td>
    <td class="pos">${pct2(h.best)}</td>
    <td class="${h.worst >= 0 ? 'pos' : 'neg'}">${pct2(h.worst)}</td>
  </tr>`).join("");

// ---------------- 5) Source list ----------------
const srcList = document.getElementById("sourceList");
srcList.innerHTML = DATA.base_holdings.map(h => `
  <div class="source-item">
    <div class="name">${h.name} (${h.code})</div>
    <div class="rates">
      <span class="r-normal">Normal <b>${pct2(h.normal)}</b></span>
      <span class="r-best">Best <b>${pct2(h.best)}</b></span>
      <span class="r-worst">Worst <b>${pct2(h.worst)}</b></span>
    </div>
    <div>${h.source}</div>
  </div>`).join("");

// ---------------- 6) Recommended portfolio ----------------
const baseFV = DATA.base_future.normal, adjFV = DATA.adj_future.normal;
const diff = adjFV - baseFV;
document.getElementById("recoCallout").innerHTML = `
  <div>Normal 케이스 기준, 비중 조정만으로 5년 후 평가금액이 <b>${wonFull(baseFV)} → ${wonFull(adjFV)}</b>로
  <span class="diff pos">${won(diff)} (${pct(diff / baseFV)}) 개선</span>됩니다. (원금은 동일)</div>`;

const recoTbody = document.querySelector("#recoTable tbody");
const adjMap = Object.fromEntries(DATA.adj_holdings.map(h => [h.code, h]));
recoTbody.innerHTML = DATA.base_holdings.map(h => {
  const a = adjMap[h.code];
  const d = a.weight - h.weight;
  const dtxt = Math.abs(d) < 0.001 ? "-" :
    (d > 0 ? `<span class="badge-add">+${(d * 100).toFixed(1)}%p</span>` : `<span class="badge-cut">${(d * 100).toFixed(1)}%p</span>`);
  return `<tr>
    <td style="text-align:left">${h.name}</td>
    <td>${(h.weight * 100).toFixed(1)}%</td>
    <td>${(a.weight * 100).toFixed(1)}%</td>
    <td>${dtxt}</td>
  </tr>`;
}).join("");

const compareTbody = document.querySelector("#compareTable tbody");
compareTbody.innerHTML = ["best", "normal", "worst"].map(c => {
  const b = DATA.base_future[c], a = DATA.adj_future[c];
  const d = a - b;
  return `<tr>
    <td style="text-align:left">${caseMeta[c].title}</td>
    <td>${wonFull(b)}</td>
    <td>${wonFull(a)}</td>
    <td class="${d >= 0 ? 'pos' : 'neg'}">${d >= 0 ? '+' : ''}${won(d)}</td>
  </tr>`;
}).join("");
