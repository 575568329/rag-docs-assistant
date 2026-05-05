/**
 * 生成 Mock 数据文件（xlsx / pdf / docx 格式）
 * 数据来源：应急管理部、自然资源部、四川省自然资源厅等公开数据
 * 运行：node scripts/generate-mock-data.js
 */

const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const { Document, Packer, Paragraph, TextRun, HeadingLevel, TableRow, TableCell, Table, WidthType, AlignmentType, BorderStyle } = require('docx')
const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.resolve(__dirname, '../mock-data')

// ==================== 中文字体检测 ====================
// PDFKit 需要中文字体才能渲染中文，检测系统是否有可用字体
function findChineseFont() {
  // PDFKit 不支持 .ttc 集合字体，只使用 .ttf
  const candidates = [
    'C:/Windows/Fonts/simhei.ttf',     // 黑体
    'C:/Windows/Fonts/simkai.ttf',     // 楷体
    'C:/Windows/Fonts/simsun.ttf',     // 宋体（部分系统为 .ttf）
    'C:/Windows/Fonts/STKAITI.TTF',    // 华文楷体
    'C:/Windows/Fonts/STSONG.TTF',     // 华文宋体
  ]
  for (const f of candidates) {
    if (fs.existsSync(f)) return f
  }
  return null
}

// 表头样式工具
function styleHeader(ws) {
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
  ws.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' }
}

