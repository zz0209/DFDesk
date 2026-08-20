const allOperationMaps = [
  { id: 'zero-dam', name: '零号大坝', queues: [
    { id: 'easy', label: '常规', difficulty: 'EASY', minGear: 0, availability: '常驻' },
    { id: 'normal', label: '机密', difficulty: 'NORMAL', minGear: 112500, availability: '轮换' },
  ] },
  { id: 'layali', name: '长弓溪谷', queues: [
    { id: 'easy', label: '常规', difficulty: 'EASY', minGear: 0, availability: '常驻' },
    { id: 'normal', label: '机密', difficulty: 'NORMAL', minGear: 112500, availability: '轮换' },
  ] },
  { id: 'brakkesh', name: '巴克什', queues: [
    { id: 'normal', label: '机密', difficulty: 'NORMAL', minGear: 187500, availability: '轮换' },
    { id: 'hard', label: '绝密', difficulty: 'HARD', minGear: 550000, availability: '轮换' },
  ] },
  { id: 'space-city', name: '航天基地', queues: [
    { id: 'normal', label: '机密', difficulty: 'NORMAL', minGear: 187500, availability: '轮换' },
    { id: 'hard', label: '绝密', difficulty: 'HARD', minGear: 600000, availability: '轮换' },
  ] },
  { id: 'tide-prison', name: '潮汐监狱', queues: [
    { id: 'hard', label: '绝密', difficulty: 'HARD', minGear: 780000, availability: '轮换' },
  ] },
  { id: 'az3', name: 'AZ3', queues: [
    { id: 'easy', label: '常规', difficulty: 'EASY', minGear: 0, availability: '常驻' },
    { id: 'normal', label: '机密', difficulty: 'NORMAL', minGear: 112500, availability: '轮换' },
  ] },
]

const serverQueueRules = {
  cn: {
    'zero-dam': ['easy', 'normal'],
    layali: ['easy', 'normal'],
    brakkesh: ['normal', 'hard'],
    'space-city': ['normal', 'hard'],
    'tide-prison': ['hard'],
    az3: ['easy', 'normal'],
  },
  'level-infinite': {
    'zero-dam': ['easy', 'normal'],
    layali: ['easy'],
    brakkesh: ['normal'],
    'space-city': ['normal', 'hard'],
    'tide-prison': ['hard'],
    az3: ['easy', 'normal'],
  },
  garena: {
    'zero-dam': ['easy', 'normal'],
    layali: ['easy', 'normal'],
    brakkesh: ['normal'],
    'space-city': ['normal', 'hard'],
    'tide-prison': ['hard'],
    az3: ['easy', 'normal'],
  },
}

export function getOperationMaps(server = 'level-infinite') {
  const rules = serverQueueRules[server] || serverQueueRules['level-infinite']
  return allOperationMaps.map((map) => ({
    ...map,
    queues: map.queues.filter((queue) => rules[map.id]?.includes(queue.id)),
  })).filter((map) => map.queues.length)
}

export const operationMaps = getOperationMaps()

