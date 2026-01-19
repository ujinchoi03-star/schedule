import React from 'react';

const DAYS = ['월', '화', '수', '목', '금'];
const START_HOUR = 9; // 시작 시간 (09:00)
const END_HOUR = 22;  // 종료 시간 (22:00)
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SLOT_HEIGHT = 60; // 1시간당 높이 (px)

const COURSE_COLORS = [
  { bg: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-800' },
  { bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-800' },
  { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800' },
  { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' },
  { bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800' },
  { bg: 'bg-teal-100', border: 'border-teal-200', text: 'text-teal-800' },
  { bg: 'bg-cyan-100', border: 'border-cyan-200', text: 'text-cyan-800' },
  { bg: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-800' },
  { bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800' },
  { bg: 'bg-violet-100', border: 'border-violet-200', text: 'text-violet-800' },
  { bg: 'bg-fuchsia-100', border: 'border-fuchsia-200', text: 'text-fuchsia-800' },
  { bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-800' },
];

export function TimetableGrid({ courses = [], compact = false }) {
  // 1. 강의 분류: 시간이 유효한 것 vs 없는 것
  const gridCourses = [];
  const listCourses = [];

  courses.forEach(course => {
    // 🚨 [핵심] times 배열이 있고, startTime이 0 이상인 데이터 확인
    const hasValidTime = course.times && course.times.length > 0 && course.times.some(t => t.startTime >= 0);

    if (hasValidTime) {
      gridCourses.push(course);
    } else {
      listCourses.push(course);
    }
  });

  const getCourseColor = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
  };

  return (
      <div className="flex flex-col gap-4">
        {/* 📅 메인 시간표 그리드 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm select-none">
          <div className="flex">
            {/* 시간 축 */}
            <div className="flex-none w-10 bg-gray-50 border-r border-gray-200">
              <div className="h-10 border-b border-gray-200"></div>
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                  <div key={i} className="relative border-b border-gray-100 text-xs text-gray-400 font-medium text-right pr-1" style={{ height: `${SLOT_HEIGHT}px` }}>
                    <span className="absolute -top-2 right-1">{START_HOUR + i}</span>
                  </div>
              ))}
            </div>

            {/* 요일 컬럼 */}
            <div className="flex-1 flex relative">
              <div className="absolute inset-0 flex flex-col mt-10 pointer-events-none z-0">
                {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                    <div key={i} className="border-b border-gray-100 w-full" style={{ height: `${SLOT_HEIGHT}px` }}></div>
                ))}
              </div>

              {DAYS.map((day, dayIndex) => (
                  <div key={day} className="flex-1 flex flex-col border-r border-gray-200 last:border-r-0 relative z-10">
                    <div className="h-10 border-b border-gray-200 bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-700">{day}</div>
                    <div className="relative w-full" style={{ height: `${TOTAL_HOURS * SLOT_HEIGHT}px` }}>
                      {gridCourses.map((course) =>
                          course.times
                              .filter(t => t.day === dayIndex && t.startTime >= 0)
                              .map((time, tIdx) => {
                                // 🚨 [핵심 수정] 분(Minute)을 시간으로 변환하여 좌표 계산
                                // time.startTime이 630분이면 -> 630 / 60 = 10.5시
                                const startHour = time.startTime / 60;
                                const endHour = time.endTime / 60;

                                const top = (startHour - START_HOUR) * SLOT_HEIGHT;
                                const height = (endHour - startHour) * SLOT_HEIGHT;
                                const color = getCourseColor(course.id);

                                return (
                                    <div
                                        key={`${course.id}-${tIdx}`}
                                        className={`absolute inset-x-0.5 rounded-md p-1 border flex flex-col justify-center items-center text-center shadow-sm overflow-hidden hover:z-20 hover:scale-105 transition-all duration-200 cursor-pointer ${color.bg} ${color.border} ${color.text}`}
                                        style={{ top: `${top}px`, height: `${height - 2}px` }}
                                        title={`${course.name} (${course.professor})`}
                                    >
                                      <span className="font-bold text-xs leading-tight line-clamp-2">{course.name}</span>
                                      {!compact && height > 40 && <span className="text-[10px] opacity-80 leading-tight mt-0.5 truncate">{course.professor}</span>}
                                      {!compact && height > 50 && <span className="text-[10px] opacity-80 leading-tight truncate">{course.timeRoom ? course.timeRoom.split('(')[0] : ''}</span>}
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

        {/* 📝 시간 미정 강의 리스트 */}
        {listCourses.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-600 mb-2">🕒 시간 미정 / 온라인 강의</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {listCourses.map((course) => {
                  const color = getCourseColor(course.id);
                  return (
                      <div key={course.id} className={`flex items-center justify-between p-3 rounded-lg border ${color.bg} ${color.border} ${color.text}`}>
                        <div><div className="font-bold text-sm">{course.name}</div><div className="text-xs opacity-80">{course.professor} · {course.credit}학점</div></div>
                        <div className="text-xs font-bold bg-white/50 px-2 py-1 rounded">{course.timeRoom && course.timeRoom.length > 1 ? course.timeRoom : '시간 미정'}</div>
                      </div>
                  );
                })}
              </div>
            </div>
        )}
      </div>
  );
}