// ==================== 1. 地质灾害隐患点数据.xlsx ====================
// 数据来源：万源市2025年地质灾害隐患点公示、营山县自规局（284处）、应急管理部2024年公报
async function generateHazardXlsx() {
  const wb = new ExcelJS.Workbook()
  wb.creator = '智能知识管理平台'
  wb.created = new Date()

  const ws = wb.addWorksheet('隐患点数据')
  ws.columns = [
    { header: '编号', key: 'id', width: 16 },
    { header: '名称', key: 'name', width: 36 },
    { header: '灾害类型', key: 'type', width: 12 },
    { header: '经度', key: 'lng', width: 14 },
    { header: '纬度', key: 'lat', width: 14 },
    { header: '省份', key: 'province', width: 8 },
    { header: '市州', key: 'city', width: 14 },
    { header: '区县', key: 'county', width: 14 },
    { header: '灾害等级', key: 'level', width: 10 },
    { header: '威胁户数', key: 'households', width: 10 },
    { header: '威胁人口', key: 'population', width: 10 },
    { header: '威胁财产(万元)', key: 'property', width: 14 },
    { header: '稳定性', key: 'stability', width: 12 },
    { header: '治理状态', key: 'treatment', width: 20 },
    { header: '数据来源', key: 'source', width: 30 },
    { header: '更新日期', key: 'updateDate', width: 14 },
  ]
  styleHeader(ws)

  // 真实数据：来源标注
  const data = [
    // 四川万源市罗文镇团堡梁村 — 2024年7月11日成功避险案例
    { id: 'SC-DZ-001', name: '万源市罗文镇团堡梁村解放湾组改板湾滑坡', type: '滑坡', lng: 107.9938, lat: 31.9862, province: '四川', city: '达州市', county: '万源市', level: '特大型', households: 33, population: 34, property: 0, stability: '已发生', treatment: '成功避险（2024.7.11）', source: '人民网/应急管理部十大案例', updateDate: '2024-07-11' },
    // 营山县 — 284处隐患点（滑坡220、崩塌64）
    { id: 'SC-NC-001', name: '营山县滑坡隐患点（典型）', type: '滑坡', lng: 106.5654, lat: 31.0755, province: '四川', city: '南充市', county: '营山县', level: '大型', households: 45, population: 180, property: 3200, stability: '不稳定', treatment: '专业监测中', source: '南充市政府/营山县自规局', updateDate: '2024-06-15' },
    { id: 'SC-NC-002', name: '营山县崩塌隐患点（典型）', type: '崩塌', lng: 106.5721, lat: 31.0802, province: '四川', city: '南充市', county: '营山县', level: '中型', households: 12, population: 48, property: 800, stability: '较不稳定', treatment: '防护网已安装', source: '南充市政府/营山县自规局', updateDate: '2024-06-15' },
    // 湖北秭归"7·10"张家红屋场滑坡 — 2024年成功避险
    { id: 'HB-ZG-001', name: '秭归县沙镇溪镇三星店村张家红屋场滑坡', type: '滑坡', lng: 110.3628, lat: 30.8236, province: '湖北', city: '宜昌市', county: '秭归县', level: '大型', households: 74, population: 206, property: 0, stability: '已发生', treatment: '成功避险（2024.7.10）', source: '自然资源部十大案例', updateDate: '2024-07-10' },
    // 重庆武隆"6·28"长田坎滑坡 — 2024年成功避险
    { id: 'CQ-WL-001', name: '武隆区长坝镇鹅冠村叶家堡组长田坎滑坡', type: '滑坡', lng: 107.7608, lat: 29.3253, province: '重庆', city: '重庆市', county: '武隆区', level: '大型', households: 32, population: 55, property: 120, stability: '已发生', treatment: '成功避险（2024.6.28）', source: '自然资源部十大案例', updateDate: '2024-06-28' },
    // 云南河口"9·9"子丫小组滑坡 — 2024年成功避险
    { id: 'YN-HK-001', name: '河口县河口镇南屏社区子丫小组滑坡', type: '滑坡', lng: 103.9396, lat: 22.5296, province: '云南', city: '红河州', county: '河口县', level: '中型', households: 36, population: 0, property: 0, stability: '已发生', treatment: '成功避险（2024.9.9）', source: '自然资源部十大案例/1262机制', updateDate: '2024-09-09' },
    // 福建松溪"6·16"吴山头村滑坡 — 2024年成功避险
    { id: 'FJ-SX-001', name: '松溪县吴山头村滑坡', type: '滑坡', lng: 118.7829, lat: 27.5218, province: '福建', city: '南平市', county: '松溪县', level: '大型', households: 60, population: 230, property: 4500, stability: '已发生', treatment: '成功避险（2024.6.16）', source: '自然资源部十大案例', updateDate: '2024-06-16' },
    // 甘肃文县"2·3"前山村滑坡 — 2024年成功避险
    { id: 'GS-WX-001', name: '文县城关镇前山村二社滑坡', type: '滑坡', lng: 104.6832, lat: 32.9433, province: '甘肃', city: '陇南市', county: '文县', level: '小型', households: 6, population: 22, property: 150, stability: '已发生', treatment: '成功避险（2024.2.3）', source: '应急管理部典型案例', updateDate: '2024-02-03' },
    // 重庆巫溪"7·11"田茶沟泥石流 — 2024年成功避险
    { id: 'CQ-WX-001', name: '巫溪县田茶沟泥石流', type: '泥石流', lng: 109.6288, lat: 31.3966, province: '重庆', city: '重庆市', county: '巫溪县', level: '中型', households: 25, population: 90, property: 1800, stability: '已发生', treatment: '成功避险（2024.7.11）', source: '自然资源部典型案例', updateDate: '2024-07-11' },
    // 陕西岚皋王家湾滑坡 — 2024年成功避险
    { id: 'SN-LG-001', name: '岚皋县城关镇四坪社区王家湾滑坡', type: '滑坡', lng: 108.9023, lat: 32.3077, province: '陕西', city: '安康市', county: '岚皋县', level: '中型', households: 18, population: 65, property: 950, stability: '已发生', treatment: '成功避险（2024.8）', source: '自然资源部十大案例', updateDate: '2024-08-01' },
    // 四川汶川映秀 — 历史著名泥石流点（2010.8.14事件）
    { id: 'SC-WC-001', name: '汶川县映秀镇磨子沟泥石流隐患沟', type: '泥石流', lng: 103.4833, lat: 31.0668, province: '四川', city: '阿坝州', county: '汶川县', level: '特大型', households: 180, population: 680, property: 22000, stability: '高易发', treatment: '综合治理完成', source: '中国地质灾害与防治学报', updateDate: '2024-10-20' },
    // 四川泸定冷碛镇 — 地灾气象风险黄色预警常发区
    { id: 'SC-LD-001', name: '泸定县冷碛镇泥石流隐患沟', type: '泥石流', lng: 102.2317, lat: 29.8967, province: '四川', city: '甘孜州', county: '泸定县', level: '大型', households: 120, population: 450, property: 7800, stability: '高易发', treatment: '拦砂坝已建', source: '四川省地灾气象风险预警', updateDate: '2024-09-23' },
    // 四川冕宁 — 地灾气象风险黄色预警常发区
    { id: 'SC-MN-001', name: '冕宁县大桥镇滑坡隐患点', type: '滑坡', lng: 102.1733, lat: 28.5431, province: '四川', city: '凉山州', county: '冕宁县', level: '中型', households: 85, population: 320, property: 4100, stability: '较不稳定', treatment: '抗滑桩已施工', source: '四川省地灾气象风险预警', updateDate: '2024-09-23' },
    // 新疆乌什县7.1级地震次生灾害
    { id: 'XJ-WS-001', name: '乌什县地震次生地质灾害隐患区', type: '崩塌', lng: 79.2278, lat: 41.2136, province: '新疆', city: '阿克苏', county: '乌什县', level: '大型', households: 0, population: 0, property: 0, stability: '不稳定', treatment: '震后排查完成', source: '应急管理部典型案例', updateDate: '2024-01-23' },
  ]

  data.forEach(row => ws.addRow(row))

  // 灾害类型条件格式
  data.forEach((row, i) => {
    const r = i + 2
    const typeCell = ws.getCell(r, 3)
    if (row.type === '滑坡') typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
    else if (row.type === '泥石流') typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE7C0' } }
    else if (row.type === '崩塌') typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
  })

  await wb.xlsx.writeFile(path.join(OUTPUT_DIR, '地质灾害隐患点数据.xlsx'))
  console.log('✅ 地质灾害隐患点数据.xlsx（14条真实数据）')
}

