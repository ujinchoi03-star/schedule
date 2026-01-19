package com.example.finger_schedule.loader

import com.example.finger_schedule.dto.Lecture
import com.example.finger_schedule.repository.LectureRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
class LectureDataLoader(
    private val lectureRepository: LectureRepository,
    private val objectMapper: ObjectMapper
) : ApplicationRunner {

    override fun run(args: ApplicationArguments) {
        println("🔥 LectureDataLoader started")

        loadUniversityLecturesIfEmpty(
            universityCode = "HANYANG",
            jsonFileName = "real_lectures_hanyang_full.json"
        )

        loadUniversityLecturesIfEmpty(
            universityCode = "KOREA",
            jsonFileName = "real_lectures_korea.json"
        )

        println("✅ total lecture count = ${lectureRepository.count()}")
    }

    private fun loadUniversityLecturesIfEmpty(universityCode: String, jsonFileName: String) {
        // ✅ 이미 있으면 스킵 (재시작해도 DB 유지)
        val existing = lectureRepository.findAllByUniversity(universityCode)
        if (existing.isNotEmpty()) {
            println("📘 $universityCode already exists (${existing.size}). Skip loading.")
            return
        }

        val resource = ClassPathResource(jsonFileName)
        if (!resource.exists()) {
            println("❌ JSON not found: $jsonFileName")
            return
        }

        val root = objectMapper.readTree(resource.inputStream)
        if (!root.isArray) {
            println("❌ JSON root is not an array: $jsonFileName")
            return
        }

        val lectures = root.map { node ->
            Lecture(
                university = universityCode,
                id = node.path("id").asText(""),
                name = node.path("name").asText(""),
                professor = node.path("professor").asText(""),
                credit = node.path("credit").asDouble(0.0),
                day = "Mon",     // TODO: timeRoom 파싱
                startTime = 0,   // TODO
                endTime = 0,     // TODO
                rating = 0.0,
                category = node.path("category").asText(""),
                details = node.path("details").asText(""),
                college = node.path("college").asText(""),
                department = node.path("department").asText(""),
                timeRoom = node.path("timeRoom").asText("")
            )
        }

        lectureRepository.saveAll(lectures)
        println("✅ loaded ${lectures.size} lectures for $universityCode from $jsonFileName")
    }
}
