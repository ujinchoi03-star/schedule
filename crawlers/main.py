import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# === 🛠️ 설정 ===
print("🚀 한양대 전체 페이지 크롤러 시작합니다...")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
wait = WebDriverWait(driver, 10)

try:
    # 1. 사이트 접속
    driver.get("https://portal.hanyang.ac.kr/sugang/sulg.do")
    
    # 2. '수강편람' 메뉴 진입
    print("🖱️ '수강편람' 메뉴 클릭...")
    try:
        menu_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'a[title="수강편람"]')))
        menu_btn.click()
    except:
        pass

    # 3. '조회' 버튼 클릭
    print("🖱️ '조회' 버튼 클릭! (데이터 수집 시작)")
    search_btn = wait.until(EC.element_to_be_clickable((By.ID, "btn_Find")))
    search_btn.click()
    
    # 첫 로딩 대기
    time.sleep(3) 

    # === 4. 전체 페이지 순회 시작 ===
    final_lectures = []
    current_page = 1
    
    while True:
        print(f"\n📄 {current_page}페이지 데이터 수집 중...")
        
        # (1) 현재 페이지의 데이터 긁기
        rows = driver.find_elements(By.TAG_NAME, "tr")
        page_count = 0
        
        for row in rows:
            try:
                # 과목명 체크 (헤더 제외용)
                name_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="gwamokNm"]')
                if not name_elem: continue 
                
                name = name_elem[0].text.strip()
                
                # 학점 (float)
                credit_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="hakjeom"]')
                credit = float(credit_elem[0].text.strip()) if credit_elem else 0.0

                # 시간 (통합 문자열)
                time_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="suupTimes"]')
                time_room = time_elem[0].text.strip() if time_elem else ""

                # 교수
                prof_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="daepyoGangsaNm"]')
                professor = prof_elem[0].text.strip() if prof_elem else "미정"

                # 이수구분
                isu_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="isuGbNm"]')
                isu_text = isu_elem[0].text.strip() if isu_elem else ""
                
                category = "기타"
                if "전공" in isu_text: category = "전공"
                elif "교양" in isu_text: category = "교양"

                # 상세 정보 (IC-PBL 등)
                detail_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="suupTypeGb"]')
                raw_details = detail_elem[0].text.strip() if detail_elem else ""
                
                details = []
                if raw_details: details.append(raw_details)
                if "영강" in name: details.append("영강")
                if "외국어" in name: details.append("외국어강의")

                # ID 생성 (학수번호 등을 쓰면 좋지만, 페이지 넘길 때 중복 방지를 위해 고유키 생성)
                # 여기서는 '페이지번호-인덱스' 조합 or '학수번호'가 있다면 그걸 쓰는 게 베스트
                # (화면상 학수번호 컬럼이 있다면 그걸 쓰는게 가장 좋습니다. 일단은 순차 ID 사용)
                unique_id = f"HYu-{current_page}-{page_count}"

                lecture = {
                    "id": unique_id,
                    "name": name,
                    "professor": professor,
                    "credit": credit,
                    "timeRoom": time_room,
                    "category": category,
                    "college": "한양대학",
                    "department": "전체",
                    "details": ",".join(details),
                    "year": 2025,
                    "semester": 1
                }
                
                final_lectures.append(lecture)
                page_count += 1
            
            except Exception:
                continue
        
        print(f"   ✅ {page_count}개 강의 수집 완료.")

        # (2) 다음 페이지 버튼 찾기 및 클릭
        next_page = current_page + 1
        try:
            # 🌟 [핵심] 숫자 링크 찾기 (class="numberLink" 안에 있는 <a> 태그 중 텍스트가 '다음페이지 숫자' 인 것)
            # 예: <a onclick="ServiceController.goPage(2)">2</a>
            next_btn = driver.find_element(By.XPATH, f"//span[@class='numberLink']//a[text()='{next_page}']")
            
            # 버튼이 있으면 클릭!
            print(f"➡️ {next_page}페이지로 이동합니다...")
            driver.execute_script("arguments[0].click();", next_btn) # JS 클릭이 더 안정적
            
            # 로딩 대기 (데이터 바뀔 때까지)
            time.sleep(3) 
            current_page += 1
            
        except:
            # 다음 페이지 번호를 못 찾으면 끝난 것임
            print("\n🎉 더 이상 다음 페이지가 없습니다. 크롤링 종료!")
            break

except Exception as e:
    print(f"🚨 에러 발생: {e}")

finally:
    # 저장
    filename = "real_lectures_hanyang_full.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(final_lectures, f, ensure_ascii=False, indent=4)
    
    print(f"\n📂 저장 완료: {filename} (총 {len(final_lectures)}개 강의)")
    # driver.quit()