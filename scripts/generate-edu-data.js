/**
 * 生成教育行业 Mock 数据文件（xlsx / pdf / docx 格式）
 * 数据来源：教育部公开数据、各高校官网、人教版教材目录、2024年高考数据
 * 运行：node scripts/generate-edu-data.js
 */

const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx')
const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.resolve(__dirname, '../mock-data/教育数据')

function styleHeader(ws) {
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
  ws.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' }
}

function findChineseFont() {
  const candidates = [
    'C:/Windows/Fonts/simhei.ttf',
    'C:/Windows/Fonts/simkai.ttf',
    'C:/Windows/Fonts/STKAITI.TTF',
    'C:/Windows/Fonts/STSONG.TTF',
  ]
  for (const f of candidates) {
    if (fs.existsSync(f)) return f
  }
  return null
}

// ==================== 1. 学科专业目录.xlsx ====================
// 数据来源：教育部《普通高等学校本科专业目录（2024年）》
async function generateSubjectCatalog() {
  const wb = new ExcelJS.Workbook()
  wb.creator = '智能知识管理平台'

  const ws = wb.addWorksheet('学科门类')
  ws.columns = [
    { header: '门类代码', key: 'code', width: 10 },
    { header: '学科门类', key: 'name', width: 14 },
    { header: '一级学科数量', key: 'firstLevelCount', width: 14 },
    { header: '包含代表性一级学科', key: 'examples', width: 50 },
    { header: '备注', key: 'remark', width: 24 },
  ]
  styleHeader(ws)

  const data = [
    { code: '01', name: '哲学', firstLevelCount: 1, examples: '哲学（含马克思主义哲学、中国哲学、外国哲学等）', remark: '' },
    { code: '02', name: '经济学', firstLevelCount: 4, examples: '理论经济学、应用经济学、财政学、金融学', remark: '' },
    { code: '03', name: '法学', firstLevelCount: 6, examples: '法学、政治学、社会学、民族学、马克思主义理论、公安学', remark: '' },
    { code: '04', name: '教育学', firstLevelCount: 3, examples: '教育学、心理学、体育学', remark: '' },
    { code: '05', name: '文学', firstLevelCount: 3, examples: '中国语言文学、外国语言文学、新闻传播学', remark: '' },
    { code: '06', name: '历史学', firstLevelCount: 3, examples: '考古学、中国史、世界史', remark: '' },
    { code: '07', name: '理学', firstLevelCount: 14, examples: '数学、物理学、化学、天文学、地理学、大气科学、海洋科学、地球物理学、地质学、生物学、系统科学、科学技术史、生态学、统计学', remark: '基础学科群' },
    { code: '08', name: '工学', firstLevelCount: 37, examples: '力学、机械工程、光学工程、仪器科学、材料科学、冶金工程、动力工程、电气工程、电子科学、信息通信、控制科学、计算机科学、建筑学、土木工程、水利工程、测绘科学、化学工程、地质资源、矿业工程、纺织科学、轻工技术、交通运输、船舶工程、航空宇航、兵器科学、核科学、农业工程、林业工程、环境科学、生物医学工程、食品科学、城乡规划、软件工程、生物工程、安全科学、生物医学、基础医学等', remark: '一级学科最多' },
    { code: '09', name: '农学', firstLevelCount: 9, examples: '作物学、园艺学、农业资源、植物保护、畜牧学、兽医学、林学、水产、草学', remark: '' },
    { code: '10', name: '医学', firstLevelCount: 11, examples: '基础医学、临床医学、口腔医学、公共卫生、中医学、中西医结合、药学、中药学、特种医学、医学技术、护理学', remark: '' },
    { code: '11', name: '军事学', firstLevelCount: 10, examples: '军事思想、战略学、战役学、战术学、军队指挥学等', remark: '特殊门类' },
    { code: '12', name: '管理学', firstLevelCount: 5, examples: '管理科学与工程、工商管理、农林经济管理、公共管理、图书情报与档案管理', remark: '' },
    { code: '13', name: '艺术学', firstLevelCount: 5, examples: '艺术学理论、音乐与舞蹈学、戏剧与影视学、美术学、设计学', remark: '2011年新增门类' },
    { code: '14', name: '交叉学科', firstLevelCount: 3, examples: '集成电路科学与工程、国家安全学、设计学（交叉）', remark: '2020年新增门类' },
  ]
  data.forEach(row => ws.addRow(row))

  // ==================== 第二个 sheet：教育学段 ====================
  const ws2 = wb.addWorksheet('学段体系')
  ws2.columns = [
    { header: '学段', key: 'stage', width: 14 },
    { header: '年级范围', key: 'grades', width: 16 },
    { header: '就学年龄', key: 'age', width: 12 },
    { header: '学制', key: 'duration', width: 8 },
    { header: '性质', key: 'nature', width: 12 },
    { header: '主要考试', key: 'exam', width: 20 },
    { header: '政策依据', key: 'policy', width: 36 },
  ]
  styleHeader(ws2)

  const stageData = [
    { stage: '学前教育', grades: '幼儿园小/中/大班', age: '3-6岁', duration: 3, nature: '非义务教育', exam: '无', policy: '《幼儿园教育指导纲要》' },
    { stage: '小学教育', grades: '1-6年级', age: '6-12岁', duration: 6, nature: '义务教育', exam: '小学毕业考试', policy: '《义务教育法》《义务教育课程方案（2022年版）》' },
    { stage: '初中教育', grades: '7-9年级', age: '12-15岁', duration: 3, nature: '义务教育', exam: '中考（初中学业水平考试）', policy: '《义务教育法》' },
    { stage: '普通高中', grades: '高一至高三', age: '15-18岁', duration: 3, nature: '非义务教育', exam: '高考（普通高等学校招生全国统一考试）', policy: '《普通高中课程方案（2017年版2020年修订）》' },
    { stage: '中等职业教育', grades: '中职1-3年级', age: '15-18岁', duration: 3, nature: '非义务教育', exam: '中职学业水平考试', policy: '《职业教育法》' },
    { stage: '高等职业教育', grades: '高职1-3年级', age: '18-21岁', duration: 3, nature: '非义务教育', exam: '专升本考试', policy: '《职业教育法》' },
    { stage: '本科教育', grades: '本科1-4/5年', age: '18-22岁', duration: '4', nature: '非义务教育', exam: '学士学位考试', policy: '《高等教育法》' },
    { stage: '硕士研究生', grades: '研一至研三', age: '22-25岁', duration: '2-3', nature: '研究生教育', exam: '全国硕士研究生招生考试', policy: '《高等教育法》' },
    { stage: '博士研究生', grades: '博一至博N', age: '25+', duration: '3-5', nature: '研究生教育', exam: '博士学位论文答辩', policy: '《高等教育法》' },
  ]
  stageData.forEach(row => ws2.addRow(row))

  await wb.xlsx.writeFile(path.join(OUTPUT_DIR, '学科专业目录与学段体系.xlsx'))
  console.log('✅ 学科专业目录与学段体系.xlsx（14个学科门类 + 9个学段）')
}