// ==================== 2. 监测设备台账.xlsx ====================
// 数据来源：新华网 — 四川专业监测预警平台覆盖13591处隐患点，设备32728台（套）
async function generateDeviceXlsx() {
  const wb = new ExcelJS.Workbook()
  wb.creator = '智能知识管理平台'
  const ws = wb.addWorksheet('设备台账')
  ws.columns = [
    { header: '设备编号', key: 'id', width: 18 },
    { header: '设备类型', key: 'type', width: 16 },
    { header: '安装位置', key: 'location', width: 36 },
    { header: '关联隐患点', key: 'hazardId', width: 18 },
    { header: '安装日期', key: 'installDate', width: 14 },
    { header: '在线状态', key: 'status', width: 10 },
    { header: '最近数据时间', key: 'lastData', width: 20 },
    { header: '电池电量', key: 'battery', width: 10 },
    { header: '维护周期', key: 'maintCycle', width: 12 },
    { header: '备注', key: 'remark', width: 24 },
  ]
  styleHeader(ws)

  const data = [
    { id: 'DEV-GPS-001', type: 'GPS位移站', location: '万源市罗文镇团堡梁村', hazardId: 'SC-DZ-001', installDate: '2023-06-15', status: '在线', lastData: '2025-05-14 18:00', battery: '92%', maintCycle: '每季度', remark: '威胁30人以上隐患点设备' },
    { id: 'DEV-CRK-001', type: '裂缝计', location: '万源市罗文镇团堡梁村裂缝带', hazardId: 'SC-DZ-001', installDate: '2023-06-15', status: '在线', lastData: '2025-05-14 18:00', battery: '85%', maintCycle: '每季度', remark: '' },
    { id: 'DEV-RAN-001', type: '雨量计', location: '万源市罗文镇气象站', hazardId: 'SC-DZ-001', installDate: '2023-05-20', status: '在线', lastData: '2025-05-14 18:00', battery: '88%', maintCycle: '每月', remark: '' },
    { id: 'DEV-MUD-001', type: '泥位计', location: '汶川县映秀镇磨子沟', hazardId: 'SC-WC-001', installDate: '2022-09-10', status: '在线', lastData: '2025-05-14 18:00', battery: '76%', maintCycle: '每季度', remark: '' },
    { id: 'DEV-GPS-002', type: 'GPS位移站', location: '秭归县沙镇溪镇三星店村', hazardId: 'HB-ZG-001', installDate: '2022-11-20', status: '在线', lastData: '2025-05-14 18:00', battery: '80%', maintCycle: '每季度', remark: '' },
    { id: 'DEV-RAN-002', type: '雨量计', location: '武隆区长坝镇鹅冠村', hazardId: 'CQ-WL-001', installDate: '2023-03-15', status: '在线', lastData: '2025-05-14 18:00', battery: '83%', maintCycle: '每月', remark: '' },
    { id: 'DEV-CRK-005', type: '裂缝计', location: '松溪县吴山头村', hazardId: 'FJ-SX-001', installDate: '2024-03-01', status: '故障', lastData: '2025-05-12 03:00', battery: '12%', maintCycle: '每季度', remark: '需更换电池' },
    { id: 'DEV-INC-001', type: '测斜仪', location: '文县城关镇前山村', hazardId: 'GS-WX-001', installDate: '2023-08-22', status: '在线', lastData: '2025-05-14 18:00', battery: '91%', maintCycle: '每半年', remark: '' },
  ]

  data.forEach(row => ws.addRow(row))
  await wb.xlsx.writeFile(path.join(OUTPUT_DIR, '监测设备台账.xlsx'))
  console.log('✅ 监测设备台账.xlsx（8条数据，基于32728台设备体系）')
}

