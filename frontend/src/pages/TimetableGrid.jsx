import React from 'react';

const DAYS = ['월', '화', '수', '목', '금'];
const START_HOUR = 9;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SLOT_HEIGHT = 60;

const COURSE_COLORS = [
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800' },
  { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800' },
  { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-800' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800' },
];

export function TimetableGrid({ courses = [], compact = false }) {
  const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return "00:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const gridCourses = [];
  const listCourses = [];

  courses.forEach(course => {
    const hasValidTime = course.times && course.times.length > 0 && course.times.some(t => t.startTime >= 0);
    if (hasValidTime) gridCourses.push(course);
    else listCourses.push(course);
  });

  const getCourseColor = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
  };

  return (
      <div className="flex flex-col gap-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm select-none">
          <div className="flex">
            {/* 시간 축 */}
            <div className="flex-none w-10 bg-gray-50 border-r border-gray-200">
              <div className="h-10 border-b border-gray-200"></div>
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                  <div key={i} className="relative border-b border-gray-100 text-[10px] text-gray-400 font-medium text-right pr-1" style={{ height: `${SLOT_HEIGHT}px` }}>
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
                    <div className="h-10 border-b border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-700">{day}</div>
                    <div className="relative w-full" style={{ height: `${TOTAL_HOURS * SLOT_HEIGHT}px` }}>
                      {gridCourses.map((course) =>
                          course.times
                              .filter(t => t.day === dayIndex && t.startTime >= 0)
                              .map((time, tIdx) => {
                                const startHour = time.startTime / 60;
                                const endHour = time.endTime / 60;
                                const top = (startHour - START_HOUR) * SLOT_HEIGHT;
                                const height = (endHour - startHour) * SLOT_HEIGHT;
                                const color = getCourseColor(course.id);

                                return (
                                    <div
                                        key={`${course.id}-${tIdx}`}
                                        className={`absolute inset-x-0.5 rounded p-1.5 border flex flex-col items-start justify-start text-left shadow-sm overflow-hidden hover:z-20 hover:ring-2 hover:ring-blue-400 transition-all duration-200 cursor-pointer ${color.bg} ${color.border} ${color.text}`}
                                        style={{ top: `${top}px`, height: `${height - 1}px` }}
                                    >
                            <span className="font-bold text-[10px] leading-tight line-clamp-2 mb-1 w-full">
                              {course.name}
                            </span>

                                      <div className="flex flex-col gap-0.5 mt-auto">
                              <span className="text-[9px] font-semibold opacity-90">
                                {course.id}
                              </span>
                                        <span className="text-[9px] opacity-70 whitespace-nowrap">
                                {formatTime(time.startTime)} - {formatTime(time.endTime)}
                              </span>
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
        {/* (하단 시간 미정 리스트 코드는 이전과 동일하게 유지됩니다) */}
      </div>
  );
}