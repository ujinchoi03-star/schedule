import React, { useState } from 'react';
import {
  Calendar, BookOpen, CheckCircle2,
  Plus, X, Star, Settings2, Sparkles, Search, Clock, User
} from 'lucide-react';
import api from '../api/axios';

const DAYS_KO = ["월", "화", "수", "목", "금"];
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const DAY_TRANSLATOR = {
  "Mon": "월", "Tue": "화", "Wed": "수", "Thu": "목", "Fri": "금", "Sat": "토", "Sun": "일"
};

const TIME_SLOTS = [];
for (let h = 9; h <= 22; h++) {
  TIME_SLOTS.push({ label: `${h}:00`, value: `${String(h).padStart(2,'0')}:00` });
  TIME_SLOTS.push({ label: `${h}:30`, value: `${String(h).padStart(2,'0')}:30` });
}

const formatMinuteToTime = (minutes) => {
  if (minutes === undefined || minutes === null || minutes < 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

// --------------------------------------------------------
// 🔍 강의 검색 모달 (변경 없음)
// --------------------------------------------------------
function CourseSearchModal({ isOpen, onClose, onSelect, type, userUniversity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setIsSearching(true);
      const response = await api.get('/lectures', {
        params: {
          university: userUniversity || 'KOREA',
          keyword: searchTerm,
          type: type
        }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("강의 검색 실패:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all">
        <div className="bg-white rounded-2xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl animate-fade-in overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-bold text-xl text-gray-900">{type === 'major' ? '📘 전공' : '📙 교양'} 강의 검색</h3>
              <p className="text-xs text-gray-500 mt-1">{type === 'major' ? '전공 과목만 검색됩니다.' : '교양 및 일반선택 과목이 검색됩니다.'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="size-5 text-gray-500"/></button>
          </div>
          <div className="p-4 border-b bg-white">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-400 size-5"/>
              <input type="text" placeholder={type === 'major' ? "전공 강의명 검색..." : "교양 강의명 검색..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium" autoFocus />
              <button onClick={handleSearch} className="absolute right-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><Search className="size-4"/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50 p-3">
            {isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3"><div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="text-sm font-medium">검색 중...</p></div>
            ) : searchResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400"><BookOpen className="size-12 mb-3 opacity-20"/><p className="font-medium">검색 결과가 없습니다</p><p className="text-xs mt-1">검색어를 확인해주세요</p></div>
            ) : (
                <div className="space-y-3">
                  {searchResults.map(course => {
                    const startStr = formatMinuteToTime(course.startTime);
                    const endStr = formatMinuteToTime(course.endTime);
                    const dayKo = DAY_TRANSLATOR[course.day] || course.day;
                    let timeDisplayText = "온라인/시간 미정";
                    let badgeColor = "bg-gray-100 text-gray-500";
                    if (startStr && endStr) { timeDisplayText = `${dayKo}요일 ${startStr} ~ ${endStr}`; badgeColor = "bg-blue-50 text-blue-700 border border-blue-100"; }
                    else if (dayKo) { timeDisplayText = `${dayKo}요일 (시간 미정)`; badgeColor = "bg-purple-50 text-purple-700 border border-purple-100"; }
                    else if (course.timeRoom && course.timeRoom.length > 2) { timeDisplayText = course.timeRoom.split('(')[0]; badgeColor = "bg-green-50 text-green-700 border border-green-100"; }

                    return (
                        <button key={course.id} onClick={() => { onSelect(course); onClose(); }} className="w-full bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group relative overflow-hidden flex flex-col gap-2">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 group-hover:bg-blue-500 transition-colors"></div>
                          <div className="flex justify-between items-center w-full pl-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${course.category.includes('전공') ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{course.category}</span>
                              <span className="text-xs text-gray-400">{course.department}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg"><Star className="size-3.5 fill-orange-500"/> {course.rating.toFixed(1)}</div>
                          </div>
                          <div className="pl-2">
                            <h4 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-700 transition-colors">{course.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600"><span className="flex items-center gap-1"><User className="size-3.5"/> {course.professor}</span><span className="w-1 h-1 rounded-full bg-gray-300"></span><span>{course.credit}학점</span></div>
                          </div>
                          <div className="ml-2 mt-1"><div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${badgeColor}`}><Clock className="size-3.5"/>{timeDisplayText}</div></div>
                        </button>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

// --------------------------------------------------------
// 📄 메인 페이지 (문제의 targetCredit을 완전히 제거한 버전)
// --------------------------------------------------------
export function SemesterSelectionPage({ user, onBack, onNext }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [semester, setSemester] = useState(1);

  // 🚨 [완전 수정] targetCredit 삭제, min/maxCreditRange 추가
  const [minCreditRange, setMinCreditRange] = useState(15);
  const [maxCreditRange, setMaxCreditRange] = useState(18);

  const [minMajorCredit, setMinMajorCredit] = useState(9);
  const [minMajorCount, setMinMajorCount] = useState(3);
  const [minGeneralCount, setMinGeneralCount] = useState(0);

  const [mustHaveMajors, setMustHaveMajors] = useState([]);
  const [mustHaveGenerals, setMustHaveGenerals] = useState([]);

  const [wantedDayOffs, setWantedDayOffs] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [minRating, setMinRating] = useState(0.0);
  const [avoidKeywords, setAvoidKeywords] = useState([]);

  const [newBlockDay, setNewBlockDay] = useState(0);
  const [newBlockStart, setNewBlockStart] = useState("09:00");
  const [newBlockEnd, setNewBlockEnd] = useState("12:00");
  const [keywordInput, setKeywordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalType, setModalType] = useState(null);

  const handleDayOffToggle = (idx) => {
    setWantedDayOffs(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  const handleAddBlockedTime = () => {
    if (newBlockStart >= newBlockEnd) return alert("종료 시간이 더 빨라요!");
    setBlockedTimes([...blockedTimes, { dayIdx: newBlockDay, startTime: newBlockStart, endTime: newBlockEnd }]);
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      setAvoidKeywords([...avoidKeywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleGenerate = async () => {
    try {
      setIsSubmitting(true);
      const requestData = {
        university: user.university || "KOREA",
        year: Number(year),
        semester: Number(semester),

        // 🚨 [중요] targetCredit 절대 넣지 마세요! min/max만 보냅니다.
        minCredit: Number(minCreditRange),
        maxCredit: Number(maxCreditRange),

        minMajorCredit: Number(minMajorCredit),
        minMustHaveMajorCount: Number(minMajorCount),
        minMustHaveGeneralCount: Number(minGeneralCount),
        mustHaveMajorIds: mustHaveMajors.map(c => c.id),
        mustHaveGeneralIds: mustHaveGenerals.map(c => c.id),
        avoidKeywords: avoidKeywords,
        blockedTimes: blockedTimes.map(bt => ({
          day: DAYS_EN[bt.dayIdx],
          startTime: bt.startTime,
          endTime: bt.endTime
        })),
        wantedDayOffs: wantedDayOffs.map(idx => DAYS_EN[idx]),
        minRating: Number(minRating),
        onlyMajor: false,
        excludeNoTime: false
      };
      const response = await api.post('/timetable/generate', requestData);
      onNext(response.data);
    } catch (error) {
      console.error(error);
      alert("시간표 생성 실패! 조건을 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">시간표 조건 설정</h2>
          <p className="text-gray-600">AI가 최적의 시간표를 찾을 수 있도록 조건을 알려주세요.</p>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="size-5 text-blue-600"/> 학기 선택
            </h3>
            <div className="flex gap-4">
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-4 border rounded-xl bg-gray-50 font-bold outline-none">
                <option value="2026">2026년</option>
                <option value="2025">2025년</option>
              </select>
              <div className="flex-1 flex bg-gray-100 rounded-xl p-1">
                {[{l:'1학기',v:1}, {l:'2학기',v:2}, {l:'여름',v:3}, {l:'겨울',v:4}].map(s => (
                    <button key={s.v} onClick={() => setSemester(s.v)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${semester === s.v ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>{s.l}</button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-red-600"/> 필수 강의 담기 (Must Have)
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-600">꼭 들어야 하는 전공</label>
                  <button onClick={() => setModalType('major')} className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1">
                    <Plus className="size-4"/> 강의 검색
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 items-center">
                  {mustHaveMajors.length === 0 && <span className="text-sm text-gray-400 m-auto">선택된 전공이 없습니다</span>}
                  {mustHaveMajors.map((c, i) => (
                      <span key={i} className="bg-white border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                    {c.name} <button onClick={() => setMustHaveMajors(prev => prev.filter(x => x.id !== c.id))}><X className="size-3 opacity-60 hover:opacity-100 text-black"/></button>
                  </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-600">꼭 들어야 하는 교양</label>
                  <button onClick={() => setModalType('general')} className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1">
                    <Plus className="size-4"/> 강의 검색
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 items-center">
                  {mustHaveGenerals.length === 0 && <span className="text-sm text-gray-400 m-auto">선택된 교양이 없습니다</span>}
                  {mustHaveGenerals.map((c, i) => (
                      <span key={i} className="bg-white border border-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                    {c.name} <button onClick={() => setMustHaveGenerals(prev => prev.filter(x => x.id !== c.id))}><X className="size-3 opacity-60 hover:opacity-100 text-black"/></button>
                  </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="size-5 text-purple-600"/> 학점 설정
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {/* 🚨 [UI 변경] targetCredit 입력란 제거됨! */}
              <div className="col-span-2 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 mb-2 block">최소 학점</label>
                  <div className="relative">
                    <input type="number" value={minCreditRange} onChange={e => setMinCreditRange(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"/>
                    <span className="absolute right-4 top-3 text-sm text-gray-400 font-bold">학점</span>
                  </div>
                </div>
                <span className="mb-4 text-gray-400 font-bold">~</span>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 mb-2 block">최대 학점</label>
                  <div className="relative">
                    <input type="number" value={maxCreditRange} onChange={e => setMaxCreditRange(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"/>
                    <span className="absolute right-4 top-3 text-sm text-gray-400 font-bold">학점</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">최소 전공 학점</label>
                <div className="relative">
                  <input type="number" value={minMajorCredit} onChange={e => setMinMajorCredit(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"/>
                  <span className="absolute right-4 top-3 text-sm text-gray-400 font-bold">학점</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">전공 과목 수</label>
                <div className="relative">
                  <input type="number" value={minMajorCount} onChange={e => setMinMajorCount(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"/>
                  <span className="absolute right-4 top-3 text-sm text-gray-400 font-bold">개</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">교양 과목 수</label>
                <div className="relative">
                  <input type="number" value={minGeneralCount} onChange={e => setMinGeneralCount(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"/>
                  <span className="absolute right-4 top-3 text-sm text-gray-400 font-bold">개</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <Settings2 className="size-5 text-green-600"/> 세부 옵션
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">공강 희망 요일</label>
                <div className="flex gap-2">
                  {DAYS_KO.map((day, idx) => (
                      <button key={day} onClick={() => handleDayOffToggle(idx)} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${wantedDayOffs.includes(idx) ? "bg-green-50 border-green-500 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"}`}>{day}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">제외할 시간 (알바 등)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {blockedTimes.map((bt, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-100">
                    {DAYS_KO[bt.dayIdx]} {bt.startTime}~{bt.endTime} <button onClick={() => setBlockedTimes(blockedTimes.filter((_, idx) => idx !== i))}><X className="size-4"/></button>
                  </span>
                  ))}
                  {blockedTimes.length === 0 && <span className="text-sm text-gray-400">등록된 시간이 없습니다</span>}
                </div>
                <div className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
                  <select value={newBlockDay} onChange={e => setNewBlockDay(Number(e.target.value))} className="bg-white border rounded-lg px-2 py-2 text-sm outline-none"><option value="0">월</option><option value="1">화</option><option value="2">수</option><option value="3">목</option><option value="4">금</option></select>
                  <select value={newBlockStart} onChange={e => setNewBlockStart(e.target.value)} className="bg-white border rounded-lg px-2 py-2 text-sm outline-none">{TIME_SLOTS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
                  <span className="self-center text-gray-400">~</span>
                  <select value={newBlockEnd} onChange={e => setNewBlockEnd(e.target.value)} className="bg-white border rounded-lg px-2 py-2 text-sm outline-none">{TIME_SLOTS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
                  <button onClick={handleAddBlockedTime} className="bg-red-500 text-white px-4 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">추가</button>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100 space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500">최소 강의 평점</label>
                    <span className="text-xs font-bold text-orange-600 flex items-center gap-1"><Star className="size-3 fill-orange-600"/> {minRating}점 이상</span>
                  </div>
                  <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={e => setMinRating(e.target.value)} className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">기피 키워드 (예: 영어, 발표, 팀플)</label>
                  <div className="flex gap-2">
                    <input
                        type="text"
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 outline-none transition-all"
                        placeholder="키워드 입력 후 엔터"
                    />
                    <button onClick={handleAddKeyword} className="bg-gray-800 text-white px-5 rounded-xl font-bold hover:bg-gray-900 transition-colors">추가</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {avoidKeywords.map((k, i) => (
                        <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 text-gray-700">
                        {k} <button onClick={() => setAvoidKeywords(avoidKeywords.filter((_, idx) => idx !== i))}><X className="size-3 hover:text-red-500 transition-colors"/></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-3xl mx-auto flex gap-3">
            <button onClick={onBack} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">이전</button>
            <button onClick={handleGenerate} disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:shadow-lg hover:opacity-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? (
                  <>AI가 시간표를 만드는 중... <span className="animate-spin ml-2">⏳</span></>
              ) : (
                  <>AI 시간표 생성하기 <Sparkles className="size-5 fill-white"/></>
              )}
            </button>
          </div>
        </div>

        <CourseSearchModal
            isOpen={!!modalType}
            type={modalType}
            userUniversity={user?.university}
            onClose={() => setModalType(null)}
            onSelect={(course) => {
              if (modalType === 'major') setMustHaveMajors([...mustHaveMajors, course]);
              else setMustHaveGenerals([...mustHaveGenerals, course]);
            }}
        />
      </div>
  );
}