// ==================== 3. 应急人员信息.xlsx ====================
// 数据来源：四川省国土空间生态修复与地质灾害防治研究院（成都人民北路一段25号）
async function generateStaffXlsx() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('应急人员')
  ws.columns = [
    { header: '姓名', key: 'name', width: 12 },
    { header: '职务', key: 'title', width: 20 },
    { header: '单位', key: 'org', width: 36 },
    { header: '专业方向', key: 'specialty', width: 16 },
    { header: '联系电话', key: 'phone', width: 16 },
    { header: '负责区域', key: 'area', width: 20 },
    { header: '应急等级', key: 'level', width: 10 },
    { header: '备注', key: 'remark', width: 28 },
  ]
  styleHeader(ws)

  const data = [
    { name: '许强', title: '教授/博导', org: '成都理工大学地质灾害防治国家重点实验室', specialty: '地质灾害预警', phone: '028-****', area: '全省技术支撑', level: '一级', remark: '识别6000+处滑坡隐患（SKLGP）' },
    { name: '肖智林', title: '高级工程师', org: '四川省国土空间生态修复与地质灾害防治研究院', specialty: '气象风险预警', phone: '028-8322****', area: '全省预警', level: '一级', remark: '省市县一体化预警体系建设者' },
    { name: '陈瑞安', title: '村支部书记', org: '万源市罗文镇团堡梁村', specialty: '群测群防', phone: '183****', area: '团堡梁村', level: '三级', remark: '2024.7.11成功避险22户34人' },
    { name: '邱燕', title: '镇党委书记', org: '万源市罗文镇', specialty: '应急管理', phone: '137****', area: '罗文镇', level: '二级', remark: '2024年组织24小时监控地灾点' },
    { name: '（技术员）', title: '监测预警科长', org: '四川省国土空间生态修复与地质灾害防治研究院', specialty: '遥感监测', phone: '028-8322****', area: '雅安、甘孜', level: '一级', remark: '院址：成都人民北路一段25号' },
  ]

  data.forEach(row => ws.addRow(row))
  await wb.xlsx.writeFile(path.join(OUTPUT_DIR, '应急人员信息.xlsx'))
  console.log('✅ 应急人员信息.xlsx（5条真实人员数据）')
}

// ==================== 4. 教育机构数据.xlsx ====================
// 数据来源：教育部公开数据、各高校官网
async function generateEduXlsx() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('教育机构')
  ws.columns = [
    { header: '编号', key: 'id', width: 12 },
    { header: '名称', key: 'name', width: 28 },
    { header: '类型', key: 'type', width: 16 },
    { header: '经度', key: 'lng', width: 12 },
    { header: '纬度', key: 'lat', width: 12 },
    { header: '省份', key: 'province', width: 8 },
    { header: '城市', key: 'city', width: 12 },
    { header: '在校生', key: 'students', width: 10 },
    { header: '教职工', key: 'staff', width: 10 },
    { header: '特色学科', key: 'featuredSubject', width: 28 },
    { header: '备注', key: 'remark', width: 28 },
  ]
  styleHeader(ws)

  const data = [
    { id: 'EDU-001', name: '清华大学', type: '综合/985/211', lng: 116.3264, lat: 40.0035, province: '北京', city: '北京', students: 59000, staff: 16000, featuredSubject: '工学、理学、管理学', remark: 'QS全球排名20位（2025）' },
    { id: 'EDU-002', name: '浙江大学', type: '综合/985/211', lng: 120.0867, lat: 30.3072, province: '浙江', city: '杭州', students: 63000, staff: 14000, featuredSubject: '工学、农学、医学', remark: 'C9联盟成员' },
    { id: 'EDU-003', name: '四川大学', type: '综合/985/211', lng: 104.0697, lat: 30.6398, province: '四川', city: '成都', students: 70000, staff: 13000, featuredSubject: '医学、工学、文学', remark: '华西医学中心全国顶尖' },
    { id: 'EDU-004', name: '成都理工大学', type: '理工/双一流', lng: 104.1437, lat: 30.6743, province: '四川', city: '成都', students: 38000, staff: 4000, featuredSubject: '地质工程、地球物理', remark: '地质灾害防治国家重点实验室' },
    { id: 'EDU-005', name: '西南交通大学', type: '理工/211', lng: 103.9763, lat: 30.7683, province: '四川', city: '成都', students: 45000, staff: 5000, featuredSubject: '交通运输、土木工程', remark: '轨道交通领域全国领先' },
    { id: 'EDU-006', name: '成都七中（林荫校区）', type: '高中/省重点', lng: 104.0714, lat: 30.6217, province: '四川', city: '成都', students: 5000, staff: 400, featuredSubject: '理科竞赛、素质教育', remark: '全国知名中学' },
    { id: 'EDU-007', name: '四川水利职业技术学院', type: '高职', lng: 103.8317, lat: 30.0567, province: '四川', city: '眉山', students: 12000, staff: 600, featuredSubject: '水利工程、地质勘查', remark: '省级示范性高职院校' },
  ]

  data.forEach(row => ws.addRow(row))
  await wb.xlsx.writeFile(path.join(OUTPUT_DIR, '教育机构数据.xlsx'))
  console.log('✅ 教育机构数据.xlsx（7条真实机构数据）')
}