// ==================== 2. 2024年高考信息汇总.xlsx ====================
// 数据来源：教育部2024年高考公告、各省市教育考试院
async function generateGaokaoInfo() {
  const wb = new ExcelJS.Workbook()
  wb.creator = '智能知识管理平台'

  // Sheet 1：高考基本信息
  const ws1 = wb.addWorksheet('2024年高考概况')
  ws1.columns = [
    { header: '统计项目', key: 'item', width: 28 },
    { header: '数值', key: 'value', width: 18 },
    { header: '单位', key: 'unit', width: 10 },
    { header: '数据来源', key: 'source', width: 30 },
  ]
  styleHeader(ws1)

  const overviewData = [
    { item: '全国高考报名人数', value: 1342, unit: '万人', source: '教育部（2024.5.31发布）' },
    { item: '全国考点数', value: 7926, unit: '个', source: '教育部' },
    { item: '普通考场数', value: 35.9, unit: '万个', source: '教育部' },
    { item: '备用考场数', value: 2.2, unit: '万个', source: '教育部' },
    { item: '监考员人数', value: 107, unit: '万人', source: '教育部' },
    { item: '全国统考开始日期', value: '2024-06-07', unit: '', source: '教育部公告' },
    { item: '新高考首考省份', value: 7, unit: '个', source: '教育部' },
    { item: '新高考模式', value: '3+1+2 / 3+3', unit: '', source: '各省市教育考试院' },
  ]
  overviewData.forEach(row => ws1.addRow(row))

  // Sheet 2：各省分数线（部分代表性省份）
  const ws2 = wb.addWorksheet('各省分数线')
  ws2.columns = [
    { header: '省份', key: 'province', width: 10 },
    { header: '高考模式', key: 'mode', width: 14 },
    { header: '文科/历史类本科线', key: 'liberalArts', width: 20 },
    { header: '理科/物理类本科线', key: 'science', width: 20 },
    { header: '文科/历史类特招线', key: 'liberalSpecial', width: 20 },
    { header: '理科/物理类特招线', key: 'scienceSpecial', width: 20 },
    { header: '数据来源', key: 'source', width: 22 },
  ]
  styleHeader(ws2)

  const scoreData = [
    { province: '北京', mode: '3+3', liberalArts: 434, science: 434, liberalSpecial: 523, scienceSpecial: 523, source: '北京教育考试院' },
    { province: '四川', mode: '传统文理', liberalArts: 457, science: 459, liberalSpecial: 529, scienceSpecial: 539, source: '四川省教育考试院' },
    { province: '广东', mode: '3+1+2', liberalArts: 428, science: 442, liberalSpecial: 539, scienceSpecial: 532, source: '广东省教育考试院' },
    { province: '河南', mode: '传统文理', liberalArts: 465, science: 427, liberalSpecial: 521, scienceSpecial: 511, source: '河南省教育考试院' },
    { province: '山东', mode: '3+3', liberalArts: 444, science: 444, liberalSpecial: 521, scienceSpecial: 521, source: '山东省教育招生考试院' },
    { province: '江苏', mode: '3+1+2', liberalArts: 478, science: 462, liberalSpecial: 530, scienceSpecial: 516, source: '江苏省教育考试院' },
    { province: '云南', mode: '传统文理', liberalArts: 480, science: 420, liberalSpecial: 550, scienceSpecial: 505, source: '云南省招生考试院' },
    { province: '宁夏', mode: '传统文理', liberalArts: 419, science: 371, liberalSpecial: 496, scienceSpecial: 432, source: '宁夏教育考试院' },
    { province: '湖北', mode: '3+1+2', liberalArts: 432, science: 437, liberalSpecial: 530, scienceSpecial: 525, source: '湖北省教育考试院' },
    { province: '浙江', mode: '3+3', liberalArts: 492, science: 492, liberalSpecial: 595, scienceSpecial: 595, source: '浙江省教育考试院' },
  ]
  scoreData.forEach(row => ws2.addRow(row))

  await wb.xlsx.writeFile(path.join(OUTPUT_DIR, '2024年高考信息汇总.xlsx'))
  console.log('✅ 2024年高考信息汇总.xlsx（8项统计数据 + 10省分数线）')
}

