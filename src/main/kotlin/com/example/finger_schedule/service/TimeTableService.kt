package com.example.finger_schedule.service

import com.example.finger_schedule.dto.Lecture
import com.example.finger_schedule.dto.TimeTableRequest
import com.example.finger_schedule.repository.LectureRepository
import org.springframework.stereotype.Service
import jakarta.annotation.PostConstruct
import org.springframework.core.io.ClassPathResource
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue

@Service
class TimeTableService(
    private val lectureRepository: LectureRepository
) {

    @PostConstruct
    fun initData() {
        if (lectureRepository.count() == 0L) {
            try {
                val resource = ClassPathResource("real_lectures_hanyang.json")
                val mapper = jacksonObjectMapper()
                val lectures: List<Lecture> = mapper.readValue(resource.inputStream)
                lectureRepository.saveAll(lectures)
                println("=== ✅ 데이터 로드 완료 ===")
            } catch (e: Exception) {
                println("🚨 데이터 로드 실패: ${e.message}")
            }
        }
    }

    data class CourseGroup(
        val name: String,
        val professor: String,
        val credit: Int,
        val rating: Double,
        val category: String,
        val details: String,
        val timeSlots: List<Lecture>,
        val isMustHaveMajor: Boolean,
        val isMustHaveGeneral: Boolean
    )

    fun getAllLectures(): List<Lecture> {
        return lectureRepository.findAll()
    }

    // 🚀 시간표 생성 메인 함수
    fun generate(request: TimeTableRequest): List<List<Lecture>> {
        val allLectures = lectureRepository.findAll()

        // 1. 후보군 생성
        val candidates = allLectures.map { lecture ->
            CourseGroup(
                name = lecture.name,
                professor = lecture.professor,
                credit = lecture.credit,
                rating = lecture.rating,
                category = lecture.category,
                details = lecture.details,
                timeSlots = listOf(lecture),
                isMustHaveMajor = request.mustHaveMajorIds.contains(lecture.id),
                isMustHaveGeneral = request.mustHaveGeneralIds.contains(lecture.id)
            )
        }.filter { group ->
            // (A) 필수 후보는 무조건 통과
            if (group.isMustHaveMajor || group.isMustHaveGeneral) return@filter true

            // (B) 기본 필터
            val basicCondition = group.rating >= request.minRating
            // 주의: preferredDays 필터는 제거했습니다. (공강 요일 우선순위 로직을 위해 모든 요일을 후보로 둠)
            // 만약 '절대 수업 있으면 안 되는 요일'이 있다면 blockedTimes(00:00~23:59)로 처리하는 것이 좋습니다.

            val majorCondition = if (request.onlyMajor) group.category == "전공" else true
            val keywordCondition = if (request.avoidKeywords.isNotEmpty()) {
                request.avoidKeywords.none { keyword -> group.details.contains(keyword) }
            } else { true }
            val noTimeCondition = if (request.excludeNoTime) {
                group.timeSlots.none { it.startTime == -1 }
            } else { true }

            // (C) 시간 차단(Block) 필터
            val timeBlockCondition = if (request.blockedTimes.isNotEmpty()) {
                group.timeSlots.none { lecture ->
                    if (lecture.startTime == -1) return@none false
                    val lecStartMin = 540 + (lecture.startTime - 1) * 60
                    val lecEndMin = 540 + (lecture.endTime - 1) * 60

                    request.blockedTimes.any { blocked ->
                        if (blocked.day != lecture.day) return@any false
                        val userStartMin = parseTimeToMinutes(blocked.startTime)
                        val userEndMin = parseTimeToMinutes(blocked.endTime)
                        // 겹침 확인
                        lecStartMin < userEndMin && lecEndMin > userStartMin
                    }
                }
            } else { true }

            basicCondition && majorCondition && keywordCondition && noTimeCondition && timeBlockCondition
        }.sortedWith(
            compareByDescending<CourseGroup> { it.isMustHaveMajor || it.isMustHaveGeneral }
                .thenByDescending { it.rating }
        )

        val allSchedules = mutableListOf<List<Lecture>>()

        // 2. 백트래킹 (조합 찾기)
        findSchedules(
            index = 0,
            currentSchedule = mutableListOf(),
            currentCredit = 0,
            currentMajorCredit = 0, // 👈 [복구] 현재 전공 학점
            currentMajorCount = 0,
            currentGeneralCount = 0,

            targetCredit = request.targetCredit,
            minMajorCredit = request.minMajorCredit, // 👈 [복구] 목표 전공 학점
            minMajorCount = request.minMustHaveMajorCount,
            minGeneralCount = request.minMustHaveGeneralCount,

            candidates = candidates,
            results = allSchedules
        )

        // 3. 정렬 (1순위: 공강 요일 수, 2순위: 평균 평점)
        return allSchedules.sortedWith(
            compareByDescending<List<Lecture>> { schedule ->
                val daysWithClasses = schedule.filter { it.startTime != -1 }.map { it.day }.toSet()
                // 사용자가 원하는 공강 요일 중, 실제로 수업이 없는 날의 개수
                request.wantedDayOffs.count { wanted -> !daysWithClasses.contains(wanted) }
            }.thenByDescending { schedule ->
                schedule.map { it.rating }.average()
            }
        ).take(50)
    }

    private fun parseTimeToMinutes(timeStr: String): Int {
        val parts = timeStr.split(":")
        return parts[0].toInt() * 60 + parts[1].toInt()
    }

    private fun findSchedules(
        index: Int,
        currentSchedule: MutableList<CourseGroup>,
        currentCredit: Int,
        currentMajorCredit: Int, // 👈
        currentMajorCount: Int,
        currentGeneralCount: Int,

        targetCredit: Int,
        minMajorCredit: Int,     // 👈
        minMajorCount: Int,
        minGeneralCount: Int,

        candidates: List<CourseGroup>,
        results: MutableList<List<Lecture>>
    ) {
        // [종료 조건]
        if (currentCredit >= targetCredit) {
            // ✅ 조건 검사: 필수 개수 & 전공 학점
            val majorCountSuccess = currentMajorCount >= minMajorCount
            val generalCountSuccess = currentGeneralCount >= minGeneralCount
            val majorCreditSuccess = currentMajorCredit >= minMajorCredit // 👈 확인!

            if (majorCountSuccess && generalCountSuccess && majorCreditSuccess) {
                val flatList = currentSchedule.flatMap { it.timeSlots }
                results.add(flatList)
            }
            return
        }

        if (results.size >= 200) return

        for (i in index until candidates.size) {
            val course = candidates[i]

            if (currentCredit + course.credit > targetCredit + 2) continue
            if (currentSchedule.any { it.name == course.name }) continue

            // 카운트 및 학점 증가
            val nextMajorCount = if (course.isMustHaveMajor) currentMajorCount + 1 else currentMajorCount
            val nextGeneralCount = if (course.isMustHaveGeneral) currentGeneralCount + 1 else currentGeneralCount

            // 전공 학점 계산 (카테고리가 '전공'이면 더함)
            val isMajor = course.category.contains("전공")
            val nextMajorCredit = if (isMajor) currentMajorCredit + course.credit else currentMajorCredit

            if (!isConflict(currentSchedule, course)) {
                currentSchedule.add(course)
                findSchedules(
                    i + 1, currentSchedule, currentCredit + course.credit,
                    nextMajorCredit, nextMajorCount, nextGeneralCount, // 👈 전달
                    targetCredit, minMajorCredit, minMajorCount, minGeneralCount,
                    candidates, results
                )
                currentSchedule.removeAt(currentSchedule.lastIndex)
            }
        }
    }

    private fun isConflict(currentSchedule: List<CourseGroup>, newCourse: CourseGroup): Boolean {
        if (newCourse.timeSlots.any { it.startTime == -1 }) return false
        val existingSlots = currentSchedule.flatMap { it.timeSlots }
        val newSlots = newCourse.timeSlots
        for (a in existingSlots) {
            if (a.startTime == -1) continue
            for (b in newSlots) {
                if (a.day == b.day) {
                    if (a.startTime < b.endTime && a.endTime > b.startTime) return true
                }
            }
        }
        return false
    }
}