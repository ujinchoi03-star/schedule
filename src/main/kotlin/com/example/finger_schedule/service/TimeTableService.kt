package com.example.finger_schedule.service

import com.example.finger_schedule.domain.Lecture
import com.example.finger_schedule.domain.SavedTimetable
import com.example.finger_schedule.dto.*
import com.example.finger_schedule.repository.LectureRepository
import com.example.finger_schedule.repository.SavedTimetableRepository
import com.example.finger_schedule.repository.UserRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import jakarta.annotation.PostConstruct
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import org.springframework.http.HttpStatus
import java.util.regex.Pattern
import org.springframework.transaction.annotation.Transactional

@Service
class TimeTableService(
    private val lectureRepository: LectureRepository,
    // 🚀 [추가] 필요한 레포지토리 주입
    private val userRepository: UserRepository,
    private val savedTimetableRepository: SavedTimetableRepository
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

    // 🔍 검색 로직
    fun getSearchLectures(university: String?, keyword: String?): List<LectureSearchResponse> {
        var lectures = if (university != null) lectureRepository.findAllByUniversity(university) else lectureRepository.findAll()

        if (!keyword.isNullOrBlank()) {
            val k = keyword.trim()
            lectures = lectures.filter { lecture ->
                lecture.name.contains(k, ignoreCase = true) ||
                        lecture.professor.contains(k, ignoreCase = true) ||
                        lecture.id.contains(k, ignoreCase = true)
            }
        }

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

    // TimeTableService.kt 수정
    @Transactional
    fun saveTimetable(request: SaveTimetableRequest): Long {
        // 🚀 [수정] findByEmail 대신 findById를 사용하고, String인 userId를 Long으로 변환합니다.
        val user = userRepository.findById(request.userId).orElse(null)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "유저 ID를 찾을 수 없음: ${request.userId}")

        val lectures = lectureRepository.findAllByIdIn(request.lectureIds).toMutableList()

        if (lectures.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "강의 정보가 없습니다.")
        }

        val newTimetable = SavedTimetable(
            name = request.name,
            user = user,
            lectures = lectures
        )

        return savedTimetableRepository.save(newTimetable).id!!
    }

    // 🚀 저장된 시간표 삭제 (수정: 클래스 내부로 이동)
    fun deleteSavedTimetable(id: Long) {
        savedTimetableRepository.deleteById(id)
    }

    // 🚀 사용자의 저장된 시간표 조회 (수정: 클래스 내부로 이동)
    fun getSavedTimetables(userId: String): List<SavedTimetableResponse> {
        val user = userRepository.findById(userId).orElse(null)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다: $userId")

        return user.savedTimetables.map { saved ->
            SavedTimetableResponse(
                id = saved.id!!,
                name = saved.name,
                lectures = saved.lectures.map { lecture ->
                    LectureSearchResponse(
                        id = lecture.id!!,
                        name = lecture.name,
                        professor = lecture.professor,
                        credit = lecture.credit,
                        rating = lecture.rating,
                        category = lecture.category,
                        details = lecture.details,
                        department = lecture.department,
                        timeRoom = lecture.timeRoom,
                        university = lecture.university,

                        // 🚀 [수정된 부분] lecture의 필드를 바로 사용하여 리스트로 만듭니다.
                        timeSlots = listOf(
                            SearchTimeSlot(
                                day = lecture.day,
                                startTime = lecture.startTime,
                                endTime = lecture.endTime
                            )
                        )
                    )
                }
            )
        }
    }

    // 🚀 시간표 생성 로직
    fun generate(request: TimeTableRequest): List<List<Lecture>> {
        val allLectures = lectureRepository.findAllByUniversity(request.university)
        val mustHaveIds = request.mustHaveMajorIds + request.mustHaveGeneralIds

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

        val conflictMessages = mutableListOf<String>()

        if (mustHaveIds.isNotEmpty()) {
            allLectures.forEach { lecture ->
                if (mustHaveIds.contains(lecture.id)) {
                    if (request.wantedDayOffs.contains(lecture.day)) {
                        val dayMap = mapOf("Mon" to "월", "Tue" to "화", "Wed" to "수", "Thu" to "목", "Fri" to "금")
                        val dayKo = dayMap[lecture.day] ?: lecture.day
                        conflictMessages.add("'${lecture.name}' (${dayKo}요일 공강 위배)")
                    }
                }
            }

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

            if (request.avoidNameKeywords.isNotEmpty()) {
                if (request.avoidNameKeywords.any { k -> group.name.contains(k, ignoreCase = true) }) return@filter false
            }

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