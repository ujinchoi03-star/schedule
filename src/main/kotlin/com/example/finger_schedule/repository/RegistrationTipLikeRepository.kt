package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.RegistrationTipLike
import org.springframework.data.jpa.repository.JpaRepository

interface RegistrationTipLikeRepository : JpaRepository<RegistrationTipLike, Long> {
    fun findByTipIdAndUserId(tipId: Long, userId: String): List<RegistrationTipLike>
    fun countByTipId(tipId: Long): Int
    fun deleteByTipId(tipId: Long)
}
