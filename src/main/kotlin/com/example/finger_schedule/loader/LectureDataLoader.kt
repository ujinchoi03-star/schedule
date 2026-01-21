package com.example.finger_schedule.loader

import com.example.finger_schedule.domain.Lecture
import com.example.finger_schedule.repository.LectureRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class LectureDataLoader(
    private val lectureRepository: LectureRepository,
    private val objectMapper: ObjectMapper
) : ApplicationRunner {

    @Transactional
    override fun run(args: ApplicationArguments) {
        println("🚀 [최종 로딩] 멀티 요일 파싱 및 해시태그 반영 시작")

        // 🚀 새 파싱 규칙 적용을 위해 기존 데이터를 반드시 비워야 합니다.
        try {
            lectureRepository.deleteAllInBatch()
        } catch (e: Exception) {
            println("⚠️ DB 초기화 실패. 수동 SQL 삭제가 필요할 수 있습니다.")
        }

        loadUniversityLectures("HANYANG", "real_lectures_hanyang_full.json")
        loadUniversityLectures("KOREA", "real_lectures_korea_2026_1.json")

        println("✅ 파싱 완료! 전체 행(슬롯) 수: ${lectureRepository.count()}개")
    }

    // 🕒 멀티 요일을 지원하는 파싱 함수
    private fun parseTime(timeRoom: String, university: String): List<Triple<String, Int, Int>> {
        val slots = mutableListOf<Triple<String, Int, Int>>()
        try {
            if (timeRoom.isBlank() || timeRoom.contains("시간미지정") || timeRoom.contains("온라인")) {
                return listOf(Triple("Mon", 0, 0))
            }

            // 🚀 findAll을 사용하여 모든 요일 패턴을 찾습니다 (예: 화(1) 목(1))
            val matches = Regex("([월화수목금])\\s*\\(([^)]+)\\)").findAll(timeRoom)

            for (match in matches) {
                val day = match.groupValues[1]
                val content = match.groupValues[2]
                val dayEn = when(day) {
                    "월" -> "Mon" "화" -> "Tue" "수" -> "Wed" "목" -> "Thu" "금" -> "Fri"
                    else -> "Mon"
                }

                // 1. HH:mm 형식 우선 체크
                val timeMatch = Regex("(\\d{1,2}:\\d{2})[-~](\\d{1,2}:\\d{2})").find(content)
                if (timeMatch != null) {
                    val start = timeMatch.groupValues[1].split(":")
                    val end = timeMatch.groupValues[2].split(":")
                    slots.add(Triple(dayEn, start[0].toInt() * 60 + start[1].toInt(), end[0].toInt() * 60 + end[1].toInt()))
                    continue
                }

                // 2. 교시 숫자 형식 체크
                val periods = Regex("\\d+").findAll(content).map { it.value.toInt() }.toList()
                if (periods.isNotEmpty()) {
                    val startP = periods[0]
                    val endP = if (periods.size > 1) periods[1] else startP

                    val (start, end) = if (university == "KOREA") {
                        // 고려대 75분 모듈 (image_ae15ff.png 기준)
                        when(startP) {
                            0 -> 480 to 530; 1 -> 540 to 615; 2 -> 630 to 705; 3 -> 720 to 795;
                            4 -> 810 to 885; 5 -> 900 to 975; 6 -> 990 to 1065; 7 -> 1080 to 1130; else -> 540 to 600
                        }
                    } else {
                        (540 + (startP - 1) * 60) to (540 + endP * 60)
                    }
                    slots.add(Triple(dayEn, start, end))
                }
            }
        } catch (e: Exception) {
            slots.add(Triple("Mon", 0, 0))
        }
        return if (slots.isEmpty()) listOf(Triple("Mon", 0, 0)) else slots
    }

    private fun loadUniversityLectures(universityCode: String, jsonFileName: String) {
        val resource = ClassPathResource(jsonFileName)
        if (!resource.exists()) return

        val root = objectMapper.readTree(resource.inputStream)
        val sectionCounter = mutableMapOf<String, Int>()

        // 🚀 flatMap을 사용하여 한 강의당 여러 요일 슬롯을 각각의 엔티티로 생성
        val lectures = root.flatMap { node ->
            val rawId = node.path("id").asText("")
            val timeRoom = node.path("timeRoom").asText("")

            val finalId = if (universityCode == "HANYANG") {
                val nextCount = sectionCounter.getOrDefault(rawId, 0) + 1
                sectionCounter[rawId] = nextCount
                "$rawId-${nextCount.toString().padStart(2, '0')}"
            } else {
                rawId
            }

            val parsedSlots = parseTime(timeRoom, universityCode)

            parsedSlots.map { (parsedDay, parsedStart, parsedEnd) ->
                Lecture(
                    university = universityCode,
                    id = finalId,
                    name = node.path("name").asText(""),
                    professor = node.path("professor").asText(""),
                    credit = node.path("credit").asDouble(0.0),
                    day = parsedDay,
                    startTime = parsedStart,
                    endTime = parsedEnd,
                    rating = 0.0,
                    category = node.path("category").asText(""),
                    details = node.path("details").asText(""), // 🚀 해시태그 정보 저장
                    college = node.path("college").asText(""),
                    department = node.path("department").asText(""),
                    timeRoom = timeRoom
                )
            }
        }
        lectureRepository.saveAll(lectures)
    }
}