const days = ['월', '화', '수', '목', '금'];
const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const courseColors = [
  'bg-blue-100 border-blue-400 text-blue-900',
  'bg-purple-100 border-purple-400 text-purple-900',
  'bg-green-100 border-green-400 text-green-900',
  'bg-yellow-100 border-yellow-400 text-yellow-900',
  'bg-pink-100 border-pink-400 text-pink-900',
  'bg-indigo-100 border-indigo-400 text-indigo-900',
  'bg-red-100 border-red-400 text-red-900',
  'bg-teal-100 border-teal-400 text-teal-900',
];

export function TimetableGrid({ courses = [], compact = false }) {
  const getColorForCourse = (courseId) => {
    const hash = courseId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return courseColors[hash % courseColors.length];
  };

  const fmtMinute = (t) => {
    const m = Math.round((t % 1) * 60);
    return String(m).padStart(2, '0');
  };

  const renderCourseBlock = (course, time) => {
    const startHour = Math.floor(time.startTime);
    const duration = time.endTime - time.startTime;
    const startOffset = (time.startTime - startHour) * 100;

    return (
      <div
        key={`${course.id}-${time.day}-${time.startTime}`}
        className={`absolute left-0 right-0 ${getColorForCourse(course.id)} border-l-4 rounded px-2 py-1 overflow-hidden ${
          compact ? 'text-xs' : 'text-sm'
        }`}
        style={{
          top: `${startOffset}%`,
          height: `${duration * 100}%`,
        }}
      >
        <div className="font-medium truncate">{course.name}</div>
        {!compact && (
          <>
            <div className="text-xs opacity-75 truncate">{course.professor}</div>
            <div className="text-xs opacity-75">
              {Math.floor(time.startTime)}:{fmtMinute(time.startTime)} - {Math.floor(time.endTime)}:{fmtMinute(time.endTime)}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-6">
        {/* Header */}
        <div
          className={`bg-gray-50 border-b border-r border-gray-200 ${
            compact ? 'p-2' : 'p-4'
          } text-center font-medium text-gray-600`}
        >
          시간
        </div>
        {days.map((day) => (
          <div
            key={day}
            className={`bg-gray-50 border-b border-r border-gray-200 last:border-r-0 ${
              compact ? 'p-2' : 'p-4'
            } text-center font-medium text-gray-900`}
          >
            {day}
          </div>
        ))}

        {/* Time slots */}
        {hours.map((hour) => (
          <div key={hour} className="contents">
            <div
              className={`bg-gray-50 border-b border-r border-gray-200 ${
                compact ? 'p-2' : 'p-4'
              } text-center text-sm text-gray-600`}
            >
              {hour}:00
            </div>

            {days.map((day, dayIndex) => (
              <div
                key={`${hour}-${day}`}
                className="border-b border-r border-gray-200 last:border-r-0 relative"
                style={{ height: compact ? '60px' : '80px' }}
              >
                {courses.map((course) =>
                  (course.times || [])
                    .filter((time) => time.day === dayIndex)
                    .filter((time) => {
                      const startHour = Math.floor(time.startTime);
                      const endHour = Math.ceil(time.endTime);
                      // "시작하는 시간 칸"에만 블록 렌더 (중복 방지)
                      return hour >= startHour && hour < endHour && startHour === hour;
                    })
                    .map((time) => renderCourseBlock(course, time))
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
