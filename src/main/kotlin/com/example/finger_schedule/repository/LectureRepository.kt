package com.example.finger_schedule.repository

// 🚨 중요: 동료 코드는 dto를 import 하고 있었지만, JPA는 domain(Entity)을 써야 정답입니다!
import com.example.finger_schedule.domain.Lecture
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.transaction.annotation.Transactional

// <Lecture, Long> 유지 (PK는 숫자니까요)
interface LectureRepository : JpaRepository<Lecture, Long> {

    // 1. [공통] 학교별 전체 조회
    fun findAllByUniversity(university: String): List<Lecture>

    // 2. [내 기능] 검색 기능 (학교 + 강의명 키워드 검색)
    // LectureController에서 검색할 때 이 함수가 꼭 필요합니다.
    fun findByUniversityAndNameContaining(university: String, keyword: String): List<Lecture>

    // 3. [공통 & 핵심] 학수번호(String) 리스트로 여러 개 찾기
    // 아까 500 에러를 해결해준 가장 중요한 함수입니다.
    fun findByIdIn(ids: List<String>): List<Lecture>

    // 4. [동료 기능] 학수번호(String) 하나로 딱 1개만 찾기
    fun findOneById(id: String): Lecture?

    // 5. [동료 기능] 데이터 초기화용 전체 삭제 (관리자 기능)
    @Modifying
    @Transactional
    @Query("delete from Lecture")
    fun deleteAllLectures()
}