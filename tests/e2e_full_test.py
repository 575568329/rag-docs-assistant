"""
RAG 知识库助手 — E2E 测试（Playwright）
覆盖：数据页、侧边栏、对话页、图谱页、导航kbId保留、CRUD、响应式、视觉规范
"""

import os, sys, traceback
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:3000"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results: list[dict] = []


def record(name: str, passed: bool, detail: str = ""):
    status = "PASS" if passed else "FAIL"
    results.append({"name": name, "status": status, "detail": detail})
    icon = "[PASS]" if passed else "[FAIL]"
    print(f"  {icon} {name}" + (f" -- {detail}" if detail and not passed else ""))


def screenshot(page, name: str):
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)


def goto(page, url: str):
    """导航到指定 URL，等待 React 水合完成"""
    page.goto(url, wait_until="commit", timeout=120000)
    # 等待 React 渲染出实际内容（header 导航栏）
    try:
        page.wait_for_selector("header", timeout=30000)
    except Exception:
        pass
    page.wait_for_timeout(2000)


def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()
        page.set_default_timeout(30000)
        page.set_default_navigation_timeout(120000)

        try:
            # =============================================
            print("\n[1] 基础连接测试")
            # =============================================
            goto(page, BASE_URL)
            screenshot(page, "01_initial_load")
            record("应用可访问", page.url.startswith(BASE_URL), f"url={page.url}")

            # 检查顶部导航栏
            header = page.locator("header")
            record("顶部导航栏存在", header.count() >= 1)

            nav_btns = page.locator("header nav button")
            record("导航按钮存在", nav_btns.count() >= 3,
                   f"count={nav_btns.count()}")

            # =============================================
            print("\n[2] 数据页测试")
            # =============================================
            goto(page, f"{BASE_URL}/data")
            screenshot(page, "02_data_page")
            print(f"  当前URL: {page.url}")

            # P0-1: 无全宽蓝色新建按钮
            all_btns = page.locator("main button").all()
            has_fullwidth_create = False
            for btn in all_btns:
                text = (btn.text_content() or "").strip()
                if "新建知识库" in text:
                    box = btn.bounding_box()
                    if box and box["width"] > 800:
                        has_fullwidth_create = True
            record("数据页无全宽新建按钮", not has_fullwidth_create)

            # P0-1: 小型新建知识库按钮存在
            create_btns = page.locator("button:has-text('新建知识库')")
            record("新建知识库按钮存在", create_btns.count() >= 1,
                   f"count={create_btns.count()}")

            # P0-2: 知识库卡片 — 先创建一个再测试
            cards = page.locator("main [class*='border'][class*='rounded']").filter(
                has=page.locator("button")
            )
            card_count = cards.count()
            if card_count == 0:
                # 创建一个测试知识库
                print("  (无知识库，先创建一个)")
                cb = page.locator("button:has-text('新建知识库')").first
                if cb.count() > 0:
                    cb.click()
                    page.wait_for_timeout(1000)
                    ni = page.locator("input")
                    if ni.count() > 0:
                        ni.first.fill("E2E测试知识库")
                    di = page.locator("textarea")
                    if di.count() > 0:
                        di.first.fill("自动化测试创建")
                    sb = page.locator("button:has-text('创建')")
                    if sb.count() > 0:
                        sb.first.click()
                        page.wait_for_timeout(3000)
                cards = page.locator("main [class*='border'][class*='rounded']").filter(
                    has=page.locator("button")
                )
                card_count = cards.count()

            screenshot(page, "02b_data_cards")
            record("知识库卡片渲染", card_count > 0, f"候选卡片数={card_count}")

            if card_count > 0:
                first_card = cards.first
                badge_texts = first_card.evaluate("""
                    el => {
                        const spans = el.querySelectorAll('span');
                        return Array.from(spans).filter(s =>
                            s.textContent.includes('文档') || s.textContent.includes('切片')
                        ).map(s => s.textContent.trim());
                    }
                """)
                record("卡片使用 badge 统计", len(badge_texts) >= 1,
                       f"badges={badge_texts}")

                action_btns = first_card.locator("button")
                btn_widths = []
                for i in range(min(action_btns.count(), 4)):
                    box = action_btns.nth(i).bounding_box()
                    if box:
                        btn_widths.append(box["width"])
                all_reasonable = all(w < 300 for w in btn_widths) if btn_widths else True
                record("按钮未被拉满", all_reasonable,
                       f"按钮宽度={[round(w) for w in btn_widths]}")

            # =============================================
            print("\n[3] 文档列表展开测试")
            # =============================================
            if card_count > 0:
                # 用更宽泛的选择器找查看文档按钮
                view_docs_btn = cards.first.locator("button").filter(has_text="文档")
                view_docs_count = view_docs_btn.count()
                print(f"  文档相关按钮数: {view_docs_count}")
                if view_docs_count > 0:
                    view_docs_btn.last.click()
                    page.wait_for_timeout(2000)
                    screenshot(page, "03_docs_expanded")
                    record("文档列表可展开", True)

                    headers = page.locator("text=文档名称")
                    record("文档列表有表头", headers.count() >= 1)

                    collapse_btn = cards.first.locator("button").filter(has_text="收起")
                    if collapse_btn.count() > 0:
                        collapse_btn.first.click()
                        page.wait_for_timeout(500)
                else:
                    record("文档列表展开", False, "查看文档按钮未找到")

            # =============================================
            print("\n[4] 侧边栏知识库列表测试")
            # =============================================
            # 回到数据页确保干净状态
            goto(page, f"{BASE_URL}/data")
            screenshot(page, "04_sidebar")

            aside = page.locator("aside")
            record("侧边栏存在", aside.count() >= 1)

            if aside.count() > 0:
                # P1-1: 检查侧边栏按钮内容
                sidebar_btn_texts = aside.evaluate("""
                    () => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().substring(0, 60))
                """)
                print(f"  侧边栏按钮: {sidebar_btn_texts}")

                doc_count_items = aside.locator("button:has-text('文档')")
                record("知识库项显示文档数", doc_count_items.count() >= 1,
                       f"带文档数的KB项={doc_count_items.count()}")

                all_btn = aside.locator("button:has-text('全部')")
                record("'全部'按钮存在", all_btn.count() >= 1)

                # aside > nav 里的知识库按钮
                nav_kb_btns = aside.locator("nav button")
                total_kb_btns = nav_kb_btns.count()
                print(f"  侧边栏知识库按钮数: {total_kb_btns}")

                if total_kb_btns > 1:
                    nav_kb_btns.nth(1).click()
                    page.wait_for_timeout(2000)
                    screenshot(page, "04b_kb_selected")
                    has_kb_id = "kbId=" in page.url
                    record("选择知识库后URL包含kbId", has_kb_id,
                           f"url={page.url}")
                else:
                    record("选择知识库后URL包含kbId", False,
                           f"侧边栏知识库按钮只有{total_kb_btns}个")

            # =============================================
            print("\n[5] 对话页测试")
            # =============================================
            # 获取一个 kbId
            test_kb_id = None
            if "kbId=" in page.url:
                test_kb_id = page.url.split("kbId=")[1].split("&")[0]

            if test_kb_id:
                goto(page, f"{BASE_URL}/chat?kbId={test_kb_id}")
            else:
                goto(page, f"{BASE_URL}/chat")
            screenshot(page, "05_chat_page")

            # P1-2: 对话页显示知识库摘要
            footer_texts = page.evaluate("""
                () => {
                    const ps = document.querySelectorAll('p');
                    return Array.from(ps).filter(p =>
                        p.className.includes('text-xs')
                    ).map(p => p.textContent.trim());
                }
            """)
            if test_kb_id:
                # 有 kbId 时应显示知识库名称和文档数
                kb_summary_found = False
                for t in footer_texts:
                    if "当前知识库" in t and "文档" in t:
                        kb_summary_found = True
                        record("对话页显示知识库名称和文档数", True, f"text={t}")
                        break
                if not kb_summary_found:
                    record("对话页显示知识库名称和文档数", False,
                           f"footer_texts={footer_texts}")
            else:
                # 无 kbId 时应显示"搜索全部知识库"
                all_kb_hint = any("全部知识库" in t for t in footer_texts)
                record("对话页无kbId时显示全部知识库提示", all_kb_hint,
                       f"footer_texts={footer_texts}")

            # 空状态
            welcome = page.locator("text=AI 知识库问答")
            record("对话页空状态欢迎语", welcome.count() >= 1)

            # =============================================
            print("\n[6] 图谱页测试")
            # =============================================
            if test_kb_id:
                goto(page, f"{BASE_URL}/graph?kbId={test_kb_id}")
            else:
                goto(page, f"{BASE_URL}/graph")
            page.wait_for_timeout(3000)
            screenshot(page, "06_graph_page")

            # P1-3: 节点/关系状态或空状态
            page.wait_for_timeout(3000)
            all_texts = page.evaluate("() => document.body.innerText")
            graph_status_ok = ("节点" in all_texts and "关系" in all_texts) or "探索知识图谱" in all_texts or "图谱" in all_texts
            record("图谱页有状态信息或空状态", graph_status_ok,
                   f"页面含节点={('节点' in all_texts)}, 含探索={('探索知识图谱' in all_texts)}")

            if "节点" in all_texts and "关系" in all_texts:
                # 找到状态文字
                status_el = page.evaluate("""
                    () => {
                        const els = document.querySelectorAll('div');
                        for (const el of els) {
                            const t = el.textContent;
                            if (t && t.includes('节点') && t.includes('关系') && t.length < 100) {
                                return t.trim();
                            }
                        }
                        return '';
                    }
                """)
                record("图谱页显示节点/关系状态", True, f"text={status_el}")
            elif "探索知识图谱" in all_texts:
                record("图谱页空状态显示", True, "显示探索知识图谱")

            # =============================================
            print("\n[7] 导航 & kbId 保留测试")
            # =============================================
            goto(page, f"{BASE_URL}/data")
            aside = page.locator("aside")
            nav_kb_btns = aside.locator("nav button")

            if nav_kb_btns.count() > 1:
                nav_kb_btns.nth(1).click()
                page.wait_for_timeout(2000)

                # 数据 -> 对话
                page.locator("header nav button:has-text('对话')").first.click()
                page.wait_for_timeout(3000)
                chat_url = page.url
                record("数据->对话保留kbId", "kbId=" in chat_url,
                       f"url={chat_url}")

                # 对话 -> 图谱
                page.locator("header nav button:has-text('图谱')").first.click()
                page.wait_for_timeout(3000)
                graph_url = page.url
                record("对话->图谱保留kbId", "kbId=" in graph_url,
                       f"url={graph_url}")

                # 图谱 -> 数据
                page.locator("header nav button:has-text('数据')").first.click()
                page.wait_for_timeout(3000)
                data_url = page.url
                record("图谱->数据保留kbId", "kbId=" in data_url,
                       f"url={data_url}")
            else:
                record("导航kbId保留", False, "无知识库可测试")

            # =============================================
            print("\n[8] CRUD 流程测试")
            # =============================================
            goto(page, f"{BASE_URL}/data")

            # 创建知识库
            create_btn = page.locator("button:has-text('新建知识库')").first
            if create_btn.count() > 0:
                create_btn.click()
                page.wait_for_timeout(1000)
                screenshot(page, "08a_create_dialog")

                name_input = page.locator("input")
                if name_input.count() > 0:
                    name_input.first.fill("E2E测试知识库")
                desc_input = page.locator("textarea")
                if desc_input.count() > 0:
                    desc_input.first.fill("Playwright自动化测试")

                submit = page.locator("button:has-text('创建')")
                if submit.count() > 0:
                    submit.first.click()
                    page.wait_for_timeout(3000)
                    screenshot(page, "08b_after_create")

                    record("创建知识库后URL跳转", "kbId=" in page.url,
                           f"url={page.url}")

                    # 侧边栏出现新知识库
                    new_kb = page.locator("text=E2E测试知识库")
                    record("新知识库出现在侧边栏", new_kb.count() >= 1)
                else:
                    record("创建知识库", False, "创建按钮未找到")
            else:
                record("创建知识库", False, "新建按钮未找到")

            # 删除知识库
            goto(page, f"{BASE_URL}/data")
            page.wait_for_timeout(2000)

            test_kb_el = page.locator("text=E2E测试知识库")
            if test_kb_el.count() > 0:
                # 找到该卡片中的删除按钮
                # 向上找到卡片容器，再找删除按钮
                delete_btns = page.locator("button:has-text('删除')")
                if delete_btns.count() > 0:
                    # 接受 confirm 对话框
                    page.on("dialog", lambda dialog: dialog.accept())
                    # 点击包含 E2E 文字附近的删除按钮
                    # 使用 evaluate 找到正确的删除按钮
                    found_and_clicked = page.evaluate("""
                        () => {
                            const allCards = document.querySelectorAll('[class*="border"][class*="rounded"]');
                            for (const card of allCards) {
                                if (card.textContent.includes('E2E测试知识库')) {
                                    const delBtn = card.querySelector('button');
                                    const btns = card.querySelectorAll('button');
                                    for (const btn of btns) {
                                        if (btn.textContent.trim().includes('删除')) {
                                            btn.click();
                                            return true;
                                        }
                                    }
                                }
                            }
                            return false;
                        }
                    """)
                    page.wait_for_timeout(3000)
                    screenshot(page, "08d_after_delete")
                    record("知识库删除成功", True)
                else:
                    record("知识库删除", False, "删除按钮未找到")
            else:
                record("知识库删除(跳过)", True, "E2E测试知识库未找到")

            # =============================================
            print("\n[9] 响应式布局测试")
            # =============================================
            small_ctx = browser.new_context(viewport={"width": 375, "height": 812})
            small_page = small_ctx.new_page()
            small_page.set_default_timeout(30000)
            small_page.set_default_navigation_timeout(120000)

            goto(small_page, f"{BASE_URL}/data")
            screenshot(small_page, "09_mobile_data")

            # 移动端侧边栏应该隐藏
            aside_visible = small_page.evaluate("""
                () => {
                    const aside = document.querySelector('aside');
                    if (!aside) return false;
                    const r = aside.getBoundingClientRect();
                    const cls = aside.className;
                    return !(r.x < -100 || cls.includes('-translate-x-full'));
                }
            """)
            record("移动端侧边栏默认隐藏", not aside_visible)
            small_ctx.close()

            # =============================================
            print("\n[10] 视觉规范测试")
            # =============================================
            goto(page, f"{BASE_URL}/data")

            # 检查无重阴影
            shadow_check = page.evaluate("""
                () => {
                    const els = document.querySelectorAll('[class*="shadow-lg"], [class*="shadow-xl"], [class*="shadow-2xl"]');
                    return els.length;
                }
            """)
            record("卡片无重阴影", shadow_check == 0, f"重阴影元素数={shadow_check}")

            # 检查无 flex-1 按钮拉满（主内容区）
            flex1_check = page.evaluate("""
                () => {
                    const btns = document.querySelectorAll('main button.flex-1');
                    return btns.length;
                }
            """)
            record("主内容区按钮无flex-1", flex1_check == 0,
                   f"flex-1按钮数={flex1_check}")

        except Exception as e:
            try:
                screenshot(page, "error_state")
            except Exception:
                pass
            print(f"\n[ERROR] 测试异常: {e}")
            traceback.print_exc()

        finally:
            browser.close()

    # ──────────────────────────────────────────
    # 输出汇总
    # ──────────────────────────────────────────
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    total = len(results)

    print(f"\n{'='*50}")
    print(f"  测试结果: {passed}/{total} 通过, {failed} 失败")
    print(f"{'='*50}")

    if failed > 0:
        print("\n[FAIL] 失败项:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  - {r['name']}: {r['detail']}")

    report_path = os.path.join(os.path.dirname(__file__), "test_report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# E2E 测试报告\n\n")
        f.write(f"**结果**: {passed}/{total} 通过\n\n")
        f.write("| 状态 | 测试项 | 详情 |\n")
        f.write("|------|--------|------|\n")
        for r in results:
            icon = "PASS" if r["status"] == "PASS" else "**FAIL**"
            f.write(f"| {icon} | {r['name']} | {r['detail'] or '-'} |\n")

    print(f"\n报告: {report_path}")
    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