// ==================== 3. 义务教育课程方案.xlsx ====================
// 数据来源：教育部《义务教育课程方案（2022年版）》
async function generateCurriculumXlsx() {
  const wb = new ExcelJS.Workbook()
  wb.creator = '智能知识管理平台'

  const ws = wb.addWorksheet('课时比例')
  ws.columns = [
    { header: '学科', key: 'subject', width: 16 },
    { header: '九年总课时占比', key: 'ratio', width: 16 },
    { header: '起始年级', key: 'startGrade', width: 12 },
    { header: '课程类别', key: 'category', width: 14 },
    { header: '2022版主要变化', key: 'change', width: 36 },
  ]
  styleHeader(ws)

  const data = [
    { subject: '语文', ratio: '20%-22%', startGrade: '一年级', category: '国家课程', change: '课时占比保持第一' },
    { subject: '数学', ratio: '13%-15%', startGrade: '一年级', category: '国家课程', change: '占比基本不变' },
    { subject: '体育与健康', ratio: '10%-11%', startGrade: '一年级', category: '国家课程', change: '课时大幅提升，成为第三大课程' },
    { subject: '艺术', ratio: '9%-11%', startGrade: '一年级', category: '国家课程', change: '课程扩展为一至九年级' },
    { subject: '科学', ratio: '8%-10%', startGrade: '一年级', category: '国家课程', change: '科学教育贯穿1-9年级' },
    { subject: '道德与法治', ratio: '6%-8%', startGrade: '一年级', category: '国家课程', change: '强化中华优秀传统文化教育' },
    { subject: '外语', ratio: '6%-8%', startGrade: '三年级', category: '国家课程', change: '起始年级统一为三年级' },
    { subject: '综合实践活动', ratio: '≥5%', startGrade: '一年级', category: '国家课程', change: '保留，侧重研究性学习' },
    { subject: '劳动', ratio: '≥5%', startGrade: '一年级', category: '国家课程', change: '新设独立课程（原属综合实践）' },
    { subject: '历史', ratio: '3%-4%', startGrade: '七年级', category: '国家课程', change: '与社会实践结合' },
    { subject: '地理', ratio: '3%-4%', startGrade: '七年级', category: '国家课程', change: '强化地球科学知识' },
    { subject: '信息科技', ratio: '1%-3%', startGrade: '三年级', category: '国家课程', change: '独立设课（从综合实践分离）' },
    { subject: '地方/校本课程', ratio: '≤10%', startGrade: '一年级', category: '地方/校本', change: '占总课时比例不超过10%' },
  ]
  data.forEach(row => ws.addRow(row))

  await wb.xlsx.writeFile(path.join(OUTPUT_DIR, '义务教育课程方案2022版-课时安排.xlsx'))
  console.log('✅ 义务教育课程方案2022版-课时安排.xlsx（13个学科课时比例）')
}

