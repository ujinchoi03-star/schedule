package com.example.finger_schedule.dto

data class BlockedTime(
    val day: String,       // 예: "Mon"
    val startTime: String, // 예: "09:00"
    val endTime: String    // 예: "10:30"
)


data class TimeTableRequest(
    // ⏳ 1. 최대 공강 시간 (우주 공강 방지)
    // 수업과 수업 사이에 붕 뜨는 시간이 '이 시간'을 넘으면 그 시간표는 버립니다.
    val maxGapHours: Int,

    // 👇 [NEW] 공강으로 만들고 싶은 요일 목록 (예: ["Mon", "Fri"] -> 월,금 공강 희망)
    val wantedDayOffs: List<String> = emptyList(),

    // 🎯 3. 목표 학점
    // 시간표를 짤 때 최대한 이 학점에 맞춰서 채우려고 시도합니다. (예: 18학점)
    val targetCredit: Int,

    // ⭐ 4. 최소 강의 평점 (꿀강 필터)
    // 강의 평점이 이 점수보다 낮은 수업은 거들떠보지도 않고 제외합니다.
    val minRating: Double,

    // 🎓 5. 전공 수업만 듣기 모드
    // true로 체크하면 '교양' 과목은 싹 다 제외하고 '전공'만 가지고 시간표를 짭니다.
    val onlyMajor: Boolean,

    // 🚫 6. 기피 키워드 (싫어하는 유형 제외)
    // 예: ["영어", "PBL"] -> 강의 설명에 이 단어가 들어가면 무조건 제외합니다.
    val avoidKeywords: List<String>,

    // ⏰ 7. 시간 미지정(온라인) 제외
    // true면 시간이 안 정해진(온라인/녹화) 강의는 시간표에 넣지 않습니다.
    val excludeNoTime: Boolean,

    // 📌 8. [핵심] 필수 강의 고정 (Must-Have)
    // 사용자가 검색해서 "이건 꼭 들을래!" 하고 찜한 강의 ID들입니다.
    // 알고리즘은 이 강의들을 가장 먼저 가방에 넣고 시작합니다.
    val mustHaveIds: List<String> = emptyList(),

    // ⚖️ 9. [핵심] 최소 전공 학점 조건
    // "총 학점은 15학점이지만, 그 중에서 전공은 최소 9학점 이상이어야 해"
    // 시간표가 다 짜졌을 때, 전공 학점이 이 기준보다 낮으면 실패로 처리합니다.
    val minMajorCredit: Int = 0,

    // 👇 [NEW] 전공 필수 후보군 & 최소 개수
    val mustHaveMajorIds: List<String> = emptyList(),
    val minMustHaveMajorCount: Int = 0,

    // 👇 [NEW] 교양 필수 후보군 & 최소 개수
    val mustHaveGeneralIds: List<String> = emptyList(),
    val minMustHaveGeneralCount: Int = 0,

    val blockedTimes: List<BlockedTime> = emptyList() // 피하고픈 시간
)