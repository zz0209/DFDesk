const categoryMap = {
  weapon: 'weapon',
  helmet: 'helmet',
  armor: 'armor',
  rig: 'rig',
  backpack: 'backpack',
  pistol: 'weapon',
  attachment: 'attachment',
  material: 'material',
  medical: 'medical',
}

export function inferItemCategory(name = '', fallback = 'material') {
  if (/步枪|冲锋枪|机枪|手枪|枪管|武器/.test(name)) return 'weapon'
  if (/头盔/.test(name)) return 'helmet'
  if (/护甲|防弹衣|战术护甲/.test(name)) return 'armor'
  if (/胸挂|战术背心/.test(name)) return 'rig'
  if (/背包|登山包/.test(name)) return 'backpack'
  if (/瞄具|握把|导轨|枪托|消音|配件|目镜/.test(name)) return 'attachment'
  if (/止血|绷带|医疗|制药|维修包/.test(name)) return 'medical'
  return fallback
}

export function ItemThumb({ name, category, image, size = 'normal' }) {
  const kind = categoryMap[category] || inferItemCategory(name, category || 'material')
  return <span className={`item-thumb item-${kind} item-thumb-${size}`} role="img" aria-label={`${name}缩略图`}>
    {image && <img src={image} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} />}
  </span>
}

export function ItemName({ name, category, image, detail }) {
  return <span className="item-name"><ItemThumb name={name} category={category} image={image} /><span><b>{name}</b>{detail && <small>{detail}</small>}</span></span>
}

export function CurrencyAmount({ value, type = 'havoc', signed = false, className = '' }) {
  const number = Number(value || 0)
  const prefix = signed && number > 0 ? '+' : ''
  return <span className={`currency-amount ${className}`}><img src={`/assets/currency-${type}.png`} alt={type === 'triangle' ? '三角币' : '哈夫币'} /><span>{prefix}{number.toLocaleString('zh-CN')}</span></span>
}
