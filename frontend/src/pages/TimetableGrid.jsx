import React from 'react';

const DAYS = ['월', '화', '수', '목', '금'];
const START_HOUR = 9;
// 🚀 컴팩트한 높이 유지 (65px)
const SLOT_HEIGHT = 65;

// 🚀 중요 태그 리스트
const IMPORTANT_TAGS = ['영강', '녹강', 'PBL', '원어강의', '외국어강의', '유연학기', '1학점 강의', '시간미지정 강의'];

const THEMES = {
  major: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-900',
    tag: 'bg-indigo-200/50 text-indigo-700'
  },
  general: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-900',
    tag: 'bg-orange-200/50 text-orange-700'
  }
};

export function TimetableGrid({ courses = [] }) {
  const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return "00:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const gridCourses = courses.filter(course =>
      course.times && course.times.length > 0 && course.times.some(t => t.startTime >= 0)
  );
  const listCourses = courses.filter(course =>
      !(course.times && course.times.length > 0 && course.times.some(t => t.startTime >= 0))
  );

  const calculateDynamicEndHour = () => {
    const allEndMinutes = gridCourses.flatMap(c => c.times.map(t => t.endTime));
    if (allEndMinutes.length === 0) return 18;
    const maxEndMin = Math.max(...allEndMinutes);
    const maxEndHour = Math.ceil(maxEndMin / 60);
    return Math.max(18, Math.min(22, maxEndHour + 1));
  };

  const dynamicEndHour = calculateDynamicEndHour();
  const totalHours = dynamicEndHour - START_HOUR;

  const getCourseTheme = (course) => {
    const isMajor = course.category?.includes('전공') || course.type === 'major';
    return isMajor ? THEMES.major : THEMES.general;
  };

  // 🚀 [핵심 수정] 강의명 자르기 함수 (소괄호 '(' 또는 대괄호 '[')
  const getDisplayName = (name) => {
    return name.split(/[\(\[]/)[0].trim();
  };

  return (
      <div className="flex flex-col gap-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm select-none">
          <div className="flex">
            {/* 시간 축 */}
            <div className="flex-none w-8 bg-gray-50 border-r border-gray-200">
              <div className="h-8 border-b border-gray-200"></div>
              {Array.from({ length: totalHours }).map((_, i) => (
                  <div key={i} className="relative border-b border-gray-100 text-[9px] text-gray-400 font-medium text-right pr-1" style={{ height: `${SLOT_HEIGHT}px` }}>
                    <span className="absolute -top-2 right-1">{START_HOUR + i}</span>
                  </div>
              ))}
            </div>

            {/* 요일 컬럼 */}
            <div className="flex-1 flex relative">
              <div className="absolute inset-0 flex flex-col mt-8 pointer-events-none z-0">
                {Array.from({ length: totalHours }).map((_, i) => (
                    <div key={i} className="border-b border-gray-100 w-full" style={{ height: `${SLOT_HEIGHT}px` }}></div>
                ))}
              </div>

              {DAYS.map((day, dayIndex) => (
                  <div key={day} className="flex-1 flex flex-col border-r border-gray-200 last:border-r-0 relative z-10">
                    <div className="h-8 border-b border-gray-200 bg-gray-50 flex items-center justify-center text-[11px] font-bold text-gray-700">{day}</div>
                    <div className="relative w-full" style={{ height: `${totalHours * SLOT_HEIGHT}px` }}>
                      {gridCourses.map((course) =>
                          course.times
                              .filter(t => t.day === dayIndex && t.startTime >= 0)
                              .map((time, tIdx) => {
                                const top = (time.startTime / 60 - START_HOUR) * SLOT_HEIGHT;
                                const height = ((time.endTime - time.startTime) / 60) * SLOT_HEIGHT;
                                const theme = getCourseTheme(course);

                                // 🚀 함수 적용
                                const displayName = getDisplayName(course.name);

                                return (
                                    <div
                                        key={`${course.id}-${tIdx}`}
                                        className={`absolute inset-x-0.5 rounded p-1 border flex flex-col justify-between shadow-sm overflow-hidden hover:z-20 hover:ring-2 hover:ring-blue-400 transition-all duration-200 cursor-pointer ${theme.bg} ${theme.border} ${theme.text}`}
                                        style={{ top: `${top}px`, height: `${height - 1}px` }}
                                    >
                                      <div>
                                        <span className="font-bold text-[10px] leading-3 line-clamp-2 w-full block mb-0.5">
                                          {displayName}
                                        </span>

                                        <div className="flex items-center gap-1 text-[8px] opacity-90 font-medium leading-none">
                                          <span>{course.professor}</span>
                                          <span>·</span>
                                          <span>{course.credit}학점</span>
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-0.5">
                                        {/* 태그 영역 */}
                                        {course.details && (
                                            <div className="flex flex-wrap gap-0.5">
                                              {IMPORTANT_TAGS.filter(tag => course.details.includes(tag)).map((tag, i) => (
                                                  <span key={i} className={`text-[7px] px-1 rounded-sm font-bold leading-tight ${theme.tag}`}>
                                                    #{tag}
                                                  </span>
                                              ))}
                                            </div>
                                        )}
                                        {/* 시간 표시 */}
                                        <div className="text-[8px] opacity-60 leading-none text-right">
                                          {formatTime(time.startTime)}-{formatTime(time.endTime)}
                                        </div>
                                      </div>
                                    </div>
                                );
                              })
                      )}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 리스트 */}
        {listCourses.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
              <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-2">
                🕒 온라인 / 시간 미정
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {listCourses.map((course) => {
                  const theme = getCourseTheme(course);

                  // 🚀 함수 적용 (하단 리스트에도 동일하게 적용)
                  const displayName = getDisplayName(course.name);

                  return (
                      <div key={course.id} className={`flex flex-col p-2 rounded-lg border shadow-sm ${theme.bg} ${theme.border} ${theme.text}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs">{displayName}</span>
                          <span className="text-[9px] font-bold px-1 bg-white/60 rounded border border-current/10">{course.id}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {course.details && IMPORTANT_TAGS.filter(tag => course.details.includes(tag)).map((tag, i) => (
                              <span key={i} className={`text-[8px] px-1 py-0 rounded font-bold ${theme.tag}`}>#{tag}</span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[9px] opacity-80 pt-1 border-t border-current/10">
                          <span>{course.professor} · {course.credit}학점</span>
                          <span className="font-medium">{course.timeRoom && course.timeRoom !== '미정' ? course.timeRoom : '시간 미정'}</span>
                        </div>
                      </div>
                  );
                })}
              </div>
            </div>
        )}
      </div>
  );
}