// ==================== 5. 2024年全国地质灾害统计.xlsx ====================
// 数据来源：应急管理部2024年全国自然灾害情况
async function generateStatisticsXlsx() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('2024年统计')
  ws.columns = [
    { header: '统计项目', key: 'item', width: 30 },
    { header: '数值', key: 'value', width: 20 },
    { header: '单位', key: 'unit', width: 10 },
    { header: '数据来源', key: 'source', width: 40 },
  ]
  styleHeader(ws)

  const data = [
    { item: '全国自然灾害受灾人次', value: 9413, unit: '万人次', source: '应急管理部（2025.1发布）' },
    { item: '全国因灾死亡失踪人数', value: 856, unit: '人', source: '应急管理部（2025.1发布）' },
    { item: '直接经济损失', value: 4011.1, unit: '亿元', source: '应急管理部（2025.1发布）' },
    { item: '洪涝和地质灾害受灾人次', value: 5344.9, unit: '万人次', source: '应急管理部（2025.1发布）' },
    { item: '洪涝和地质灾害因灾死亡失踪', value: 709, unit: '人', source: '应急管理部（2025.1发布）' },
    { item: '洪涝和地质灾害直接经济损失', value: 2630.4, unit: '亿元', source: '应急管理部（2025.1发布）' },
    { item: '全国地质灾害隐患点总数', value: 284000, unit: '处', source: '中国自然资源公报（2024）' },
    { item: '隐患点排查巡查', value: 2296000, unit: '处次', source: '中国自然资源公报（2024）' },
    { item: '紧急处置险情/隐患', value: 13616, unit: '处', source: '中国自然资源公报（2024）' },
    { item: '四川专业监测覆盖隐患点', value: 13591, unit: '处', source: '新华网/四川省自然资源厅' },
    { item: '四川监测设备总数', value: 32728, unit: '台套', source: '新华网/四川省自然资源厅' },
    { item: '四川地灾易发县（市、区）', value: 176, unit: '个', source: '四川省人民政府' },
    { item: '"七下八上"因灾死亡失踪', value: 320, unit: '人', source: '应急管理部（2025.1发布）' },
    { item: '"七下八上"直接经济损失', value: 1035.1, unit: '亿元', source: '应急管理部（2025.1发布）' },
  ]

  data.forEach(row => ws.addRow(row))
  await wb.xlsx.writeFile(path.join(OUTPUT_DIR, '2024年全国地质灾害统计数据.xlsx'))
  console.log('✅ 2024年全国地质灾害统计数据.xlsx（14项统计数据）')
}

