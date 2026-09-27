"use strict";

/* ---------- 버튼이 열 페이지 ----------
   페이지를 만들면 url에 파일명을 넣으면 됩니다. (예: url: "trade.html")
   url이 null이면 준비 중 안내가 표시됩니다. */
const PAGES = {
  trade:    { name: "거래입력", url: null },
  analysis: { name: "투자분석", url: null },
};

/* ---------- 예시 데이터 ---------- */
const HOLDINGS = [
  { name: "삼성전자",   code: "005930", qty: 120, avg: 68400,  price: 74200 },
  { name: "NAVER",      code: "035420", qty: 15,  avg: 212000, price: 198500 },
  { name: "KODEX 200",  code: "069500", qty: 80,  avg: 35100,  price: 37850 },
  { name: "현대차",     code: "005380", qty: 20,  avg: 241000, price: 256000 },
];

const HISTORY = [ // 최근 6개월 평가금액 (원)
  16800000, 17350000, 17100000, 18050000, 18900000, 19420000,
];

const LOG = [
  { date: "2026-09-12", kind: "buy",  label: "매수", title: "KODEX 200 20주 추가",
    desc: "지수 조정 구간에서 분할 매수. 전체 비중의 15%까지 확대." },
  { date: "2026-08-27", kind: "adj",  label: "조정", title: "NAVER 비중 축소 검토",
    desc: "실적 발표 이후 목표가를 다시 계산하기로 함." },
  { date: "2026-08-03", kind: "sell", label: "매도", title: "일부 종목 10% 익절",
    desc: "목표 수익률 도달로 수익 일부를 현금화." },
];

const NOTES = [
  { title: "삼성전자 보유 근거",
    body: "메모리 업황 회복 시점에 맞춰 분할 매수했고, 평균단가 대비 수익률을 매월 이 페이지에 기록합니다.",
    who: "작성자 KEEM", when: "2026-09-10" },
  { title: "ETF 중심 리밸런싱 원칙",
    body: "개별 종목은 전체의 40% 이내로 유지하고, 나머지는 지수 ETF로 나눠 담는 방식으로 정리했습니다.",
    who: "작성자 KEEM", when: "2026-08-30" },
];

const ROADMAP = [
  { name: "거래입력",       desc: "매수·매도 내역을 직접 입력하고 저장",    state: "준비 중", soon: true },
  { name: "투자분석",       desc: "수익률과 자산 비중 변화를 그래프로 확인", state: "준비 중", soon: true },
  { name: "배당 캘린더",    desc: "보유 종목의 배당 지급일을 달력으로 확인", state: "예정",    soon: false },
  { name: "목표 수익률 알림", desc: "정한 목표에 도달하면 알림",             state: "예정",    soon: false },
];

/* ---------- 유틸 ---------- */
const won = (n) => n.toLocaleString("ko-KR");
const pct = (n) => (n > 0 ? "+" : "") + n.toFixed(2) + "%";
const dir = (n) => (n > 0 ? "up" : n < 0 ? "down" : "");

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

/* ---------- 포트폴리오 ---------- */
function renderHoldings() {
  const tbody = document.getElementById("holdings");
  let cost = 0;
  let value = 0;

  HOLDINGS.forEach((h) => {
    const rate = (h.price / h.avg - 1) * 100;
    cost += h.avg * h.qty;
    value += h.price * h.qty;

    const tr = el("tr", "", `
      <td><span class="stock-name">${h.name}</span><span class="stock-code">${h.code}</span></td>
      <td class="r num">${won(h.qty)}</td>
      <td class="r num">${won(h.avg)}</td>
      <td class="r num">${won(h.price)}</td>
      <td class="r num ${dir(rate)}">${pct(rate)}</td>
    `);
    tbody.appendChild(tr);
  });

  const diff = value - cost;
  const rate = (value / cost - 1) * 100;
  document.getElementById("total-value").textContent = won(value) + "원";
  const delta = document.getElementById("total-delta");
  delta.className = "delta num " + dir(diff);
  delta.textContent = `${diff > 0 ? "+" : ""}${won(diff)}원 (${pct(rate)})`;
}

function renderSpark() {
  const W = 260, H = 84, padX = 6, padTop = 8, padBottom = 8;
  const min = Math.min(...HISTORY);
  const max = Math.max(...HISTORY);
  const x = (i) => padX + (i * (W - padX * 2)) / (HISTORY.length - 1);
  const y = (v) => padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom);

  const pts = HISTORY.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const last = HISTORY.length - 1;
  const area = `M${x(0)},${H - padBottom} L${pts.join(" L")} L${x(last)},${H - padBottom} Z`;

  document.getElementById("spark").innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path d="${area}" fill="#c98a4b" fill-opacity="0.22"/>
      <polyline points="${pts.join(" ")}" fill="none" stroke="#e0a466" stroke-width="2"
                stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(last)}" cy="${y(HISTORY[last]).toFixed(1)}" r="4" fill="#e0a466"/>
    </svg>`;
}

/* ---------- 변화 기록 / 공유 노트 / 추가 예정 ---------- */
function renderTimeline() {
  const ol = document.getElementById("timeline");
  LOG.forEach((item) => {
    ol.appendChild(el("li", "tl-item", `
      <time class="tl-date" datetime="${item.date}">${item.date}</time>
      <div>
        <p class="tl-title"><span class="tl-kind ${item.kind}">${item.label}</span>${item.title}</p>
        <p class="tl-desc">${item.desc}</p>
      </div>
    `));
  });
}

function renderNotes() {
  const wrap = document.getElementById("notes");
  NOTES.forEach((n) => {
    wrap.appendChild(el("article", "note", `
      <h3>${n.title}</h3>
      <p>${n.body}</p>
      <div class="note-meta"><span>${n.who}</span><time datetime="${n.when}">${n.when}</time></div>
    `));
  });
}

function renderRoadmap() {
  const ul = document.getElementById("roadmap");
  ROADMAP.forEach((r) => {
    ul.appendChild(el("li", "rm-item", `
      <span class="rm-name">${r.name}</span>
      <span class="rm-desc">${r.desc}</span>
      <span class="rm-state ${r.soon ? "soon" : ""}">${r.state}</span>
    `));
  });
}

/* ---------- 상단 버튼 ---------- */
let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}

function openPage(key) {
  const page = PAGES[key];
  if (!page) return;
  if (page.url) {
    window.location.href = page.url;
  } else {
    showToast(`${page.name} 페이지는 준비 중입니다.`);
  }
}

document.querySelectorAll("[data-page]").forEach((btn) => {
  btn.addEventListener("click", () => openPage(btn.dataset.page));
});

/* ---------- 시작 ---------- */
renderHoldings();
renderSpark();
renderTimeline();
renderNotes();
renderRoadmap();
