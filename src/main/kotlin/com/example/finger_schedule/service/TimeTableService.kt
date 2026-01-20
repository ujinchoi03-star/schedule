package com.example.finger_schedule.service

import com.example.finger_schedule.domain.Lecture
import com.example.finger_schedule.dto.*
import com.example.finger_schedule.repository.LectureRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import jakarta.annotation.PostConstruct
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import org.springframework.http.HttpStatus
import java.util.regex.Pattern

@Service
class TimeTableService(
    private val lectureRepository: LectureRepository
) {
    private var searchCount = 0

    @PostConstruct
    fun initData() {
        if (lectureRepository.count() == 0L) {
            try {
                val mapper = jacksonObjectMapper()
                val lecturesToSave = mutableListOf<Lecture>()
                val hanyangResource = ClassPathResource("real_lectures_hanyang_full.json")
                if (hanyangResource.exists()) {
                    val hanyangRaw: List<RawLecture> = mapper.readValue(hanyangResource.inputStream)
                    lecturesToSave.addAll(parseRawLectures(hanyangRaw, "HANYANG"))
                }
                val koreaResource = ClassPathResource("real_lectures_korea_2026_1.json")
                if (koreaResource.exists()) {
                    val koreaRaw: List<RawLecture> = mapper.readValue(koreaResource.inputStream)
                    lecturesToSave.addAll(parseRawLectures(koreaRaw, "KOREA"))
                }
                lectureRepository.saveAll(lecturesToSave)
                println("=== ✅ 데이터 로드 완료 ===")
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    // 🔍 [수정] 검색 로직: 강의명, 교수명, 학수번호(ID) 모두 검색 가능하도록 변경
    // Controller에서 이 함수를 호출할 때 keyword를 넘겨줘야 합니다.
    fun getSearchLectures(university: String?, keyword: String?): List<LectureSearchResponse> {
        // 1. 먼저 대학 기준으로 전체 가져오기
        var lectures = if (university != null) lectureRepository.findAllByUniversity(university) else lectureRepository.findAll()

        // 2. 🚀 [핵심] 키워드가 있을 경우 필터링 (이름 OR 교수 OR 학수번호)
        if (!keyword.isNullOrBlank()) {
            val k = keyword.trim()
            lectures = lectures.filter { lecture ->
                lecture.name.contains(k, ignoreCase = true) ||      // 강의명 검색
                        lecture.professor.contains(k, ignoreCase = true) || // 교수명 검색
                        lecture.id.contains(k, ignoreCase = true)           // 학수번호 검색
            }
        }

        // 3. DTO 변환 (요일별로 흩어진 강의를 하나로 그룹화)
        return lectures.groupBy { it.id }.map { (id, groupedLectures) ->
            val first = groupedLectures.first()
            LectureSearchResponse(
                id = id,
                name = first.name,
                professor = first.professor,
                credit = first.credit,
                rating = first.rating,
                category = first.category,
                details = first.details,
                department = first.department,
                timeRoom = first.timeRoom,
                university = first.university,
                timeSlots = groupedLectures.map { SearchTimeSlot(it.day, it.startTime, it.endTime) }
            )
        }
    }

    // 🚀 시간표 생성 로직
    fun generate(request: TimeTableRequest): List<List<Lecture>> {
        val allLectures = lectureRepository.findAllByUniversity(request.university)
        val mustHaveIds = request.mustHaveMajorIds + request.mustHaveGeneralIds

        // 1. 제외 시간(BlockedTime) 가상 스케줄 생성
        val initialSchedule = mutableListOf<CourseGroup>()
        if (request.blockedTimes.isNotEmpty()) {
            val blockedLectures = request.blockedTimes.map { block ->
                Lecture(
                    dbId = null, university = "", id = "BLOCKED",
                    name = "제외 시간", professor = "", credit = 0.0,
                    day = block.day,
                    startTime = timeToMinutes(block.startTime),
                    endTime = timeToMinutes(block.endTime),
                    rating = 0.0, category = "", details = "",
                    college = "", department = "", timeRoom = ""
                )
            }
            initialSchedule.add(
                CourseGroup(
                    id = "BLOCKED", name = "제외 시간", professor = "", credit = 0.0,
                    rating = 0.0, category = "", details = "",
                    timeSlots = blockedLectures,
                    isMustHaveMajor = false, isMustHaveGeneral = false, hasPreference = false
                )
            )
        }

        // 2. 필수 강의 충돌 검사 (모아서 에러 던지기)
        val conflictMessages = mutableListOf<String>()

        if (mustHaveIds.isNotEmpty()) {
            // (1) 공강 요일 충돌
            allLectures.forEach { lecture ->
                if (mustHaveIds.contains(lecture.id)) {
                    if (request.wantedDayOffs.contains(lecture.day)) {
                        val dayMap = mapOf("Mon" to "월", "Tue" to "화", "Wed" to "수", "Thu" to "목", "Fri" to "금")
                        val dayKo = dayMap[lecture.day] ?: lecture.day
                        conflictMessages.add("'${lecture.name}' (${dayKo}요일 공강 위배)")
                    }
                }
            }

            // (2) 제외 시간 충돌
            val mustHaveCandidates = allLectures
                .filter { mustHaveIds.contains(it.id) }
                .groupBy { it.id }
                .map { (_, lectures) ->
                    val first = lectures.first()
                    CourseGroup(
                        id = first.id, name = first.name, professor = first.professor, credit = first.credit, rating = first.rating, category = first.category, details = first.details,
                        timeSlots = lectures, isMustHaveMajor = false, isMustHaveGeneral = false, hasPreference = false
                    )
                }

            for (course in mustHaveCandidates) {
                if (conflictMessages.any { it.contains(course.name) }) continue
                if (isConflict(initialSchedule, course)) {
                    conflictMessages.add("'${course.name}' (제외 시간과 겹침)")
                }
            }
        }

        if (conflictMessages.isNotEmpty()) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "다음 필수 강의들이 조건과 충돌합니다:\n${conflictMessages.joinToString(", ")}\n해당 강의를 빼거나 조건을 수정해주세요."
            )
        }

        // 3. 후보군 필터링
        val candidates = allLectures.groupBy { it.id }.map { (_, lectures) ->
            val first = lectures.first()
            val hasPreference = request.preferredKeywords.any { k -> first.details.contains(k, ignoreCase = true) }

            CourseGroup(
                id = first.id, name = first.name, professor = first.professor, credit = first.credit,
                rating = first.rating, category = first.category, details = first.details,
                timeSlots = lectures,
                isMustHaveMajor = request.mustHaveMajorIds.contains(first.id),
                isMustHaveGeneral = request.mustHaveGeneralIds.contains(first.id),
                hasPreference = hasPreference
            )
        }.filter { group ->
            if (group.isMustHaveMajor || group.isMustHaveGeneral) return@filter true

            // 🚀 강의명 키워드 기피 로직
            if (request.avoidNameKeywords.isNotEmpty()) {
                if (request.avoidNameKeywords.any { k -> group.name.contains(k, ignoreCase = true) }) return@filter false
            }

            // 기존 상세정보(details) 기피 로직
            if (request.avoidKeywords.isNotEmpty()) {
                if (request.avoidKeywords.any { k -> group.details.contains(k, ignoreCase = true) }) return@filter false
                if (request.avoidKeywords.contains("1학점 강의") && group.credit == 1.0) return@filter false
                if (request.avoidKeywords.contains("시간미지정 강의") && group.timeSlots.any { it.startTime == -1 }) return@filter false
            }

            if (request.wantedDayOffs.isNotEmpty() && group.timeSlots.any { slot -> request.wantedDayOffs.contains(slot.day) }) return@filter false
            group.rating >= request.minRating
        }.sortedWith(
            compareByDescending<CourseGroup> { it.isMustHaveMajor || it.isMustHaveGeneral }
                .thenByDescending { it.hasPreference }
                .thenByDescending { it.rating }
        )

        val allSchedules = mutableListOf<List<Lecture>>()
        searchCount = 0

        findSchedules(0, initialSchedule, 0.0, 0.0, 0, 0,
            request.minCredit.toDouble(), request.maxCredit.toDouble(),
            request.minMustHaveMajorCount, request.minMustHaveGeneralCount,
            candidates, allSchedules)

        return allSchedules.sortedWith(
            compareByDescending<List<Lecture>> { s -> s.count { mustHaveIds.contains(it.id) } }
                .thenByDescending { s -> s.count { l -> request.preferredKeywords.any { k -> l.details.contains(k, ignoreCase = true) } } }
                .thenByDescending { it.map { l -> l.rating }.average() }
        ).take(10)
    }

    private fun findSchedules(
        index: Int, currentSchedule: MutableList<CourseGroup>,
        currentCredit: Double, currentMajorCredit: Double,
        currentMajorCount: Int, currentGeneralCount: Int,
        minCredit: Double, maxCredit: Double,
        targetMajorCount: Int, targetGeneralCount: Int,
        candidates: List<CourseGroup>, results: MutableList<List<Lecture>>
    ) {
        searchCount++; if (searchCount > 200000 || results.size >= 50) return

        if (currentCredit >= minCredit && currentCredit <= maxCredit) {
            if (currentMajorCount == targetMajorCount && currentGeneralCount == targetGeneralCount) {
                results.add(currentSchedule.filter { it.id != "BLOCKED" }.flatMap { it.timeSlots })
                return
            }
        }

        for (i in index until candidates.size) {
            val course = candidates[i]

            val isMajor = course.category.contains("전공")
            if (isMajor && currentMajorCount >= targetMajorCount) continue
            if (!isMajor && currentGeneralCount >= targetGeneralCount) continue

            if (currentCredit + course.credit > maxCredit) continue
            if (currentSchedule.any { extractBaseId(it.id) == extractBaseId(course.id) }) continue

            if (!isConflict(currentSchedule, course)) {
                currentSchedule.add(course)
                findSchedules(i + 1, currentSchedule, currentCredit + course.credit,
                    if (isMajor) currentMajorCredit + course.credit else currentMajorCredit,
                    if (isMajor) currentMajorCount + 1 else currentMajorCount,
                    if (!isMajor) currentGeneralCount + 1 else currentGeneralCount,
                    minCredit, maxCredit, targetMajorCount, targetGeneralCount, candidates, results)
                currentSchedule.removeAt(currentSchedule.lastIndex)
            }
        }
    }

    private fun extractBaseId(fullId: String): String = if (fullId.contains("-")) fullId.split("-")[0] else fullId

    private fun isConflict(currentSchedule: List<CourseGroup>, newCourse: CourseGroup): Boolean {
        if (newCourse.timeSlots.any { it.startTime == -1 }) return false
        val existingSlots = currentSchedule.flatMap { it.timeSlots }
        for (a in existingSlots) {
            if (a.startTime == -1) continue
            for (b in newCourse.timeSlots) {
                if (a.day == b.day && a.startTime < b.endTime && a.endTime > b.startTime) return true
            }
        }
        return false
    }

    private fun parseRawLectures(rawList: List<RawLecture>, university: String): List<Lecture> {
        val result = mutableListOf<Lecture>()
        for (raw in rawList) {
            val randomRating = Math.round((3.0 + Math.random() * 2.0) * 10) / 10.0
            val finalCollege = if (university == "KOREA") "고려대학교" else raw.college
            val timeSlots = if (university == "HANYANG") parseHanyangTime(raw.timeRoom) else parseKoreaTime(raw.timeRoom)

            for (slot in timeSlots) {
                result.add(
                    Lecture(
                        dbId = null, university = university, id = raw.id, name = raw.name,
                        professor = raw.professor, credit = raw.credit.toDouble(),
                        day = slot.day, startTime = slot.start, endTime = slot.end,
                        rating = randomRating, category = raw.category, details = raw.details,
                        college = finalCollege, department = raw.department, timeRoom = raw.timeRoom
                    )
                )
            }
        }
        return result
    }

    private fun timeToMinutes(timeStr: String): Int = try {
        val parts = timeStr.split(":")
        parts[0].toInt() * 60 + parts[1].toInt()
    } catch (e: Exception) { -1 }

    data class TimeSlot(val day: String, val start: Int, val end: Int)

    private fun getPeriodStart(period: Int): Int = when (period) {
        0 -> 8 * 60; 1 -> 9 * 60; 2 -> 10 * 60 + 30; 3 -> 12 * 60; 4 -> 13 * 60 + 30;
        5 -> 15 * 60; 6 -> 16 * 60 + 30; 7 -> 18 * 60; 8 -> 19 * 60; 9 -> 20 * 60; 10 -> 21 * 60; else -> -1
    }

    private fun getPeriodEnd(period: Int): Int {
        val start = getPeriodStart(period)
        return if (start == -1) -1 else if (period in 1..6) start + 75 else start + 50
    }

    private fun parseKoreaTime(timeRoom: String): List<TimeSlot> {
        val list = mutableListOf<TimeSlot>()
        if (timeRoom.contains("미정") || timeRoom.isBlank()) return listOf(TimeSlot("Mon", -1, -1))
        val dayMap = mapOf('월' to "Mon", '화' to "Tue", '수' to "Wed", '목' to "Thu", '금' to "Fri", '토' to "Sat")
        val timePattern = Pattern.compile("([월화수목금토일])[^(]*\\((\\d{1,2}:\\d{2})-(\\d{1,2}:\\d{2})\\)")
        val timeMatcher = timePattern.matcher(timeRoom)
        while (timeMatcher.find()) {
            val dayChar = timeMatcher.group(1)[0]
            val startMin = timeToMinutes(timeMatcher.group(2)); val endMin = timeToMinutes(timeMatcher.group(3))
            dayMap[dayChar]?.let { list.add(TimeSlot(it, startMin, endMin)) }
        }
        val periodPattern = Pattern.compile("([월화수목금토일])\\s*\\((\\d+)(?:-(\\d+))?\\)")
        val periodMatcher = periodPattern.matcher(timeRoom)
        while (periodMatcher.find()) {
            val dayChar = periodMatcher.group(1)[0]
            val startPeriod = periodMatcher.group(2).toInt()
            val endPeriod = periodMatcher.group(3)?.toInt() ?: startPeriod
            val startMin = getPeriodStart(startPeriod); val endMin = getPeriodEnd(endPeriod)
            if (startMin != -1 && endMin != -1) dayMap[dayChar]?.let { list.add(TimeSlot(it, startMin, endMin)) }
        }
        if (list.isEmpty()) list.add(TimeSlot("Mon", -1, -1))
        return list
    }

    private fun parseHanyangTime(timeRoom: String): List<TimeSlot> {
        val list = mutableListOf<TimeSlot>()
        if (timeRoom.contains("시간미지정") || timeRoom.contains("미정")) return listOf(TimeSlot("Mon", -1, -1))
        val dayMap = mapOf('월' to "Mon", '화' to "Tue", '수' to "Wed", '목' to "Thu", '금' to "Fri", '토' to "Sat")
        val pattern = Pattern.compile("([월화수목금토]+)[^\\d]*(\\d{2}:\\d{2})-(\\d{2}:\\d{2})")
        val matcher = pattern.matcher(timeRoom.replace("\n", " "))
        while (matcher.find()) {
            val daysStr = matcher.group(1)
            val startMin = timeToMinutes(matcher.group(2)); val endMin = timeToMinutes(matcher.group(3))
            for (charDay in daysStr) dayMap[charDay]?.let { list.add(TimeSlot(it, startMin, endMin)) }
        }
        if (list.isEmpty()) list.add(TimeSlot("Mon", -1, -1))
        return list
    }

    data class CourseGroup(val id: String, val name: String, val professor: String, val credit: Double,
                           val rating: Double, val category: String, val details: String,
                           val timeSlots: List<Lecture>, val isMustHaveMajor: Boolean, val isMustHaveGeneral: Boolean,
                           val hasPreference: Boolean)
}