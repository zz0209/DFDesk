export const currentSeason = {
  id: 'S10',
  name: '裂变',
  startedAt: '2026-06-30',
  verifiedAt: '2026-08-16',
  sourceUrl: 'https://deltaforce.garena.com/zh_tw/news/all/47YK5M',
}

export const passwords = [
  { map: '零号大坝', code: '1357', hint: '行政辖区东侧管道', tone: 'dam' },
  { map: '长弓溪谷', code: '4268', hint: '地图东南地下入口', tone: 'grove' },
  { map: '航天基地', code: '0924', hint: '工业区组装室二层', tone: 'space' },
  { map: '巴克什', code: '7813', hint: '浴场北侧', tone: 'brakkesh' },
  { map: '潮汐监狱', code: '3641', hint: '行政区一层楼梯角', tone: 'prison' },
  { map: 'AZ3', code: '5072', hint: '海水处理区附近建筑', tone: 'az3' },
]

export const marketRows = [
  ['军用频段', 158214, '-6.21%', 'down'],
  ['非制式火控芯片', 612899, '+4.83%', 'up'],
  ['钛合金板材', 243771, '-2.17%', 'down'],
  ['曼德尔超算单元', 1842915, '+7.62%', 'up'],
  ['高纯硅片', 78451, '-0.91%', 'down'],
]

export const builds = [
  { weapon: 'M7 战斗步枪', code: '6H3B-8K2A-L9Q3', role: '中近距离稳枪', author: '战术小熊', cost: 386420, heat: 9200, verified: true, updatedAt: '2026-08-12' },
  { weapon: 'AS Val 突击步枪', code: '2J7M-K4F1-P8D6', role: '消音突袭', author: 'Ghost_117', cost: 298650, heat: 7600, verified: true, updatedAt: '2026-08-09' },
  { weapon: 'PKM 通用机枪', code: '9L2N-R6T5-H3K8', role: '火力压制', author: '钢铁洪流', cost: 442100, heat: 6300, verified: false, updatedAt: '2026-08-06' },
  { weapon: 'SV-98 狙击步枪', code: '5P8Q-W1E7-Z9X2', role: '远距离狙击', author: '夜枭', cost: 517800, heat: 5100, verified: true, updatedAt: '2026-08-03' },
]

export const recipes = [
  { name: '云存储阵列', facility: '技术中心', level: 4, input: 812400, output: 1186000, hours: 8, roi: 38 },
  { name: '精密战术目镜', facility: '工作台', level: 3, input: 162300, output: 248900, hours: 2.5, roi: 31 },
  { name: '高级止血组', facility: '制药台', level: 3, input: 78400, output: 136500, hours: 1.5, roi: 43 },
  { name: 'H70 精英头盔', facility: '防具台', level: 4, input: 494800, output: 716000, hours: 6, roi: 27 },
  { name: '精密护甲维修包', facility: '防具台', level: 2, input: 69100, output: 118400, hours: 1, roi: 46 },
]

export const missions = [
  { id: 1, title: '余烬之下', chapter: '第一章', state: 'done', req: '在零号大坝成功撤离 2 次' },
  { id: 2, title: '危险样本', chapter: '第一章', state: 'done', req: '上交指定任务物品', item: { name: '实验数据', count: 3 } },
  { id: 3, title: '熔毁前夜', chapter: '第二章', state: 'active', req: '前往 AZ3 调查反应堆' },
  { id: 4, title: '封锁线', chapter: '第二章', state: 'locked', req: '携带指定任务物品撤离', item: { name: '军用频段', count: 2 } },
  { id: 5, title: '余波', chapter: '第三章', state: 'locked', req: '完成前置任务「封锁线」' },
]

export const events = [
  { title: '双倍声望周末', type: '进行中', time: '2天 14:32', mode: '烽火地带', status: 'live' },
  { title: '物资补给行动', type: '即将结束', time: '5小时 43分', mode: '全模式', status: 'warn' },
  { title: '战备回收计划', type: '即将开始', time: '8月18日 08:00', mode: '烽火地带', status: 'soon' },
  { title: '第10赛季平衡性调整', type: '官方公告', time: '8月20日', mode: '全模式', status: 'info' },
]