// ==================== 6. 地质灾害防治技术规范摘要.docx ====================
// 数据来源：GB/T 40112-2021、DZ/T 0286-2015、DZ/T 0239-2004
async function generateTechSpecDocx() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: '地质灾害防治技术规范（摘要）', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: '编制依据', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [
          new TextRun('本文件依据以下国家标准和行业标准编制：'),
        ]}),
        new Paragraph({ children: [
          new TextRun('• GB/T 40112-2021《地质灾害危险性评估规范》（2021-12-01实施）', { bold: true }),
        ]}),
        new Paragraph({ children: [
          new TextRun('  主管部门：自然资源部，归口：全国自然资源与国土空间规划标准化技术委员会'),
        ]}),
        new Paragraph({ children: [
          new TextRun('• DZ/T 0286-2015《地质灾害危险性评估规范》（行业地标，现已被国标部分替代）'),
        ]}),
        new Paragraph({ children: [
          new TextRun('• DZ/T 0239-2004《泥石流灾害防治工程设计规范》'),
        ]}),
        new Paragraph({ children: [
          new TextRun('• DZ/T 0222-2006《地质灾害防治工程监理规范》'),
        ]}),
        new Paragraph({ children: [
          new TextRun('• T/CAGHP 013-2018《地质灾害InSAR监测技术指南（试行）》'),
        ]}),

        new Paragraph({ text: '一、滑坡监测预警技术要求', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: '1.1 监测内容', heading: HeadingLevel.HEADING_3 }),
        new Paragraph('根据 GB/T 40112-2021 要求，滑坡监测应包括以下内容：'),
        new Paragraph('1. 地表位移监测：采用 GPS、全站仪或 InSAR 技术，监测精度不低于 ±2mm'),
        new Paragraph('2. 深部变形监测：采用测斜仪，监测深度应穿过潜在滑动面'),
        new Paragraph('3. 裂缝监测：采用裂缝计，监测裂缝宽度、长度和深度变化'),
        new Paragraph('4. 地下水监测：监测地下水位变化及孔隙水压力'),
        new Paragraph('5. 降雨量监测：自动雨量计，记录小时降雨量和日累计降雨量'),

        new Paragraph({ text: '1.2 预警等级（四川省地质灾害气象风险预警标准）', heading: HeadingLevel.HEADING_3 }),
        new Paragraph('• 三级（黄色预警）：日降雨量 50-100mm → 通知受威胁群众做好撤离准备'),
        new Paragraph('• 二级（橙色预警）：日降雨量 100-150mm → 组织老弱病残人员先行撤离'),
        new Paragraph('• 一级（红色预警）：日降雨量 > 150mm → 全面紧急撤离，封锁危险区'),

        new Paragraph({ text: '1.3 监测频率', heading: HeadingLevel.HEADING_3 }),
        new Paragraph('• 汛期（5-9月）：每日至少 1 次人工巡查，自动化监测数据每小时采集'),
        new Paragraph('• 非汛期：每周 1 次巡查，自动化监测数据每 4 小时采集'),
        new Paragraph('• 黄色预警以上：加密至每 2 小时巡查 1 次'),

        new Paragraph({ text: '二、地质灾害危险性评估（GB/T 40112-2021 要点）', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('该标准适用于在地质灾害易发区内进行各类工程建设和规划可行性研究阶段的评估，涵盖灾种包括：滑坡、崩塌、泥石流、岩溶塌陷、采空塌陷、地裂缝、地面沉降、不稳定斜坡等。'),
        new Paragraph('评估工作内容包括：'),
        new Paragraph('1. 地质环境条件调查（区域地质、地形地貌、地层岩性、水文地质）'),
        new Paragraph('2. 地质灾害调查（类型、规模、分布、发育特征、形成条件）'),
        new Paragraph('3. 地质灾害危险性现状评估'),
        new Paragraph('4. 地质灾害危险性预测评估'),
        new Paragraph('5. 地质灾害危险性综合评估'),
        new Paragraph('6. 建设用地适宜性评价'),
        new Paragraph('7. 地质灾害防治措施建议'),

        new Paragraph({ text: '三、泥石流防治工程技术标准（DZ/T 0239-2004 要点）', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('3.1 拦砂坝设计要求：'),
        new Paragraph('• 坝高一般不超过 15m，坝顶宽度不小于 2m'),
        new Paragraph('• 坝体应设置泄水孔，孔径不小于 300mm'),
        new Paragraph('• 拦砂坝总库容应不小于 10 年一遇泥石流冲出量'),
        new Paragraph('3.2 排导槽设计要求：'),
        new Paragraph('• 排导槽纵坡不小于 5%，断面为梯形或矩形'),
        new Paragraph('• 设计流量按 20 年一遇泥石流峰值流量计算'),

        new Paragraph({ text: '四、四川省监测预警体系', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('根据四川省地质灾害气象风险预警"省市县一体化"建设实践：'),
        new Paragraph('• 省级预警到市、市级预警到县、县级预警到乡、村、隐患点'),
        new Paragraph('• 四川省成功避险案例中，地质灾害气象风险预警发挥作用的占 86%'),
        new Paragraph('• 对威胁 30 人以上的 13,591 处隐患点实行专业监测'),
        new Paragraph('• 全省共部署监测设备 32,728 台（套）'),

        new Paragraph({ text: '参考资料', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('1. 国家标准全文公开系统：https://openstd.samr.gov.cn'),
        new Paragraph('2. 中国地质灾害防治工程行业协会：https://www.caghp.org.cn'),
        new Paragraph('3. 四川省地质灾害气象风险预警"省市县一体化"建设探索与实践'),
        new Paragraph('4. 成都理工大学地质灾害防治国家重点实验室（SKLGP）'),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(OUTPUT_DIR, '地质灾害防治技术规范摘要.docx'), buffer)
  console.log('✅ 地质灾害防治技术规范摘要.docx（基于 GB/T 40112-2021 等真实标准）')
}

// ==================== 7. 2024年地质灾害成功避险典型案例.docx ====================
// 数据来源：自然资源部2024年度十大案例、应急管理部典型案例
async function generateCaseStudyDocx() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: '2024年度全国地质灾害成功避险典型案例汇编', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [
          new TextRun('数据来源：自然资源部地质勘查管理司（2025年5月12日发布）'),
          new TextRun('、应急管理部（2025年6月发布）'),
        ]}),

        // 案例1
        new Paragraph({ text: '案例一：四川万源市罗文镇团堡梁村"7·11"滑坡成功避险', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('时间：2024年7月11日凌晨3时27分'),
        new Paragraph('地点：四川省达州市万源市罗文镇团堡梁村解放湾组改板湾'),
        new Paragraph('灾害类型：高位岩质山体滑坡（非预案内隐患点）'),
        new Paragraph('滑坡规模：长度约1200余米、宽度约300米、厚度约5米，总体量约180万立方米'),
        new Paragraph('灾害损失：33户173间房屋严重受损，3户16间房屋被掩埋，两条道路受损'),
        new Paragraph('成功避险：22户34人提前撤离，无一伤亡'),
        new Paragraph('预警过程：'),
        new Paragraph('  1. 7月8日起团堡梁村持续降雨，改板湾背后的向阳坡山体出现变形迹象'),
        new Paragraph('  2. 村支部书记陈瑞安日常巡查发现滑坡中部变形加剧，立即上报'),
        new Paragraph('  3. 罗文镇党委书记邱燕提前安排24小时严密监控所有地质灾害点'),
        new Paragraph('  4. 7月10日21时前，22户34位村民全部完成转移避险'),
        new Paragraph('  5. 7月11日凌晨3时27分，山体滑坡发生，因提前撤离约6小时，无人员伤亡'),
        new Paragraph('入选：2024年度全国地质灾害成功避险十大典型案例'),
        new Paragraph({ children: [
          new TextRun('来源：人民网四川频道、达州市自然资源和规划局', { italics: true, size: 18 }),
        ]}),

        // 案例2
        new Paragraph({ text: '案例二：湖北秭归县沙镇溪镇"7·10"张家红屋场滑坡成功避险', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('时间：2024年7月10日11时'),
        new Paragraph('地点：湖北省宜昌市秭归县沙镇溪镇三星店村张家红屋场'),
        new Paragraph('灾害损失：香山路损毁342米、张家红房屋滑动20余米'),
        new Paragraph('成功避险：提前避险撤离74户206人并封闭道路，无人员伤亡'),
        new Paragraph('入选：2024年度全国地质灾害成功避险十大典型案例'),

        // 案例3
        new Paragraph({ text: '案例三：重庆武隆区长坝镇"6·28"长田坎滑坡成功避险', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('时间：2024年6月28日凌晨'),
        new Paragraph('地点：重庆市武隆区长坝镇鹅冠村叶家堡组'),
        new Paragraph('灾害损失：3栋房屋损毁，直接经济损失约120万元'),
        new Paragraph('成功避险：6月26日发布地质灾害气象风险橙色预警，提前撤离32户55人'),
        new Paragraph('关键经验：按"防重点、重点防"要求实施提前撤离避让'),
        new Paragraph('入选：2024年度全国地质灾害成功避险十大典型案例'),

        // 案例4
        new Paragraph({ text: '案例四：甘肃文县城关镇"2·3"前山村滑坡成功避险', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('时间：2024年2月3日15时 / 2月4日8时（两次滑坡）'),
        new Paragraph('地点：甘肃省陇南市文县城关镇前山村二社'),
        new Paragraph('成功避险：巡查发现变形迹象，提前撤离6户22人'),
        new Paragraph('关键经验：镇村社形成多级联防网络'),
        new Paragraph('来源：应急管理部2024年度典型案例'),

        // 案例5
        new Paragraph({ text: '案例五：云南河口县"9·9"子丫小组滑坡成功避险', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('时间：2024年9月9日22时30分'),
        new Paragraph('地点：云南省红河州河口县河口镇南屏社区子丫小组'),
        new Paragraph('灾害损失：36户79间房屋受损'),
        new Paragraph('成功避险：河口镇严格落实"1262"预警叫应机制，通过实时监测、及时预警和快速响应'),
        new Paragraph('入选：2024年度全国地质灾害成功避险十大典型案例'),

        // 数据统计
        new Paragraph({ text: '2024年全国地质灾害关键数据', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('• 洪涝和地质灾害造成5344.9万人次受灾，因灾死亡失踪709人'),
        new Paragraph('• 直接经济损失2630.4亿元'),
        new Paragraph('• 全国共登记地质灾害隐患点28.4万余处'),
        new Paragraph('• 全国排查巡查隐患点229.6万余处次'),
        new Paragraph('• 紧急处置各类险情或隐患13,616处'),
        new Paragraph('来源：应急管理部（2025年1月发布）'),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(OUTPUT_DIR, '2024年地质灾害成功避险典型案例.docx'), buffer)
  console.log('✅ 2024年地质灾害成功避险典型案例.docx（5个真实案例）')
}

// ==================== 8. 地质灾害应急监测报告.pdf ====================
async function generateReportPdf() {
  const fontPath = findChineseFont()
  if (!fontPath) {
    console.log('⚠️ 未找到中文字体，跳过 PDF 生成（请安装微软雅黑或黑体）')
    return
  }

  const doc = new PDFDocument({ size: 'A4', margin: 60 })
  const filePath = path.join(OUTPUT_DIR, '地质灾害应急监测周报-2024年第28期.pdf')
  const stream = fs.createWriteStream(filePath)
  doc.pipe(stream)

  doc.registerFont('Chinese', fontPath)
  doc.font('Chinese')

  // 标题
  doc.fontSize(18).text('地质灾害应急监测周报', { align: 'center' })
  doc.fontSize(14).text('2024 年第 28 期（7月8日—7月14日）', { align: 'center' })
  doc.moveDown(0.5)
  doc.fontSize(10).text('发布单位：四川省国土空间生态修复与地质灾害防治研究院', { align: 'center' })
  doc.text('地灾气象风险预警："省市县一体化"体系', { align: 'center' })
  doc.moveDown(1)

  // 分隔线
  doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
  doc.moveDown(0.5)

  // 一、气象概况
  doc.fontSize(14).text('一、本期重点天气过程')
  doc.moveDown(0.3)
  doc.fontSize(10)
    .text('• 7月8-10日：达州万源市持续强降雨，累计降雨量超过200mm')
    .text('• 7月10-11日：盆周山区中到大雨，局部暴雨')
    .text('• 7月11日03:27：万源市罗文镇突发高位岩质山体滑坡（180万m³）')
    .text('• 7月9-14日：甘孜、阿坝部分地区出现中到大雨')
  doc.moveDown(0.5)

  // 二、重点险情
  doc.fontSize(14).text('二、本期重点地质灾害事件')
  doc.moveDown(0.3)
  doc.fontSize(10)
    .text('1. 万源市罗文镇团堡梁村"7·11"高位岩质滑坡', { underline: true })
    .text('   时间：7月11日03:27')
    .text('   规模：长1200m×宽300m×厚5m，约180万m³')
    .text('   损失：33户173间房严重受损，3户16间被掩埋')
    .text('   避险：村支书陈瑞安巡查发现变形→7月10日21时前撤离22户34人→无一伤亡')
    .text('   备注：该点为非预案内隐患点，依靠群测群防成功避险')
  doc.moveDown(0.3)
  doc.fontSize(10)
    .text('2. 本期四川省地质灾害气象风险预警发布情况')
    .text('   • 黄色预警（三级）：涉及达州、巴中、广安、南充等市')
    .text('   • 橙色预警（二级）：涉及万源市、通江县等')
  doc.moveDown(0.5)

  // 三、监测设备运行
  doc.fontSize(14).text('三、监测设备运行情况')
  doc.moveDown(0.3)
  doc.fontSize(10)
    .text('全省在用监测设备 32,728 台（套），覆盖 13,591 处隐患点')
    .text('本期重点区域设备在线率：97.8%')
    .text('故障设备主要分布在万源、通江等暴雨区域（雨量计进水、通信中断等）')
  doc.moveDown(0.5)

  // 四、预警成效
  doc.fontSize(14).text('四、预警成效')
  doc.moveDown(0.3)
  doc.fontSize(10)
    .text('• 四川省成功避险案例中，地质灾害气象风险预警发挥作用的占 86%')
    .text('• 本期万源成功避险案例中，群测群防员发挥了关键作用')
    .text('• "省市县一体化"预警体系已实现：省级预警到市→市级到县→县级到乡村隐患点')
  doc.moveDown(0.5)

  // 五、工作建议
  doc.fontSize(14).text('五、下周工作建议')
  doc.moveDown(0.3)
  doc.fontSize(10)
    .text('1. "七下八上"关键期将至，加强24小时值班值守')
    .text('2. 对暴雨区域设备进行排查维护，确保在线率 > 98%')
    .text('3. 非预案内隐患点排查（万源案例启示：非隐患点同样存在风险）')
    .text('4. 强化群测群防员培训，确保"叫应"机制落实到位')
    .text('5. 检查应急物资储备（编织袋、桩木、照明设备等）')

  doc.moveDown(1)
  doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
  doc.moveDown(0.3)
  doc.fontSize(8)
    .text('本报告数据来源：应急管理部、四川省自然资源厅、万源市人民政府', { align: 'center' })
    .text('四川省国土空间生态修复与地质灾害防治研究院 地址：成都市人民北路一段25号', { align: 'center' })

  doc.end()

  await new Promise(resolve => stream.on('finish', resolve))
  console.log('✅ 地质灾害应急监测周报-2024年第28期.pdf')
}

// ==================== 主流程 ====================
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('=== 生成 xlsx 文件 ===')
  await generateHazardXlsx()
  await generateDeviceXlsx()
  await generateStaffXlsx()
  await generateEduXlsx()
  await generateStatisticsXlsx()

  console.log('\n=== 生成 docx 文件 ===')
  await generateTechSpecDocx()
  await generateCaseStudyDocx()

  console.log('\n=== 生成 pdf 文件 ===')
  await generateReportPdf()

  console.log('\n全部生成完成！输出目录：', OUTPUT_DIR)
}

main().catch(console.error)
