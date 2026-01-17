package com.example.finger_schedule.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.stereotype.Component

@Component
class JwtAuthenticationFilter(
    private val jwtTokenProvider: JwtTokenProvider
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // 1. 헤더에서 토큰 꺼내기
        val token = resolveToken(request)

        // 2. 토큰이 유효하면 유저 정보 설정
        if (token != null && jwtTokenProvider.validateToken(token)) {
            val email = jwtTokenProvider.getEmail(token)

            // (간단하게 구현) 비밀번호/권한 없이 아이디만으로 인증 객체 생성
            val auth = UsernamePasswordAuthenticationToken(email, null, emptyList())
            SecurityContextHolder.getContext().authentication = auth
        }

        filterChain.doFilter(request, response)
    }

    // "Bearer eyJhbG..." 형태에서 순수 토큰만 추출
    private fun resolveToken(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        return if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            bearerToken.substring(7)
        } else {
            null
        }
    }
}