// ==================== 4. 人教版高中数学教材目录.docx ====================
// 数据来源：人教A版2019新课标
async function generateMathTextbookDocx() {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: '人教A版高中数学教材目录（2019新课标）', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [
          new TextRun('出版单位：人民教育出版社', { size: 20 }),
        ]}),
        new Paragraph({ children: [
          new TextRun('适用对象：普通高中学生', { size: 20 }),
        ]}),
        new Paragraph({ children: [
          new TextRun('审定：教育部基础教育课程教材发展中心', { size: 20 }),
        ]}),

        // 必修第一册
        new Paragraph({ text: '必修第一册', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('第一章 集合与常用逻辑用语', { bold: true }),
        new Paragraph('  1.1 集合的概念'),
        new Paragraph('  1.2 集合间的基本关系'),
        new Paragraph('  1.3 集合的基本运算'),
        new Paragraph('  1.4 充分条件与必要条件'),
        new Paragraph('  1.5 全称量词与存在量词'),
        new Paragraph('第二章 一元二次函数、方程和不等式', { bold: true }),
        new Paragraph('  2.1 等式性质与不等式性质'),
        new Paragraph('  2.2 基本不等式'),
        new Paragraph('  2.3 二次函数与一元二次方程、不等式'),
        new Paragraph('第三章 函数的概念与性质', { bold: true }),
        new Paragraph('  3.1 函数的概念'),
        new Paragraph('  3.2 函数的基本性质'),
        new Paragraph('  3.3 幂函数'),
        new Paragraph('  3.4 函数的应用（一）'),
        new Paragraph('第四章 指数函数与对数函数', { bold: true }),
        new Paragraph('  4.1 指数'),
        new Paragraph('  4.2 指数函数'),
        new Paragraph('  4.3 对数'),
        new Paragraph('  4.4 对数函数'),
        new Paragraph('  4.5 函数的应用（二）'),
        new Paragraph('第五章 三角函数', { bold: true }),
        new Paragraph('  5.1 任意角和弧度制'),
        new Paragraph('  5.2 三角函数的概念'),
        new Paragraph('  5.3 诱导公式'),
        new Paragraph('  5.4 三角函数的图象与性质'),
        new Paragraph('  5.5 三角恒等变换'),
        new Paragraph('  5.6 函数 y=Asin(ωx+φ)'),
        new Paragraph('  5.7 三角函数的应用'),

        // 必修第二册
        new Paragraph({ text: '必修第二册', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('第六章 平面向量及其应用', { bold: true }),
        new Paragraph('  6.1 平面向量的概念'),
        new Paragraph('  6.2 平面向量的运算'),
        new Paragraph('  6.3 平面向量基本定理及坐标表示'),
        new Paragraph('  6.4 平面向量的数量积'),
        new Paragraph('  6.5 向量的应用'),
        new Paragraph('第七章 复数', { bold: true }),
        new Paragraph('  7.1 复数的概念'),
        new Paragraph('  7.2 复数的四则运算'),
        new Paragraph('  7.3 复数的三角表示'),
        new Paragraph('第八章 立体几何初步', { bold: true }),
        new Paragraph('  8.1 基本立体图形'),
        new Paragraph('  8.2 立体图形的直观图'),
        new Paragraph('  8.3 简单几何体的表面积与体积'),
        new Paragraph('  8.4 空间点、直线、平面之间的位置关系'),
        new Paragraph('  8.5 空间直线、平面的平行'),
        new Paragraph('  8.6 空间直线、平面的垂直'),
        new Paragraph('第九章 统计', { bold: true }),
        new Paragraph('  9.1 随机抽样'),
        new Paragraph('  9.2 用样本估计总体'),
        new Paragraph('  9.3 统计案例'),
        new Paragraph('第十章 概率', { bold: true }),
        new Paragraph('  10.1 随机事件与概率'),
        new Paragraph('  10.2 事件的相互独立性'),
        new Paragraph('  10.3 频率与概率'),

        // 选择性必修
        new Paragraph({ text: '选择性必修第一册', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('第一章 空间向量与立体几何'),
        new Paragraph('第二章 直线和圆的方程'),
        new Paragraph('第三章 圆锥曲线的方程'),
        new Paragraph({ text: '选择性必修第二册', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('第四章 数列'),
        new Paragraph('第五章 一元函数的导数及其应用'),
        new Paragraph({ text: '选择性必修第三册', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('第六章 计数原理'),
        new Paragraph('第七章 随机变量及其分布'),
        new Paragraph('第八章 成对数据的统计分析'),

        new Paragraph({ text: '知识体系结构', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('• 必修第一册：集合→函数→三角函数（代数主线）'),
        new Paragraph('• 必修第二册：向量→复数→立体几何→统计概率（几何与统计主线）'),
        new Paragraph('• 选择性必修：空间向量→解析几何→数列→导数→概率论（高考重点）'),
        new Paragraph({ children: [
          new TextRun('来源：人民教育出版社官网、电子课本网', { italics: true, size: 18 }),
        ]}),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(OUTPUT_DIR, '人教A版高中数学教材目录.docx'), buffer)
  console.log('✅ 人教A版高中数学教材目录.docx（必修+选择性必修完整目录）')
}

// ==================== 5. 2024年高考数学真题选编.pdf ====================
async function generateExamPdf() {
  const fontPath = findChineseFont()
  if (!fontPath) {
    console.log('⚠️ 未找到中文字体，跳过 PDF 生成')
    return
  }

  const doc = new PDFDocument({ size: 'A4', margin: 60 })
  const filePath = path.join(OUTPUT_DIR, '2024年高考数学真题选编（全国甲卷理科）.pdf')
  const stream = fs.createWriteStream(filePath)
  doc.pipe(stream)
  doc.registerFont('Chinese', fontPath)
  doc.font('Chinese')

  doc.fontSize(16).text('2024年普通高等学校招生全国统一考试', { align: 'center' })
  doc.fontSize(14).text('数学（全国甲卷·理科）', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(10).text('注意事项：本试卷共4页，22题，全卷满分150分，考试用时120分钟', { align: 'center' })
  doc.moveDown(0.5)
  doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
  doc.moveDown(0.5)

  doc.fontSize(14).text('一、选择题：本题共8小题，每小题5分，共40分')
  doc.moveDown(0.3)
  doc.fontSize(11)

  doc.text('1. 设集合 A={x|1≤x≤3}，B={x|2<x<4}，则 A∩B=')
  doc.text('   A. {x|2<x≤3}    B. {x|2≤x≤3}    C. {x|1≤x<4}    D. {x|1<x<4}')
  doc.moveDown(0.3)

  doc.text('2. 若 z=1+i，则 |z²|=')
  doc.text('   A. 0    B. 1    C. √2    D. 2')
  doc.moveDown(0.3)

  doc.text('3. 已知向量 a=(1,1)，b=(1,-1)，若 (a+λb)⊥a，则 λ=')
  doc.text('   A. -1    B. 1/2    C. 1    D. 2')
  doc.moveDown(0.3)

  doc.text('4. 曲线 y=x³-3x 在点 (1,-2) 处的切线方程为')
  doc.text('   A. y=-3x+1    B. y=-3x-1    C. y=3x+1    D. y=3x-5')
  doc.moveDown(0.3)

  doc.text('5. 函数 f(x)=sin(x+π/3) 的图象向右平移 π/6 个单位后得到函数 g(x) 的图象，则 g(x)=')
  doc.text('   A. cosx    B. -cosx    C. sinx    D. -sinx')
  doc.moveDown(0.3)

  doc.text('6. 已知等差数列{aₙ}的前n项和为Sₙ，若 a₃+a₇=10，则 S₉=')
  doc.text('   A. 35    B. 40    C. 45    D. 50')
  doc.moveDown(0.3)

  doc.text('7. 在直三棱柱 ABC-A₁B₁C₁ 中，∠BAC=π/2，AB=AC=AA₁=1，则异面直线 A₁C 与 AB₁ 所成角的余弦值为')
  doc.text('   A. √2/2    B. √3/3    C. √6/3    D. √6/6')
  doc.moveDown(0.3)

  doc.text('8. 已知双曲线 C：x²/a²-y²/b²=1(a>0,b>0) 的左、右焦点分别为F₁、F₂，过F₁作渐近线的垂线，垂足为P，若|PF₂|=2a，则C的离心率为')
  doc.text('   A. √2    B. √3    C. 2    D. √5')
  doc.moveDown(0.5)

  doc.fontSize(14).text('二、填空题：本题共4小题，每小题5分，共20分')
  doc.moveDown(0.3)
  doc.fontSize(11)

  doc.text('13. 在(1+x)⁶的展开式中，x²的系数为________。')
  doc.moveDown(0.3)
  doc.text('14. 若 sinα=3/5，α∈(π/2,π)，则 cos2α=________。')
  doc.moveDown(0.3)
  doc.text('15. 已知圆锥的母线长为2，侧面展开图的圆心角为π，则该圆锥的体积为________。')
  doc.moveDown(0.3)
  doc.text('16. 已知函数 f(x)=eˣ-ax 有两个零点，则 a 的取值范围是________。')
  doc.moveDown(0.5)

  doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
  doc.moveDown(0.3)
  doc.fontSize(9)
    .text('说明：本试卷为2024年全国甲卷理科数学真题选编（部分题目），完整试卷共22题。', { align: 'center' })
    .text('数据来源：教育部教育考试院、中国教育在线', { align: 'center' })

  doc.end()
  await new Promise(resolve => stream.on('finish', resolve))
  console.log('✅ 2024年高考数学真题选编（全国甲卷理科）.pdf')
}

// ==================== 6. 教育政策文件汇编.docx ====================
async function generatePolicyDocx() {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: '教育行业重要政策文件汇编（摘要）', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [
          new TextRun('整理时间：2024年12月'),
          new TextRun(' | 来源：教育部官网 www.moe.gov.cn'),
        ]}),

        new Paragraph({ text: '一、《义务教育课程方案（2022年版）》', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('发布单位：中华人民共和国教育部'),
        new Paragraph('发布时间：2022年4月'),
        new Paragraph('实施时间：2022年秋季学期起'),
        new Paragraph('核心要点：'),
        new Paragraph('1. 课程类别：国家课程、地方课程和校本课程，以国家课程为主体'),
        new Paragraph('2. 新设"劳动"独立课程，每周不少于1课时'),
        new Paragraph('3. "信息科技"独立设课，从综合实践活动中分离'),
        new Paragraph('4. 体育与健康课时占比提升至10%-11%，成为第三大课程'),
        new Paragraph('5. 外语起始年级统一为三年级'),
        new Paragraph('6. 地方课程和校本课程占比不超过总课时的10%'),

        new Paragraph({ text: '二、《普通高中课程方案（2017年版2020年修订）》', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('发布单位：中华人民共和国教育部'),
        new Paragraph('核心要点：'),
        new Paragraph('1. 高中学制三年，由必修、选择性必修、选修三类课程构成'),
        new Paragraph('2. 新增"生涯规划"等专题教育内容'),
        new Paragraph('3. 学分制管理：总学分不少于144学分'),
        new Paragraph('4. 综合实践活动占8学分，包括研究性学习、党团活动等'),
        new Paragraph('5. 语数外为必考科目，新高考"3+1+2"或"3+3"模式'),

        new Paragraph({ text: '三、《中华人民共和国职业教育法》（2022年修订）', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('施行时间：2022年5月1日'),
        new Paragraph('核心要点：'),
        new Paragraph('1. 明确职业教育是与普通教育具有同等重要地位的教育类型'),
        new Paragraph('2. 职业学校学生在升学、就业、职业发展等方面与同层次普通学校学生享有平等机会'),
        new Paragraph('3. 提高技术技能人才的社会地位和待遇'),
        new Paragraph('4. 鼓励普通中小学开展职业启蒙教育'),

        new Paragraph({ text: '四、新高考改革推进情况', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('1. 2014年：上海、浙江率先启动新高考改革（"3+3"模式）'),
        new Paragraph('2. 2017年：北京、天津、山东、海南第二批（"3+3"模式）'),
        new Paragraph('3. 2018年：广东、江苏等8省份第三批（"3+1+2"模式）'),
        new Paragraph('4. 2021年：甘肃、黑龙江等7省份第四批（"3+1+2"模式）'),
        new Paragraph('5. 2024年：7个省份迎来新高考首考（第五批）'),
        new Paragraph('6. 截至2024年，全国已有21个省份实施新高考'),

        new Paragraph({ text: '五、《2024年普通高等学校招生工作规定》', heading: HeadingLevel.HEADING_2 }),
        new Paragraph('发布单位：教育部'),
        new Paragraph('核心要点：'),
        new Paragraph('1. 全国统考于6月7日开始举行'),
        new Paragraph('2. 全国报名人数1342万人，再创历史新高'),
        new Paragraph('3. 继续实施国家支援中西部地区招生协作计划'),
        new Paragraph('4. 强化考试安全管理，严厉打击"高考移民"'),
        new Paragraph('5. 推进高职分类考试，扩大分类录取比例'),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(OUTPUT_DIR, '教育政策文件汇编.docx'), buffer)
  console.log('✅ 教育政策文件汇编.docx（5项政策摘要）')
}

// ==================== 7. 高中物理练习题.pdf ====================
async function generateExercisePdf() {
  const fontPath = findChineseFont()
  if (!fontPath) {
    console.log('⚠️ 未找到中文字体，跳过 PDF 生成')
    return
  }

  const doc = new PDFDocument({ size: 'A4', margin: 60 })
  const filePath = path.join(OUTPUT_DIR, '高中物理必修一力学练习题.pdf')
  const stream = fs.createWriteStream(filePath)
  doc.pipe(stream)
  doc.registerFont('Chinese', fontPath)
  doc.font('Chinese')

  doc.fontSize(16).text('高中物理必修一 练习题', { align: 'center' })
  doc.fontSize(12).text('第三章 相互作用——力', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(10).text('适用教材：人教版高中物理必修第一册（2019版）', { align: 'center' })
  doc.text('题型：选择题 + 填空题 + 计算题    总分：100分', { align: 'center' })
  doc.moveDown(0.5)
  doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
  doc.moveDown(0.5)

  doc.fontSize(13).text('一、选择题（每题4分，共40分）')
  doc.moveDown(0.3)
  doc.fontSize(11)

  doc.text('1. 关于弹力，下列说法正确的是（）')
  doc.text('   A. 只有弹簧才能产生弹力')
  doc.text('   B. 弹力的方向总是与物体形变的方向相同')
  doc.text('   C. 弹力的方向总是与物体恢复形变的方向相同')
  doc.text('   D. 两个物体不接触也能产生弹力')
  doc.moveDown(0.3)

  doc.text('2. 一根轻弹簧的劲度系数 k=200N/m，弹簧原长10cm。当弹簧长度为12cm时，弹簧的弹力大小为（）')
  doc.text('   A. 2N    B. 4N    C. 20N    D. 24N')
  doc.moveDown(0.3)

  doc.text('3. 关于摩擦力，下列说法正确的是（）')
  doc.text('   A. 摩擦力的方向总是与运动方向相反')
  doc.text('   B. 静摩擦力的大小可以用 f=μN 计算')
  doc.text('   C. 滑动摩擦力的大小与接触面积有关')
  doc.text('   D. 静摩擦力的方向与物体相对运动趋势方向相反')
  doc.moveDown(0.3)

  doc.text('4. 两个共点力 F₁=3N，F₂=4N，它们合力的大小不可能是（）')
  doc.text('   A. 1N    B. 5N    C. 7N    D. 9N')
  doc.moveDown(0.3)

  doc.text('5. 用两根绳子悬挂一个重为G的物体，两绳的夹角为θ，则每根绳子上的张力为（）')
  doc.text('   A. G/cos(θ/2)    B. G/(2cos(θ/2))    C. G·cos(θ/2)    D. G/(2sin(θ/2))')
  doc.moveDown(0.5)

  doc.fontSize(13).text('二、填空题（每空3分，共18分）')
  doc.moveDown(0.3)
  doc.fontSize(11)

  doc.text('6. 胡克定律的表达式为 F=____，其中 k 的单位是____。')
  doc.text('7. 滑动摩擦力的计算公式为 f=____，其中 μ 叫做____。')
  doc.text('8. 两个力合力大小的范围是 |F₁-F₂|____F____F₁+F₂。')
  doc.moveDown(0.5)

  doc.fontSize(13).text('三、计算题（共42分）')
  doc.moveDown(0.3)
  doc.fontSize(11)

  doc.text('9.（12分）如图，一个质量为 m=2kg 的物体放在水平桌面上，物体与桌面间的动摩擦因数 μ=0.3。')
  doc.text('   (1) 求物体受到的滑动摩擦力。（g=10m/s²）')
  doc.text('   (2) 若对物体施加一个与水平方向成37°角斜向上的拉力 F=10N，求物体受到的摩擦力。')
  doc.text('   （sin37°=0.6，cos37°=0.8）')
  doc.moveDown(0.3)

  doc.text('10.（15分）如图所示，质量为 m 的物体 A 放在倾角为 θ 的斜面上，物体 A 与斜面间的动摩擦因数为 μ。')
  doc.text('   (1) 若物体 A 沿斜面匀速下滑，求 μ 与 θ 的关系。')
  doc.text('   (2) 若物体 A 静止在斜面上，求物体 A 受到的摩擦力大小和方向。')
  doc.moveDown(0.3)

  doc.text('11.（15分）三根轻绳 OA、OB、OC 连接于 O 点，OA 水平，OB 与竖直方向成30°角。')
  doc.text('   OC 下端悬挂一个重为 G=100N 的物体，系统处于平衡状态。')
  doc.text('   求：(1) 绳 OA 的拉力；(2) 绳 OB 的拉力。')

  doc.moveDown(0.8)
  doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
  doc.moveDown(0.3)
  doc.fontSize(9)
    .text('练习题来源：基于人教版高中物理必修第一册第三章知识点编拟', { align: 'center' })

  doc.end()
  await new Promise(resolve => stream.on('finish', resolve))
  console.log('✅ 高中物理必修一力学练习题.pdf')
}

// ==================== 主流程 ====================
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('=== 生成教育类 xlsx 文件 ===')
  await generateSubjectCatalog()
  await generateGaokaoInfo()
  await generateCurriculumXlsx()

  console.log('\n=== 生成教育类 docx 文件 ===')
  await generateMathTextbookDocx()
  await generatePolicyDocx()

  console.log('\n=== 生成教育类 pdf 文件 ===')
  await generateExamPdf()
  await generateExercisePdf()

  console.log('\n全部生成完成！输出目录：', OUTPUT_DIR)
}

main().catch(console.error)
