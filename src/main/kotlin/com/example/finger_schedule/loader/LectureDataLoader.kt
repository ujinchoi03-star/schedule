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


    // 🚀 [수정 1] Transactional 어노테이션 제거 (메모리 부족 방지)
    // 대량 데이터 입력 시 함수 전체에 트랜잭션을 걸면 메모리가 터질 수 있습니다.
    override fun run(args: ApplicationArguments) {

        // 🚀 [수정 2] 핵심 방어 로직: 데이터가 1개라도 있으면 로딩 건너뜀
        val count = lectureRepository.count()
        if (count > 0) {
            println("✅ DB에 이미 데이터가 $count 건 존재합니다. 초기 로딩을 건너뜁니다.")
            return
        }

        println("🚀 [초기 로딩] DB가 비어있습니다. 강의 데이터 파싱 시작...")

        try {
            // 기존의 deleteAllInBatch()는 삭제합니다. (위에서 체크하므로 불필요)
            loadUniversityLectures("HANYANG", "real_lectures_hanyang_full.json")
            loadUniversityLectures("KOREA", "real_lectures_korea_2026_1.json")

            println("✅ 모든 데이터 로딩 완료! 총 ${lectureRepository.count()}개")
        } catch (e: Exception) {
            println("⚠️ 데이터 로딩 중 오류 발생 (하지만 서버는 계속 켜집니다): ${e.message}")
            // e.printStackTrace() // 필요 시 주석 해제하여 상세 에러 확인
        }
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
        try {
            lectureRepository.saveAll(lectures)
            println("   -> $universityCode 데이터 ${lectures.size}개 저장 성공")
        } catch (e: Exception) {
            println("   -> $universityCode 저장 중 일부 오류 발생: ${e.message}")
        }
    }
}