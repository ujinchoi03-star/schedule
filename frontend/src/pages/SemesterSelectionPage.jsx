import React, { useState, useEffect } from 'react';
import {
  Calendar, BookOpen, CheckCircle2,
  Plus, X, Star, Settings2, Sparkles, Search, Clock,
  Ban, User, Hash
} from 'lucide-react';
import api from '../api/axios';

const DAYS_KO = ["월", "화", "수", "목", "금"];
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const DAY_TRANSLATOR = {
  "Mon": "월", "Tue": "화", "Wed": "수", "Thu": "목", "Fri": "금", "Sat": "토", "Sun": "일"
};

const UNIV_KEYWORDS = {
  HANYANG: ['IC-PBL', '영어전용', 'E러닝', 'SMART-F', '1학점 강의', '시간미지정 강의'],
  KOREA: ['영강', '유연학기', 'mooc', '외국어강의', '1학점 강의', '시간미지정 강의']
};

const TIME_SLOTS = [];
for (let h = 9; h <= 22; h++) {
  TIME_SLOTS.push({ label: `${h}:00`, value: `${String(h).padStart(2,'0')}:00` });
  TIME_SLOTS.push({ label: `${h}:30`, value: `${String(h).padStart(2,'0')}:30` });
}

const formatMinuteToTime = (minutes) => {
  if (minutes === undefined || minutes === null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

// 🔍 강의 검색 모달
function CourseSearchModal({ isOpen, onClose, onSelect, type, userUniversity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setIsSearching(true);
      const searchType = type === 'avoid' ? null : type;
      const response = await api.get('/lectures', {
        params: { university: userUniversity || 'KOREA', keyword: searchTerm, type: searchType }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("강의 검색 실패:", error);
      setSearchResults([]);
    } finally { setIsSearching(false); }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all">
        <div className="bg-white rounded-2xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-bold text-xl text-gray-900">
                {type === 'major' ? '📘 전공' : type === 'general' ? '📙 교양' : '🚫 제외할'} 강의 검색
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="size-5 text-gray-500"/></button>
          </div>
          <div className="p-4 border-b bg-white">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-400 size-5"/>
              <input type="text" placeholder="강의명, 교수명, 학수번호..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none font-medium" autoFocus />
              <button onClick={handleSearch} className="absolute right-2 bg-blue-600 text-white p-2 rounded-lg"><Search className="size-4"/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50 p-3">
            {isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3"><div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="text-sm font-medium">검색 중...</p></div>
            ) : (
                <div className="space-y-3">
                  {searchResults.map(course => {
                    const displayName = course.name.split(/[\(\[]/)[0].trim();

                    // 🚀 1. 시간 미정/온라인 예외 처리 (null~null 방지)
                    const firstTime = course.timeSlots?.[0];
                    const hasValidTime = firstTime && firstTime.startTime > 0;

                    const timeDisplayText = hasValidTime
                        ? course.timeSlots.map(slot => `${DAY_TRANSLATOR[slot.day] || slot.day}(${formatMinuteToTime(slot.startTime)}~${formatMinuteToTime(slot.endTime)})`).join(', ')
                        : "시간미지정 / 온라인";

                    // 🚀 2. 상세 해시태그(details) 파싱
                    const tags = course.details ? course.details.split(',').map(t => t.trim()).filter(t => t) : [];

                    return (
                        <button key={course.id} onClick={() => { onSelect(course); onClose(); }} className="w-full bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 text-left group flex flex-col gap-2 shadow-sm">
                          <div className="flex justify-between items-start w-full">
                            <div className="flex flex-wrap gap-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${course.category.includes('전공') ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{course.category}</span>
                              {/* 🚀 3. 상세 해시태그 배지 추가 */}
                              {tags.map((tag, i) => (
                                  <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">#{tag}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-orange-500"><Star className="size-3 fill-orange-500"/> {course.rating.toFixed(1)}</div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-base">{displayName}</h4>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                              {/* 🚀 4. 학수번호+분반을 명확히 표시하여 카드 구분 */}
                              <span className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-bold"><Hash className="size-3"/>{course.id}</span>
                              <span className="w-px h-2 bg-gray-300"></span>
                              <span className="flex items-center gap-0.5"><User className="size-3"/>{course.professor}</span>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100 w-full">
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${hasValidTime ? 'text-gray-600' : 'text-red-500'}`}>
                              <Clock className="size-3.5"/>{timeDisplayText}
                            </div>
                          </div>
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

const STORAGE_KEY = 'timetable_settings_v1';

export function SemesterSelectionPage({ user, onBack, onNext }) {
  const getInitialState = (key, defaultValue) => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[key] !== undefined ? parsed[key] : defaultValue;
      }
    } catch (e) { console.error("설정 불러오기 실패", e); }
    return defaultValue;
  };

  const [year, setYear] = useState(() => getInitialState('year', 2026));
  const [semester, setSemester] = useState(() => getInitialState('semester', 1));
  const [minCredit, setMinCredit] = useState(() => getInitialState('minCredit', 15));
  const [maxCredit, setMaxCredit] = useState(() => getInitialState('maxCredit', 21));
  const [minMajorCredit, setMinMajorCredit] = useState(() => getInitialState('minMajorCredit', 9));
  const [minMajorCount, setMinMajorCount] = useState(() => getInitialState('minMajorCount', 3));
  const [minGeneralCount, setMinGeneralCount] = useState(() => getInitialState('minGeneralCount', 3));
  const [mustHaveMajors, setMustHaveMajors] = useState(() => getInitialState('mustHaveMajors', []));
  const [mustHaveGenerals, setMustHaveGenerals] = useState(() => getInitialState('mustHaveGenerals', []));
  const [avoidNameKeywords, setAvoidNameKeywords] = useState(() => getInitialState('avoidNameKeywords', []));
  const [tempAvoidInput, setTempAvoidInput] = useState("");
  const [wantedDayOffs, setWantedDayOffs] = useState(() => getInitialState('wantedDayOffs', []));
  const [blockedTimes, setBlockedTimes] = useState(() => getInitialState('blockedTimes', []));
  const [newBlockDay, setNewBlockDay] = useState(0);
  const [newBlockStart, setNewBlockStart] = useState("09:00");
  const [newBlockEnd, setNewBlockEnd] = useState("12:00");
  const [minRating, setMinRating] = useState(() => getInitialState('minRating', 0.0));
  const [avoidKeywords, setAvoidKeywords] = useState(() => getInitialState('avoidKeywords', []));
  const [preferredKeywords, setPreferredKeywords] = useState(() => getInitialState('preferredKeywords', []));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalType, setModalType] = useState(null);

  const recommendedKeywords = UNIV_KEYWORDS[user?.university] || [];

  useEffect(() => {
    const settings = {
      year, semester, minCredit, maxCredit,
      minMajorCredit, minMajorCount, minGeneralCount,
      mustHaveMajors, mustHaveGenerals, avoidNameKeywords,
      wantedDayOffs, blockedTimes, minRating,
      avoidKeywords, preferredKeywords
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [
    year, semester, minCredit, maxCredit,
    minMajorCredit, minMajorCount, minGeneralCount,
    mustHaveMajors, mustHaveGenerals, avoidNameKeywords,
    wantedDayOffs, blockedTimes, minRating,
    avoidKeywords, preferredKeywords
  ]);

  const handleKeywordToggle = (keyword, type) => {
    if (type === 'avoid') {
      setPreferredKeywords(prev => prev.filter(k => k !== keyword));
      setAvoidKeywords(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]);
    } else {
      setAvoidKeywords(prev => prev.filter(k => k !== keyword));
      setPreferredKeywords(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]);
    }
  };

  const handleDayOffToggle = (idx) => {
    setWantedDayOffs(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  const handleAddBlockedTime = () => {
    if (newBlockStart >= newBlockEnd) return alert("종료 시간이 시작 시간보다 빨라야 합니다!");
    setBlockedTimes([...blockedTimes, { dayIdx: newBlockDay, startTime: newBlockStart, endTime: newBlockEnd }]);
  };

  const handleAddAvoidKeyword = () => {
    if (!tempAvoidInput.trim()) return;
    if (avoidNameKeywords.includes(tempAvoidInput.trim())) return alert("이미 등록된 키워드입니다.");
    setAvoidNameKeywords([...avoidNameKeywords, tempAvoidInput.trim()]);
    setTempAvoidInput("");
  };

  const handleGenerate = async () => {
    try {
      setIsSubmitting(true);
      const requestData = {
        university: user.university || "KOREA",
        year: Number(year), semester: Number(semester),
        minCredit: Number(minCredit), maxCredit: Number(maxCredit),
        minMajorCredit: Number(minMajorCredit),
        minMustHaveMajorCount: Number(minMajorCount),
        minMustHaveGeneralCount: Number(minGeneralCount),
        mustHaveMajorIds: mustHaveMajors.map(c => c.id),
        mustHaveGeneralIds: mustHaveGenerals.map(c => c.id),
        avoidNameKeywords: avoidNameKeywords,
        wantedDayOffs: wantedDayOffs.map(idx => DAYS_EN[idx]),
        avoidKeywords, preferredKeywords,
        blockedTimes: blockedTimes.map(bt => ({
          day: DAYS_EN[bt.dayIdx], startTime: bt.startTime, endTime: bt.endTime
        })),
        minRating: Number(minRating), onlyMajor: false, excludeNoTime: true
      };
      const response = await api.post('/timetable/generate', requestData);
      onNext(response.data);
    } catch (error) {
      alert(error.response?.data?.message || "시간표 생성 실패!");
    } finally { setIsSubmitting(false); }
  };

  const renderSelectedCourse = (course, setList) => {
    const displayName = course.name.split(/[\(\[]/)[0].trim();

    // 🚀 1. 시간 파싱 결과 처리: 0:00~0:00 방어 및 멀티 요일 표시
    const timeSlots = course.timeSlots || [];
    const hasValidTime = timeSlots.length > 0 && timeSlots[0].startTime > 0;

    const timeDisplayText = hasValidTime
        ? timeSlots.map(slot =>
            `${DAY_TRANSLATOR[slot.day] || slot.day} ${formatMinuteToTime(slot.startTime)}~${formatMinuteToTime(slot.endTime)}`
        ).join(', ')
        : "온라인 / 시간 미정";

    // 🚀 2. 강의 상세 정보(details)를 해시태그로 변환
    const tags = course.details ? course.details.split(',').map(t => t.trim()).filter(t => t) : [];

    return (
        <div key={course.id} className="w-full bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-blue-300 relative group">
          <button onClick={() => setList(prev => prev.filter(x => x.id !== course.id))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1 rounded transition-colors"><X className="size-4"/></button>

          {/* 🚀 해시태그 배지 영역 */}
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag, i) => (
                <span key={i} className="text-[9px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">#{tag}</span>
            ))}
          </div>

          <h4 className="font-bold text-gray-900 text-sm pr-6 mb-1">{displayName}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-bold"><Hash className="size-3"/>{course.id}</span>
            <span className="flex items-center gap-0.5"><User className="size-3"/>{course.professor}</span>
          </div>

          {/* 🚀 시간 미정일 경우 빨간색으로 표시 */}
          <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md w-fit ${hasValidTime ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
            <Clock className="size-3.5"/>{timeDisplayText}
          </div>
        </div>
    );
  };
  return (
      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">시간표 조건 설정</h2>
          <p className="text-gray-500 font-medium">나만의 취향을 반영한 완벽한 조합을 만들어보세요</p>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><Calendar className="size-5 text-blue-600"/> 학기 선택</h3>
            <div className="flex gap-4">
              <select value={year} onChange={e => setYear(e.target.value)} className="px-4 border rounded-xl bg-gray-50 font-bold outline-none">
                <option value="2026">2026년</option><option value="2025">2025년</option>
              </select>
              <div className="flex-1 flex bg-gray-100 rounded-xl p-1">
                {[{l:'1학기',v:1}, {l:'2학기',v:2}].map(s => (
                    <button key={s.v} onClick={() => setSemester(s.v)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${semester === s.v ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>{s.l}</button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><BookOpen className="size-5 text-purple-600"/> 학점 및 과목 구성</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">최소 총 학점</label>
                <input type="number" value={minCredit} onChange={e => setMinCredit(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 focus:bg-white outline-none"/>
              </div>
              <span className="mt-6 font-bold text-gray-400">~</span>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">최대 총 학점</label>
                <input type="number" value={maxCredit} onChange={e => setMaxCredit(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 focus:bg-white outline-none"/>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">최소 전공 학점</label>
                <div className="relative">
                  <input type="number" value={minMajorCredit} onChange={e => setMinMajorCredit(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 outline-none"/>
                  <span className="absolute right-3 top-3.5 text-[10px] text-gray-400">학점</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">전공 과목 수</label>
                <div className="relative">
                  <input type="number" value={minMajorCount} onChange={e => setMinMajorCount(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 outline-none"/>
                  <span className="absolute right-3 top-3.5 text-[10px] text-gray-400">개</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">교양 과목 수</label>
                <div className="relative">
                  <input type="number" value={minGeneralCount} onChange={e => setMinGeneralCount(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-center bg-gray-50 outline-none"/>
                  <span className="absolute right-3 top-3.5 text-[10px] text-gray-400">개</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><CheckCircle2 className="size-5 text-blue-600"/> 강의 필터링 설정</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-600">꼭 들어야 하는 전공 (Must-Have)</label>
                  <button onClick={() => setModalType('major')} className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline"><Plus className="size-4"/> 강의 검색</button>
                </div>
                <div className="flex flex-col gap-2 min-h-[50px] p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  {mustHaveMajors.map(c => renderSelectedCourse(c, setMustHaveMajors))}
                  {mustHaveMajors.length === 0 && <span className="text-xs text-gray-400 self-center py-2">필수 전공 강의를 추가해주세요.</span>}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-600">꼭 들어야 하는 교양 (Must-Have)</label>
                  <button onClick={() => setModalType('general')} className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline"><Plus className="size-4"/> 강의 검색</button>
                </div>
                <div className="flex flex-col gap-2 min-h-[50px] p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  {mustHaveGenerals.map(c => renderSelectedCourse(c, setMustHaveGenerals))}
                  {mustHaveGenerals.length === 0 && <span className="text-xs text-gray-400 self-center py-2">필수 교양 강의를 추가해주세요.</span>}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1"><Ban className="size-4"/> 강의명 키워드로 제외</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {avoidNameKeywords.map((k, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-100">
                        {k} <button onClick={() => setAvoidNameKeywords(prev => prev.filter((_, idx) => idx !== i))}><X className="size-3"/></button>
                      </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={tempAvoidInput} onChange={e => setTempAvoidInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAvoidKeyword()} placeholder="제외할 단어 입력 (예: 채플)" className="flex-1 p-3 border rounded-xl bg-gray-50 outline-none font-medium"/>
                  <button onClick={handleAddAvoidKeyword} className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-600 transition-colors">추가</button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><Settings2 className="size-5 text-green-600"/> 세부 옵션 설정</h3>
            <div className="space-y-8">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">공강 희망 요일</label>
                <div className="flex gap-2">
                  {DAYS_KO.map((day, idx) => (
                      <button key={day} onClick={() => handleDayOffToggle(idx)} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${wantedDayOffs.includes(idx) ? "bg-green-50 border-green-500 text-green-700 shadow-sm" : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"}`}>{day}</button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">제외할 시간 (개인 일정)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {blockedTimes.map((bt, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-100 shadow-sm">
                    {DAYS_KO[bt.dayIdx]} {bt.startTime}~{bt.endTime}
                        <button onClick={() => setBlockedTimes(blockedTimes.filter((_, idx) => idx !== i))}><X className="size-4"/></button>
                  </span>
                  ))}
                </div>
                <div className="flex gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 items-center">
                  <select value={newBlockDay} onChange={e => setNewBlockDay(Number(e.target.value))} className="bg-white border rounded-lg px-2 py-2 text-sm outline-none font-bold text-gray-700 flex-1">
                    {DAYS_KO.map((d,i)=><option key={d} value={i}>{d}요일</option>)}
                  </select>
                  <select value={newBlockStart} onChange={e => setNewBlockStart(e.target.value)} className="bg-white border rounded-lg px-2 py-2 text-sm outline-none font-bold text-gray-700 flex-1">
                    {TIME_SLOTS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <span className="text-gray-400 font-bold">~</span>
                  <select value={newBlockEnd} onChange={e => setNewBlockEnd(e.target.value)} className="bg-white border rounded-lg px-2 py-2 text-sm outline-none font-bold text-gray-700 flex-1">
                    {TIME_SLOTS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button onClick={handleAddBlockedTime} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">추가</button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">최소 강의 평점 필터</label>
                  <span className="text-xs font-bold text-orange-600 flex items-center gap-1"><Star className="size-3 fill-orange-600"/> {minRating}점 이상</span>
                </div>
                <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={e => setMinRating(e.target.value)} className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-blue-500 mb-3 block uppercase tracking-wider">추천 선호 키워드</label>
                  <div className="flex flex-wrap gap-2">
                    {recommendedKeywords.map(k => (
                        <button key={k} onClick={() => handleKeywordToggle(k, 'prefer')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${preferredKeywords.includes(k) ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200 text-gray-400 opacity-60"}`}>⭐ {k}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-red-500 mb-3 block uppercase tracking-wider">기피 대상 키워드</label>
                  <div className="flex flex-wrap gap-2">
                    {recommendedKeywords.map(k => (
                        <button key={k} onClick={() => handleKeywordToggle(k, 'avoid')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${avoidKeywords.includes(k) ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-gray-200 text-gray-400 opacity-60"}`}>🚫 {k}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 z-20 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)]">
          <div className="max-w-3xl mx-auto flex gap-3">
            <button onClick={onBack} className="px-8 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors">이전</button>
            <button onClick={handleGenerate} disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:opacity-90 disabled:opacity-70 transition-all">
              {isSubmitting ? "AI 시간표 조합 생성 중..." : <>AI 시간표 생성하기 <Sparkles className="size-5 fill-white"/></>}
            </button>
          </div>
        </div>

        <CourseSearchModal
            isOpen={!!modalType}
            type={modalType}
            userUniversity={user?.university}
            onClose={() => setModalType(null)}
            onSelect={c => {
              if (modalType === 'avoid') { setTempAvoidInput(c.name); return; }
              const isAlreadyAdded = mustHaveMajors.some(m => m.id === c.id) || mustHaveGenerals.some(g => g.id === c.id);
              if (isAlreadyAdded) { alert("이미 필수 목록에 담은 강의입니다!"); return; }
              (modalType === 'major' ? setMustHaveMajors : setMustHaveGenerals)(prev => [...prev, c]);
            }}
        />
      </div>
  );
}