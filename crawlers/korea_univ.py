from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import json
import traceback

# ==========================================
# ⚙️ 설정 (디버깅 크롬 연결)
# ==========================================
def setup_driver():
    chrome_options = Options()
    # 🚨 실행 전 CMD에서 크롬 디버깅 모드 실행 필수:
    # chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\selenium\ChromeProfile"
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    driver = webdriver.Chrome(options=chrome_options)
    return driver

# ==========================================
# 🕷️ 메인 로직
# ==========================================
def main():
    driver = None
    all_lectures = []
    unique_ids = set() # 중복 방지

    try:
        driver = setup_driver()
        print("✅ 디버깅 크롬 브라우저 연결 성공!")

        # 1. 프레임 진입
        try:
            driver.switch_to.default_content()
            WebDriverWait(driver, 2).until(EC.frame_to_be_available_and_switch_to_it("Main"))
            WebDriverWait(driver, 2).until(EC.frame_to_be_available_and_switch_to_it("coreMain"))
            print("🚪 프레임 진입 완료")
        except:
            pass

        # 2. [1단계] 이수구분 목록 가져오기
        cour_select = Select(driver.find_element(By.ID, 'pCourDiv'))
        # '선택' 제외하고 실제 값만 추출
        cour_options = [opt for opt in cour_select.options if opt.get_attribute("value")]
        
        print(f"🔎 총 {len(cour_options)}개의 이수구분을 탐색합니다.")

        # -------------------------------------------------------
        # 🔁 메인 루프: 이수구분 하나씩 도장깨기
        # -------------------------------------------------------
        for opt in cour_options:
            cour_val = opt.get_attribute("value")
            cour_text = opt.text.strip()
            
            # (1) 이수구분 변경
            Select(driver.find_element(By.ID, 'pCourDiv')).select_by_value(cour_val)
            time.sleep(1.5) # ⚠️ 중요: 화면 갱신될 때까지 충분히 대기

            print(f"\n📂 [1단계] {cour_text} ({cour_val}) 진입...")

            # (2) 화면 상태 동적 감지
            # 화면에 단과대/영역 칸이 보여도, 안에 옵션이 '선택' 하나뿐이면 사실상 없는 것 취급해야 함
            group_elem = driver.find_element(By.ID, 'pGroupCd')
            col_elem = driver.find_element(By.ID, 'pCol')
            
            # --- CASE A: 교양 영역(pGroupCd)이 유효한가? ---
            if group_elem.is_displayed() and len(Select(group_elem).options) > 1:
                group_select = Select(group_elem)
                # '선택' 제외 유효 옵션만
                group_opts = [o for o in group_select.options if o.get_attribute("value")]
                
                for g_opt in group_opts:
                    g_val = g_opt.get_attribute("value")
                    g_text = g_opt.text.strip()
                    
                    Select(driver.find_element(By.ID, 'pGroupCd')).select_by_value(g_val)
                    time.sleep(0.5)
                    
                    print(f"   📘 [영역] {g_text} 조회")
                    click_search_and_parse(driver, cour_text, "교양", g_text, all_lectures, unique_ids)

            # --- CASE B: 단과대(pCol)가 유효한가? ---
            elif col_elem.is_displayed() and len(Select(col_elem).options) > 1:
                col_select = Select(col_elem)
                col_opts = [o for o in col_select.options if o.get_attribute("value")]

                for c_opt in col_opts:
                    c_val = c_opt.get_attribute("value")
                    c_text = c_opt.text.strip()

                    Select(driver.find_element(By.ID, 'pCol')).select_by_value(c_val)
                    time.sleep(0.5)
                    print(f"   🏫 [단과대] {c_text}")

                    # (3) 학과(pDept) 체크
                    dept_elem = driver.find_element(By.ID, 'pDept')
                    if dept_elem.is_displayed() and len(Select(dept_elem).options) > 1:
                        dept_select = Select(dept_elem)
                        dept_opts = [d for d in dept_select.options if d.get_attribute("value")]
                        
                        for d_opt in dept_opts:
                            d_val = d_opt.get_attribute("value")
                            d_text = d_opt.text.strip()
                            
                            Select(driver.find_element(By.ID, 'pDept')).select_by_value(d_val)
                            time.sleep(0.3)
                            click_search_and_parse(driver, cour_text, c_text, d_text, all_lectures, unique_ids)
                    else:
                        # 학과가 없으면 단과대 전체 조회
                        print(f"      ㄴ 학과 세부 없음 -> 바로 조회")
                        click_search_and_parse(driver, cour_text, c_text, "전체", all_lectures, unique_ids)

            # --- CASE C: 하위 분류가 아무것도 없음 (군사학, 평생교육사 등) ---
            else:
                print(f"   ⚡ 하위 분류 없음 -> 즉시 '조회' 버튼 클릭!")
                click_search_and_parse(driver, cour_text, "기타", "전체", all_lectures, unique_ids)

        # 최종 저장
        save_to_json(all_lectures)

    except Exception:
        traceback.print_exc()


