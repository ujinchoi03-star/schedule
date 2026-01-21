import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException

# === 🛠️ 설정 ===
print("🚀 한양대 크롤러 (버튼 클릭 강화 패치) 시작...")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
wait = WebDriverWait(driver, 15) # 기본 대기 15초

try:
    # 1. 사이트 접속
    driver.get("https://portal.hanyang.ac.kr/sugang/sulg.do")
    
    try:
        print("🖱️ '수강편람' 메뉴 클릭...")
        menu_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'a[title="수강편람"]')))
        menu_btn.click()
    except:
        pass

    # 2. 조회 시작
    print("🖱️ '조회' 버튼 클릭!")
    search_btn = wait.until(EC.element_to_be_clickable((By.ID, "btn_Find")))
    search_btn.click()
    
    time.sleep(3) 

    final_lectures = []
    current_page = 1
    
    while True:
        print(f"\n📄 {current_page}페이지 데이터 수집 중...")
        
        # (1) 데이터 수집 (기존과 동일)
        try:
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "tr")))
        except:
            print("⚠️ 테이블 로딩 실패")

        rows = driver.find_elements(By.TAG_NAME, "tr")
        count = 0
        for row in rows:
            try:
                name_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="gwamokNm"]')
                if not name_elem: continue 
                
                name = name_elem[0].text.strip()
                haksu_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="haksuNo"]')
                haksu_code = haksu_elem[0].text.strip() if haksu_elem else ""
                credit_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="hakjeom"]')
                credit = float(credit_elem[0].text.strip()) if credit_elem else 0.0
                time_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="suupTimes"]')
                time_room = time_elem[0].text.strip() if time_elem else ""
                prof_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="daepyoGangsaNm"]')
                professor = prof_elem[0].text.strip() if prof_elem else "미정"
                isu_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="isuGbNm"]')
                isu_text = isu_elem[0].text.strip() if isu_elem else ""
                category = "전공" if "전공" in isu_text else ("교양" if "교양" in isu_text else "기타")
                detail_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="suupTypeGb"]')
                raw_details = detail_elem[0].text.strip() if detail_elem else ""
                
                details = []
                if raw_details: details.append(raw_details)
                if "영강" in name: details.append("영강")

                unique_id = haksu_code if haksu_code else f"HYu-{current_page}-{count}"

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
                count += 1
            except: continue
        
        print(f"   ✅ {count}개 수집 완료.")

        # ==========================================================
       # 🚨 [강화된 페이지 이동 로직 - 최종 해결 v4]
        # ==========================================================
        

       # ==========================================================
        # 🚨 [강화된 페이지 이동 로직 - 최종 수정 v5 (종료 조건 강화)]
        # ==========================================================
        
        # Case A: 10의 배수 페이지 (예: 10, 20...) -> '>' 버튼 클릭
        if current_page % 10 == 0:
            print(f"   🔄 현재 {current_page}페이지(10의 배수). 다음 목록(>) 이동 시도...")
            
            expected_next_page = current_page + 1
            next_btn_xpath = "//img[contains(@alt, '다음')]"
            
            try:
                # 1. 이미지 요소 찾기
                next_img_btn = wait.until(EC.element_to_be_clickable((By.XPATH, next_btn_xpath)))
                
                # 2. 클릭 시도
                try:
                    next_img_btn.click()
                except:
                    parent_a = next_img_btn.find_element(By.XPATH, "./ancestor::a")
                    driver.execute_script("arguments[0].click();", parent_a)
                
                print(f"   ⏳ 클릭 수행함. {expected_next_page}페이지가 뜰 때까지 대기...")
                
                # 3. 페이지 번호 감지 (여기서 타임아웃 나면 진짜 끝인 것임)
                wait.until(EC.presence_of_element_located(
                    (By.XPATH, f"//div[@id='pagingPanel']//*[contains(text(), '{expected_next_page}')]")
                ))
                
                print(f"   ✨ {expected_next_page}페이지 발견! 이동 성공.")
                current_page += 1
                time.sleep(1)

            except TimeoutException:
                # [수정] 타임아웃 발생 시, 강제 진행하지 않고 종료합니다.
                print(f"\n🎉 {expected_next_page}페이지가 나타나지 않습니다. (여기가 마지막 페이지입니다)")
                break  # <--- 여기서 루프를 탈출해야 중복 수집을 안 합니다.
            except Exception as e:
                print(f"\n🚨 이동 중 에러 발생: {e}")
                break
        # Case B: 일반 페이지 -> 숫자 버튼 클릭
        else:
            next_page = current_page + 1
            try:
                # 숫자 버튼도 클릭 가능할 때까지 기다림
                next_num_btn = wait.until(EC.element_to_be_clickable((By.XPATH, f"//a[text()='{next_page}']")))
                
                print(f"➡️ {next_page}페이지로 이동합니다...")
                driver.execute_script("arguments[0].click();", next_num_btn)
                
                time.sleep(2)
                current_page += 1
            except:
                print(f"\n🎉 다음 페이지 번호({next_page})를 찾을 수 없습니다. 종료!")
                break

except Exception as e:
    print(f"🚨 에러 발생: {e}")

finally:
    filename = "real_lectures_hanyang_full.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(final_lectures, f, ensure_ascii=False, indent=4)
    print(f"\n📂 저장 완료: {filename} (총 {len(final_lectures)}개 강의)") 