export const gearCatalog = [
  { id: 'riot-broken', slot: 'helmet', name: '防暴头盔（破损）', cost: 9466, value: 11554, practical: 1 },
  { id: 'das', slot: 'helmet', name: 'DAS 防弹头盔（几乎全新）', cost: 22629, value: 26388, practical: 2 },
  { id: 'h70', slot: 'helmet', name: 'H70 精英头盔', cost: 118000, value: 142000, practical: 5 },
  { id: 'security-broken', slot: 'armor', name: '安保防弹衣（破损）', cost: 1679, value: 1763, practical: 1 },
  { id: 'marksman-armor', slot: 'armor', name: '射手战术护甲（几乎全新）', cost: 35271, value: 39047, practical: 3 },
  { id: 'hpc', slot: 'armor', name: 'HPC-5 重型护甲', cost: 126000, value: 156000, practical: 5 },
  { id: 'titan', slot: 'armor', name: '泰坦防弹衣', cost: 188000, value: 226000, practical: 6 },
  { id: 'assault-rig', slot: 'rig', name: '突击者战术胸挂', cost: 40129, value: 44011, practical: 3 },
  { id: 'd3cr', slot: 'rig', name: 'D3CR 战术胸挂', cost: 62500, value: 76000, practical: 4 },
  { id: 'blackhawk-rig', slot: 'rig', name: '黑鹰大容量胸挂', cost: 89000, value: 108000, practical: 5, large: true },
  { id: 'mountain-pack', slot: 'backpack', name: '大型登山包', cost: 8932, value: 8890, practical: 2 },
  { id: 'lbt-pack', slot: 'backpack', name: 'LBT-1476 中型背包', cost: 42500, value: 54500, practical: 3 },
  { id: 'gt5-pack', slot: 'backpack', name: 'GT5 野战背包', cost: 68000, value: 86000, practical: 5, large: true },
  { id: 'aks74u', slot: 'weapon', name: 'AKS-74U 突击步枪', cost: 12068, value: 12068, practical: 2 },
  { id: 'car15', slot: 'weapon', name: 'CAR-15 突击步枪', cost: 45000, value: 65000, practical: 3 },
  { id: 'm7', slot: 'weapon', name: 'M7 战斗步枪', cost: 62100, value: 115000, practical: 5 },
  { id: 'asval', slot: 'weapon', name: 'AS Val 突击步枪', cost: 85000, value: 145000, practical: 5 },
  { id: 'scar', slot: 'weapon', name: 'SCAR-H 战斗步枪', cost: 126000, value: 185000, practical: 6 },
  { id: 'pkm', slot: 'weapon', name: 'PKM 通用机枪', cost: 145000, value: 205000, practical: 5 },
  { id: 'qcq-exchange', slot: 'weapon', name: 'QCQ171 冲锋枪（兑换）', cost: 55314, value: 118374, practical: 3, exchange: true },
  { id: 'g17', slot: 'pistol', name: 'G17 手枪', cost: 14000, value: 18000, practical: 2 },
  { id: '93r', slot: 'pistol', name: '93R 冲锋手枪', cost: 29000, value: 39000, practical: 3 },
  { id: 'meo-kit', slot: 'attachment', name: 'MEO 瞄具与导轨套件', cost: 28082, value: 33298, practical: 3 },
  { id: 'suppressor-kit', slot: 'attachment', name: '消音改装套件', cost: 51400, value: 67200, practical: 4 },
]

export const slotLabels = { helmet: '头盔', armor: '护甲', rig: '胸挂', backpack: '背包', weapon: '枪械', pistol: '手枪', attachment: '配件' }

const groupOptions = (slot, enabled, catalog) => enabled ? [null, ...catalog.filter((item) => item.slot === slot)] : [null]

function comparePlans(a, b, strategy) {
  if (strategy === 'practical') {
    const aScore = a.cost + a.excess * .04 - a.practical * 7200
    const bScore = b.cost + b.excess * .04 - b.practical * 7200
    return aScore - bScore || a.cost - b.cost
  }
  return a.cost - b.cost || a.excess - b.excess || b.practical - a.practical
}

export function optimizeGear({ deficit, budget, allowedSlots, allowExchange, strategy }) {
  if (deficit <= 0) return { items: [], cost: 0, value: 0, excess: 0, practical: 0 }
  const catalog = gearCatalog.filter((item) => allowExchange || !item.exchange)
  const groups = [
    groupOptions('helmet', allowedSlots.helmet, catalog),
    groupOptions('armor', allowedSlots.armor, catalog),
    groupOptions('rig', allowedSlots.rig, catalog),
    groupOptions('backpack', allowedSlots.backpack, catalog),
    groupOptions('weapon', allowedSlots.weapon, catalog),
    strategy === 'single' ? [null] : groupOptions('weapon', allowedSlots.weapon, catalog),
    groupOptions('pistol', allowedSlots.pistol, catalog),
    groupOptions('attachment', allowedSlots.attachment, catalog),
  ]
  let best = null
  const visit = (index, items, cost, value, practical) => {
    if (budget && cost > budget) return
    if (index === groups.length) {
      const weaponCount = items.filter((item) => item.slot === 'weapon').length
      if (value < deficit || (strategy === 'single' && weaponCount !== 1) || (strategy === 'dual' && weaponCount !== 2)) return
      if (strategy === 'rig' && !items.some((item) => item.slot === 'rig' && item.large)) return
      if (strategy === 'backpack' && !items.some((item) => item.slot === 'backpack' && item.large)) return
      if (new Set(items.map((item) => item.id)).size !== items.length) return
      const candidate = { items, cost, value, practical, excess: value - deficit }
      if (!best || comparePlans(candidate, best, strategy) < 0) best = candidate
      return
    }
    groups[index].forEach((item) => item
      ? visit(index + 1, [...items, item], cost + item.cost, value + item.value, practical + item.practical)
      : visit(index + 1, items, cost, value, practical))
  }
  visit(0, [], 0, 0, 0)
  return best
}