# ==========================================
# 🔍 공통: 조회 버튼 클릭 및 데이터 파싱
# ==========================================
def click_search_and_parse(driver, category, college, dept, results, unique_ids):
    try:
        # 조회 버튼 클릭 (JavaScript 실행이 더 안정적)
        search_btn = driver.find_element(By.ID, 'btnSearch')
        driver.execute_script("arguments[0].click();", search_btn)
        
        # 데이터 로딩 대기
        time.sleep(1.5)

        # BS4 파싱
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        rows = soup.select('#gridLecture > tbody > tr')

        if not rows: return
        # '데이터가 없습니다' 처리
        if len(rows) == 1 and ("없습니다" in rows[0].text or "No data" in rows[0].text):
            return

        count = 0
        for row in rows:
            try:
                cols = row.find_all('td')
                if len(cols) < 8: continue

                course_id = cols[1].get_text(strip=True)
                section = cols[2].get_text(strip=True)
                full_id = f"{course_id}-{section}" # ID 생성

                if full_id in unique_ids: continue # 중복 제거
                unique_ids.add(full_id)

                # 강의명 및 상세정보
                name_cell = cols[5]
                name = name_cell.get_text(strip=True)
                
                details = []
                # 1. MOOC 태그 확인
                if name_cell.find('span', class_='label-type', string='M'):
                    details.append("MOOC")
                    if name.endswith('M'): name = name[:-1].strip()
                
                # 2. 강의명에 포함된 단어 확인
                if "영강" in name: details.append("영강")
                if "외국어" in name: details.append("외국어강의")
                
                # 👇 [추가된 부분] 강의명에 '유연학기'가 있으면 태그 추가!
                if "유연학기" in name: details.append("유연학기")

                prof = cols[6].get_text(strip=True)
                
                # 학점 처리 '3(3)' -> 3.0
                try:
                    credit = float(cols[7].get_text(strip=True).split('(')[0])
                except:
                    credit = 0.0

                time_room = cols[8].get_text(separator=" ", strip=True)

                lecture = {
                    "id": full_id,
                    "name": name,
                    "professor": prof,
                    "credit": credit,
                    "timeRoom": time_room,
                    "category": category,
                    "college": college,
                    "department": dept,
                    "details": ",".join(details), # 여기에 '유연학기'가 포함되어 저장됩니다.
                    "year": 2025,
                    "semester": 1
                }
                results.append(lecture)
                count += 1
            except:
                continue
        
        if count > 0:
            print(f"      ✅ {count}건 수집 완료 ({dept})")

    except Exception as e:
        print(f"      ❌ 조회 중 에러: {e}")

def save_to_json(data):
    filename = 'real_lectures_korea_2026_1.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"\n🎉 크롤링 종료! 총 {len(data)}개 강의 저장됨.")

if __name__ == "__main__":
    main()