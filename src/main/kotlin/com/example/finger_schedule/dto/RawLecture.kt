package com.example.finger_schedule.dto

// JSON 파일 읽기 전용 클래스
data class RawLecture(
    val id: String,
    val name: String,
    val professor: String,
    val credit: Double,
    val timeRoom: String, // "월화수(10:00-12:00)" 등
    val category: String,
    val college: String,
    val department: String,
    val details: String,
    val year: Int,
    val semester: Int
)