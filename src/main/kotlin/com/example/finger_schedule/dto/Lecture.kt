package com.example.finger_schedule.dto

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id

// 강의 정보를 담는 그릇 (데이터 클래스)
@Entity
class Lecture(
    @Id
    val id: String,          // 강의 고유 번호 (예: "CS101")
    val name: String,        // 강의명 (예: "자료구조")
    val professor: String,   // 교수님 (예: "김컴공")
    val credit: Int,
    @Column(name = "day_of_week")// 학점 (예: 3)
    val day: String,         // 요일 (예: "Mon", "Wed")
    val startTime: Int,      // 시작 교시 (예: 1교시 -> 9시)
    val endTime: Int,        // 끝나는 교시 (예: 3교시 -> 12시)
    val rating: Double,
    val category: String, // "전공" or "교양"
    val details: String   // "영어전용, IC-PBL..."// 강의 평점 (예: 4.5)
){
    // ✨ 추가된 기능: 다른 강의와 시간이 겹치는지 확인하는 함수
    fun isOverlapping(other: Lecture): Boolean {
        // 1. 요일이 다르면 절대 안 겹침
        if (this.day != other.day) return false

        // 2. 시간 겹침 공식 (내 시작시간이 쟤 끝시간보다 빠르고, 쟤 시작시간이 내 끝시간보다 빨라야 함)
        // 쉽게 말해: 교집합이 있느냐?
        return (this.startTime <= other.endTime) && (other.startTime <= this.endTime)
    }
}