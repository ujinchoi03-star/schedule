//시간표 알고리즘

// 시간 충돌 체크
export function hasTimeConflict(time1, time2) {
  if (time1.day !== time2.day) return false;
  return !(time1.endTime <= time2.startTime || time2.endTime <= time1.startTime);
}

// 두 강의가 충돌하는지 체크
export function hasCourseConflict(course1, course2) {
  for (const time1 of course1.times) {
    for (const time2 of course2.times) {
      if (hasTimeConflict(time1, time2)) return true;
    }
  }
  return false;
}

// 강의 조합이 유효한지 체크
export function isValidCombination(courses) {
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      if (hasCourseConflict(courses[i], courses[j])) return false;
    }
  }
  return true;
}

// 공강 개수 계산
export function countBreakDays(courses) {
  const daysWithClass = new Set();
  courses.forEach((course) => {
    course.times.forEach((time) => {
      daysWithClass.add(time.day);
    });
  });
  return 5 - daysWithClass.size;
}

// 아침 수업 개수 계산 (9시 포함 이전 시작)
export function countMorningClasses(courses) {
  let count = 0;
  courses.forEach((course) => {
    course.times.forEach((time) => {
      if (time.startTime <= 9) count++;
    });
  });
  return count;
}

// 오후 수업 개수 계산 (13시 이후 시작)
export function countAfternoonClasses(courses) {
  let count = 0;
  courses.forEach((course) => {
    course.times.forEach((time) => {
      if (time.startTime >= 13) count++;
    });
  });
  return count;
}

// 시간표 점수 계산 (취향 반영)
export function calculateTimetableScore(courses, preferences) {
  let score = 100;

  // 공강 개수 선호도
  const breakDays = countBreakDays(courses);
  const preferredBreaks = preferences?.preferredBreaks ?? 0;
  const breakDiff = Math.abs(breakDays - preferredBreaks);
  score -= breakDiff * 10;

  // 시간대 선호도
  if (preferences?.timePreference === 'morning') {
    const morningClasses = countMorningClasses(courses);
    score += morningClasses * 5;
  } else if (preferences?.timePreference === 'afternoon') {
    const afternoonClasses = countAfternoonClasses(courses);
    score += afternoonClasses * 5;
  }

  // 교양 카테고리 선호도
  courses.forEach((course) => {
    if (course.type === 'general' && course.category) {
      if (preferences?.generalEducationPreferences?.includes(course.category)) {
        score += 15;
      }
    }
  });

  return Math.max(0, score);
}

// 가능한 시간표 조합 생성 (최대 개수 제한)
export function generateTimetables(selectedCourses, maxTimetables = 20) {
  const timetables = [];

  function backtrack(current, startIdx) {
    if (timetables.length >= maxTimetables) return;

    if (current.length > 0) {
      const totalCredits = current.reduce((sum, c) => sum + c.credit, 0);
      timetables.push({
        id: `tt-${timetables.length}`,
        name: `시간표 ${timetables.length + 1}`,
        courses: [...current],
        totalCredits,
      });
    }

    for (let i = startIdx; i < selectedCourses.length; i++) {
      const course = selectedCourses[i];

      let canAdd = true;
      for (const existingCourse of current) {
        if (hasCourseConflict(course, existingCourse)) {
          canAdd = false;
          break;
        }
      }

      if (canAdd) {
        current.push(course);
        backtrack(current, i + 1);
        current.pop();
      }
    }
  }

  backtrack([], 0);
  return timetables;
}

// 추천 시간표 생성
export function generateRecommendedTimetables(allCourses, preferences, department, maxTimetables = 10) {
  const timetables = [];
  const targetCredits = preferences?.maxCredits ?? 18;

  // 전공 과목 우선, 교양 추가
  const majorCourses = allCourses.filter((c) => c.type === 'major');
  const generalCourses = allCourses.filter((c) => c.type === 'general');

  function backtrack(current, currentCredits, startIdx, isMajor) {
    if (timetables.length >= maxTimetables) return;

    // 목표 학점에 근접하면 저장
    if (currentCredits >= targetCredits - 3 && currentCredits <= targetCredits) {
      const score = calculateTimetableScore(current, preferences);
      timetables.push({
        id: `rec-${timetables.length}`,
        name: `추천 시간표 ${timetables.length + 1}`,
        courses: [...current],
        totalCredits: currentCredits,
        score,
      });
      return;
    }

    if (currentCredits > targetCredits) return;

    const coursePool = isMajor ? majorCourses : generalCourses;

    for (let i = startIdx; i < coursePool.length; i++) {
      const course = coursePool[i];

      let canAdd = true;
      for (const existingCourse of current) {
        if (hasCourseConflict(course, existingCourse)) {
          canAdd = false;
          break;
        }
      }

      if (canAdd && currentCredits + course.credit <= targetCredits) {
        current.push(course);
        backtrack(current, currentCredits + course.credit, i + 1, isMajor);
        current.pop();
      }
    }

    // 전공 과목을 다 돌았으면 교양 과목으로 넘어감
    if (isMajor && startIdx >= majorCourses.length - 1) {
      backtrack(current, currentCredits, 0, false);
    }
  }

  backtrack([], 0, 0, true);

  // 점수 순 정렬
  return timetables.sort((a, b) => (b.score || 0) - (a.score || 0));
}
