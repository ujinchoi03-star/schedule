package com.example.finger_schedule.service

import com.example.finger_schedule.dto.Lecture
import com.example.finger_schedule.dto.RawLecture
import com.example.finger_schedule.dto.TimeTableRequest
import com.example.finger_schedule.repository.LectureRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import jakarta.annotation.PostConstruct
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.util.regex.Pattern

@Service
class TimeTableService(
    private val lectureRepository: LectureRepository
) {

    @PostConstruct
    fun initData() {
        if (lectureRepository.count() == 0L) {
            try {
                val mapper = jacksonObjectMapper()
                val lecturesToSave = mutableListOf<Lecture>()

                // 1. 한양대 데이터 로드
                val hanyangResource = ClassPathResource("real_lectures_hanyang_full.json")
                val hanyangRaw: List<RawLecture> = mapper.readValue(hanyangResource.inputStream)
                lecturesToSave.addAll(parseRawLectures(hanyangRaw, "HANYANG"))

                // 2. 고려대 데이터 로드
                val koreaResource = ClassPathResource("real_lectures_korea.json")
                val koreaRaw: List<RawLecture> = mapper.readValue(koreaResource.inputStream)
                lecturesToSave.addAll(parseRawLectures(koreaRaw, "KOREA"))

                lectureRepository.saveAll(lecturesToSave)
                println("=== ✅ 데이터 로드 완료: 총 ${lecturesToSave.size}개 시간대 저장 ===")

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun parseRawLectures(rawList: List<RawLecture>, university: String): List<Lecture> {
        val result = mutableListOf<Lecture>()

        for (raw in rawList) {
            val randomRating = Math.round((3.0 + Math.random() * 2.0) * 10) / 10.0

            // 학교별 파싱 로직 호출
            val timeSlots = if (university == "HANYANG") {
                parseHanyangTime(raw.timeRoom)
            } else {
                parseKoreaTime(raw.timeRoom)
            }

            for (slot in timeSlots) {
                result.add(
                    Lecture(
                        id = raw.id,
                        name = raw.name,
                        professor = raw.professor,
                        credit = raw.credit,
                        day = slot.day,
                        startTime = slot.start, // 분 단위 (예: 540)
                        endTime = slot.end,     // 분 단위 (예: 660)
                        rating = randomRating,
                        category = raw.category,
                        details = raw.details,
                        college = raw.college,
                        department = raw.department,
                        timeRoom = raw.timeRoom,
                        // 🚨 [추가] 파라미터로 받은 학교 이름 저장
                        university = university,
                    )
                )
            }
        }
        return result
    }

    // 🕒 [공통] 시간(String) -> 분(Int) 변환 함수
    // 예: "09:00" -> 540
    private fun timeToMinutes(timeStr: String): Int {
        val parts = timeStr.split(":")
        return parts[0].toInt() * 60 + parts[1].toInt()
    }

    data class TimeSlot(val day: String, val start: Int, val end: Int)

    // 🏫 [한양대 파서] "월(10:00-12:00)" -> 분 단위 변환
    private fun parseHanyangTime(timeRoom: String): List<TimeSlot> {
        val list = mutableListOf<TimeSlot>()
        if (timeRoom.contains("시간미지정") || timeRoom.contains("미정")) {
            return listOf(TimeSlot("Mon", -1, -1))
        }

        val dayMap = mapOf('월' to "Mon", '화' to "Tue", '수' to "Wed", '목' to "Thu", '금' to "Fri", '토' to "Sat")

        // 정규식: "월 (10:00-12:00)" 추출
        val pattern = Pattern.compile("([월화수목금토]+)[^\\d]*(\\d{2}:\\d{2})-(\\d{2}:\\d{2})")
        val matcher = pattern.matcher(timeRoom.replace("\n", " "))

        while (matcher.find()) {
            val daysStr = matcher.group(1)
            val startStr = matcher.group(2) // "10:00"
            val endStr = matcher.group(3)   // "12:00"

            val startMin = timeToMinutes(startStr)
            val endMin = timeToMinutes(endStr)

            for (charDay in daysStr) {
                dayMap[charDay]?.let { engDay ->
                    list.add(TimeSlot(engDay, startMin, endMin))
                }
            }
        }

        if (list.isEmpty()) list.add(TimeSlot("Mon", -1, -1))
        return list
    }

    // 🐯 [고려대 파서] "월(1-3)" -> 분 단위 변환 (교시 -> 실제 시간 매핑 필요)
    private fun parseKoreaTime(timeRoom: String): List<TimeSlot> {
        val list = mutableListOf<TimeSlot>()
        if (timeRoom.contains("미정")) return listOf(TimeSlot("Mon", -1, -1))

        val dayMap = mapOf('월' to "Mon", '화' to "Tue", '수' to "Wed", '목' to "Thu", '금' to "Fri", '토' to "Sat")

        // 정규식: "월(1-3)" 추출
        val pattern = Pattern.compile("([월화수목금토])\\((\\d+)-(\\d+)\\)")
        val matcher = pattern.matcher(timeRoom)

        while (matcher.find()) {
            val dayChar = matcher.group(1)[0]
            val startPeriod = matcher.group(2).toInt()
            val endPeriod = matcher.group(3).toInt()

            // 🚨 고려대 교시 -> 실제 시간 변환 규칙 (표준 시간 기준)
            // 1교시 = 09:00 (540분) ~ 10:00
            // N교시 시작 = 9 + (N-1) 시
            val startMin = (9 + (startPeriod - 1)) * 60
            val endMin = (9 + (endPeriod)) * 60 // 끝나는 교시의 종료 시간

            dayMap[dayChar]?.let { engDay ->
                list.add(TimeSlot(engDay, startMin, endMin))
            }
        }

        if (list.isEmpty()) list.add(TimeSlot("Mon", -1, -1))
        return list
    }

    // --- 시간표 알고리즘 (분 단위로 변경됨) ---

    data class CourseGroup(
        val name: String,
        val professor: String,
        val credit: Double,
        val rating: Double,
        val category: String,
        val details: String,
        val timeSlots: List<Lecture>,
        val isMustHaveMajor: Boolean,
        val isMustHaveGeneral: Boolean
    )

    @Service
    class TimeTableService(
        private val lectureRepository: LectureRepository
    ) {
        // ... initData, parseRawLectures 등의 함수들 ...

        // 👇 [추가] 이 함수가 없어서 오류가 났던 겁니다!
        fun getAllLectures(): List<Lecture> {
            return lectureRepository.findAll()
        }

    }
    fun generate(request: TimeTableRequest): List<List<Lecture>> {
        val allLectures = lectureRepository.findAllByUniversity(request.university)

        // 1. 후보군 필터링
        val candidates = allLectures.groupBy { it.id }.map { (_, lectures) ->
            val first = lectures.first()
            CourseGroup(
                name = first.name,
                professor = first.professor,
                credit = first.credit,
                rating = first.rating,
                category = first.category,
                details = first.details,
                timeSlots = lectures,
                isMustHaveMajor = request.mustHaveMajorIds.contains(first.id),
                isMustHaveGeneral = request.mustHaveGeneralIds.contains(first.id)
            )
        }.filter { group ->
            if (group.isMustHaveMajor || group.isMustHaveGeneral) return@filter true

            val basic = group.rating >= request.minRating
            val keyword = if (request.avoidKeywords.isNotEmpty()) {
                request.avoidKeywords.none { k -> group.details.contains(k) }
            } else true

            // 시간 차단 (Block) 로직도 분 단위로 수행
            val timeBlock = if (request.blockedTimes.isNotEmpty()) {
                group.timeSlots.none { lecture ->
                    if (lecture.startTime == -1) return@none false
                    request.blockedTimes.any { blocked ->
                        if (blocked.day != lecture.day) return@any false
                        val blockStart = timeToMinutes(blocked.startTime)
                        val blockEnd = timeToMinutes(blocked.endTime)
                        // 겹침 판별 (분 단위)
                        lecture.startTime < blockEnd && lecture.endTime > blockStart
                    }
                }
            } else true

            basic && keyword && timeBlock
        }.sortedWith(
            compareByDescending<CourseGroup> { it.isMustHaveMajor || it.isMustHaveGeneral }
                .thenByDescending { it.rating }
        )

        val allSchedules = mutableListOf<List<Lecture>>()

        // 2. 백트래킹 (조합 찾기)
        findSchedules(
            0, mutableListOf(), 0.0, 0.0, 0, 0,
            request.targetCredit.toDouble(),
            request.minMajorCredit.toDouble(),
            request.minMustHaveMajorCount,
            request.minMustHaveGeneralCount,
            candidates, allSchedules
        )

        return allSchedules.sortedByDescending { it.map { l -> l.rating }.average() }.take(50)
    }

    private fun findSchedules(
        index: Int,
        currentSchedule: MutableList<CourseGroup>,
        currentCredit: Double,
        currentMajorCredit: Double,
        currentMajorCount: Int,
        currentGeneralCount: Int,
        targetCredit: Double,
        minMajorCredit: Double,
        minMajorCount: Int,
        minGeneralCount: Int,
        candidates: List<CourseGroup>,
        results: MutableList<List<Lecture>>
    ) {
        if (currentCredit >= targetCredit) {
            val countOk = currentMajorCount >= minMajorCount && currentGeneralCount >= minGeneralCount
            val creditOk = currentMajorCredit >= minMajorCredit
            if (countOk && creditOk) {
                results.add(currentSchedule.flatMap { it.timeSlots })
            }
            return
        }

        if (results.size >= 100) return

        for (i in index until candidates.size) {
            val course = candidates[i]
            if (currentCredit + course.credit > targetCredit + 2) continue
            if (currentSchedule.any { it.name == course.name }) continue

            val isMajor = course.category.contains("전공")
            val nextMajorCount = if (course.isMustHaveMajor) currentMajorCount + 1 else currentMajorCount
            val nextGeneralCount = if (course.isMustHaveGeneral) currentGeneralCount + 1 else currentGeneralCount
            val nextMajorCredit = if (isMajor) currentMajorCredit + course.credit else currentMajorCredit

            if (!isConflict(currentSchedule, course)) {
                currentSchedule.add(course)
                findSchedules(
                    i + 1, currentSchedule, currentCredit + course.credit,
                    nextMajorCredit, nextMajorCount, nextGeneralCount,
                    targetCredit, minMajorCredit, minMajorCount, minGeneralCount,
                    candidates, results
                )
                currentSchedule.removeAt(currentSchedule.lastIndex)
            }
        }
    }

    // 충돌 확인 (분 단위)
    private fun isConflict(currentSchedule: List<CourseGroup>, newCourse: CourseGroup): Boolean {
        if (newCourse.timeSlots.any { it.startTime == -1 }) return false
        val existingSlots = currentSchedule.flatMap { it.timeSlots }
        val newSlots = newCourse.timeSlots

        for (a in existingSlots) {
            if (a.startTime == -1) continue
            for (b in newSlots) {
                if (a.day == b.day) {
                    // 분 단위 겹침 확인
                    if (a.startTime < b.endTime && a.endTime > b.startTime) return true
                }
            }
        }
        return false
    }
}