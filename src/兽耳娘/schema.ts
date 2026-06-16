const coerce时代 = z
  .union([z.enum(['一', '二', '三']), z.string()])
  .transform((v): '一' | '二' | '三' => {
    if (v === '一' || v === '二' || v === '三') {
      return v;
    }
    const s = String(v);
    if (/三|III|时代三/.test(s)) {
      return '三';
    }
    if (/二|II|时代二/.test(s)) {
      return '二';
    }
    return '一';
  });

const coerce种族系 = z
  .union([z.enum(['食草', '食肉', '杂食', '未知']), z.string()])
  .transform((v): '食草' | '食肉' | '杂食' | '未知' => {
    const s = String(v);
    if (s === '食草' || s === '食肉' || s === '杂食' || s === '未知') {
      return s;
    }
    if (s.includes('食草')) {
      return '食草';
    }
    if (s.includes('食肉')) {
      return '食肉';
    }
    if (s.includes('杂食')) {
      return '杂食';
    }
    return '未知';
  });

const coerce心情 = z
  .union([z.string(), z.coerce.number()])
  .transform((v): string => {
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) {
      return '平静';
    }
    if (n >= 81) {
      return '高涨';
    }
    if (n >= 61) {
      return '愉快';
    }
    if (n >= 41) {
      return '平静';
    }
    if (n >= 21) {
      return '压抑';
    }
    return '低落';
  });

const coerce档位 = z
  .union([z.enum(['初学', '入门', '熟练', '精通']), z.string()])
  .transform((v): '初学' | '入门' | '熟练' | '精通' => {
    if (v === '初学' || v === '入门' || v === '熟练' || v === '精通') {
      return v;
    }
    return '初学';
  });

const coerce飞船能源 = z
  .union([
    z.enum(['低功耗', '警戒', '耗尽', '分区供电', '恢复供电']),
    z.coerce.number(),
    z.string(),
  ])
  .transform((v): '低功耗' | '警戒' | '耗尽' | '分区供电' | '恢复供电' => {
    if (typeof v === 'number') {
      return v <= 0 ? '耗尽' : '低功耗';
    }
    const s = String(v);
    if (s === '低功耗' || s === '警戒' || s === '耗尽' || s === '分区供电' || s === '恢复供电') {
      return s;
    }
    return '低功耗';
  });

const coerce营地防御 = z
  .union([z.enum(['极弱', '初具雏形', '坚不可摧']), z.string()])
  .transform((v): '极弱' | '初具雏形' | '坚不可摧' => {
    if (v === '极弱' || v === '初具雏形' || v === '坚不可摧') {
      return v;
    }
    const s = String(v);
    if (/几无|极弱|脆弱|无防/.test(s)) {
      return '极弱';
    }
    if (/坚不可摧|稳固|坚固/.test(s)) {
      return '坚不可摧';
    }
    return '初具雏形';
  });

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** AI 有时把篝火燃料写成裸数字 0，须转成 { 当前, 上限 } */
const coerce篝火燃料 = z.preprocess((raw: unknown) => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { 当前: raw, 上限: 1000 };
  }
  if (!isPlainObject(raw)) {
    return { 当前: 0, 上限: 1000 };
  }
  const current = Number(raw.当前);
  const max = Number(raw.上限);
  return {
    当前: Number.isFinite(current) ? current : 0,
    上限: Number.isFinite(max) ? max : 1000,
  };
}, z.object({
  当前: z.coerce.number().prefault(0),
  上限: z.coerce.number().prefault(1000),
})).prefault({ 当前: 0, 上限: 1000 });

const explorationAreaSchema = z.object({
  描述: z.preprocess(v => (typeof v === 'string' ? v : ''), z.string()).prefault(''),
  路程: z.preprocess(v => (typeof v === 'string' ? v : '即刻'), z.string()).prefault('即刻'),
  危险度: z.preprocess(v => (typeof v === 'string' ? v : '未知'), z.string()).prefault('未知'),
  已掌握: z.preprocess(v => (typeof v === 'boolean' ? v : v === '是'), z.boolean()).prefault(false),
  探索度: z.coerce
    .number()
    .transform(v => _.clamp(v, 0, 100))
    .prefault(0),
});

const coerce住所等级 = z
  .union([z.enum(['露宿', '简陋窝棚', '稳固聚落', '石砌聚落', '舰城生活区']), z.string()])
  .transform((v): '露宿' | '简陋窝棚' | '稳固聚落' | '石砌聚落' | '舰城生活区' => {
    if (v === '露宿' || v === '简陋窝棚' || v === '稳固聚落' || v === '石砌聚落' || v === '舰城生活区') {
      return v;
    }
    const s = String(v);
    if (/露天|露宿|漏风/.test(s)) {
      return '露宿';
    }
    if (/简陋|窝棚/.test(s)) {
      return '简陋窝棚';
    }
    if (/石砌/.test(s)) {
      return '石砌聚落';
    }
    if (/舰城|生活区/.test(s)) {
      return '舰城生活区';
    }
    if (/稳固|聚落/.test(s)) {
      return '稳固聚落';
    }
    return '露宿';
  });

export const Schema = z.object({
  世界: z
    .object({
      当前时代: coerce时代.prefault('一'),
      当前位置: z.string().prefault('中央大陆'),
      星历: z.string().prefault('2026年9月1日'),
      生存天数: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 99999))
        .prefault(1),
      季节: z.string().prefault('秋季'),
      时间: z.string().prefault('傍晚'),
      飞船能源: coerce飞船能源.prefault('低功耗'),
      当前研发: z.string().prefault('无'),
      研发进度: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 100))
        .prefault(0),
    })
    .prefault({}),

  营地: z
    .object({
      人口: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 9999))
        .prefault(14),
      族人构成: z
        .record(z.string().describe('种族简称'), z.coerce.number())
        .transform(data => _.pickBy(data, count => count > 0))
        .prefault({}),
      生存指标: z
        .object({
          温饱度: z.coerce
            .number()
            .transform(v => _.clamp(v, 0, 100))
            .prefault(15),
          栖居度: z.coerce
            .number()
            .transform(v => _.clamp(v, 0, 100))
            .prefault(10),
          舒适度: z.coerce
            .number()
            .transform(v => _.clamp(v, 0, 100))
            .prefault(0),
        })
        .prefault({}),
      营地状态: z
        .object({
          食物储备: z.enum(['极度匮乏', '勉强果腹', '储备充足']).prefault('极度匮乏'),
          营地防御: coerce营地防御.prefault('极弱'),
          住所等级: coerce住所等级.prefault('露宿'),
        })
        .prefault({}),
      向心力: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 100))
        .prefault(5),
      篝火燃料: coerce篝火燃料,
      防御等级: z.coerce
        .number()
        .transform(v => _.clamp(v, 1, 5))
        .prefault(1),
      防御工事: z
        .object({
          耐久: z.coerce
            .number()
            .transform(v => _.clamp(v, 0, 100))
            .prefault(85),
          阶段描述: z.string().prefault('简易预警：荆棘绊线与破陶片'),
          加固消耗: z
            .object({
              坚固木材: z.coerce.number().prefault(35),
              藤蔓: z.coerce.number().prefault(10),
            })
            .prefault({}),
        })
        .prefault({}),
      仓库等级: z.coerce
        .number()
        .transform(v => _.clamp(v, 1, 5))
        .prefault(1),
      仓库设施: z
        .object({
          阶段描述: z.string().prefault('露天堆叠：资源曝露在外，易受潮损耗'),
          扩建消耗: z
            .object({
              坚固木材: z.coerce.number().prefault(30),
              藤蔓: z.coerce.number().prefault(12),
              石料: z.coerce.number().optional(),
            })
            .prefault({}),
        })
        .prefault({}),
      无名族人基准效率: z.coerce
        .number()
        .transform(v => _.clamp(v, 20, 200))
        .prefault(40),
      工作队列并行上限: z.coerce
        .number()
        .transform(v => _.clamp(v, 1, 20))
        .prefault(3),
      当前建筑: z
        .preprocess((raw: unknown) => {
          if (!raw || typeof raw !== 'object') return raw;
          const buildings = { ...(raw as Record<string, unknown>) };
          if (buildings['熄灭的火堆'] && !buildings['简易火塘']) {
            buildings['简易火塘'] = buildings['熄灭的火堆'];
            delete buildings['熄灭的火堆'];
          }
          return buildings;
        }, z.record(
          z.string().describe('建筑名称'),
          z.object({
            状态: z.string(),
            描述: z.string(),
            功能: z.string().prefault(''),
            建筑阶段: z.enum(['已建成', '蓝图', '建造中', '受损']).prefault('已建成'),
            建筑大小: z.enum(['小型', '中型', '大型']).optional(),
            所需材料: z.record(z.string(), z.coerce.number()).prefault({}),
            所需工时: z.coerce.number().prefault(0),
          }),
        ))
        .prefault({
          简易火塘: {
            状态: '冰冷',
            描述: '只剩下灰烬的火塘，急需重新生火',
            功能: '提供照明与温暖（需重新点燃）',
            建筑阶段: '已建成',
          },
          简易窝棚: {
            状态: '漏风',
            描述: '勉强能挡住大风的粗糙庇护所',
            功能: '提供基础栖居',
            建筑阶段: '受损',
          },
        }),
      物品栏: z
        .record(
          z.string().describe('物品名称'),
          z.object({
            数量: z.coerce.number(),
            描述: z.string(),
          }),
        )
        .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0))
        .prefault({}),
      仓库储备: z
        .record(
          z.string().describe('资源名称'),
          z.object({
            当前: z.coerce.number(),
            上限: z.coerce.number(),
          }),
        )
        .prefault({
          坚固木材: { 当前: 0, 上限: 500 },
          藤蔓: { 当前: 0, 上限: 200 },
          石料: { 当前: 0, 上限: 300 },
          清水: { 当前: 0, 上限: 200 },
          黏土: { 当前: 0, 上限: 250 },
        }),
    })
    .prefault({}),

  已解锁科技: z.array(z.string()).prefault([]),

  部族事务: z
    .record(
      z.string().describe('事务名称'),
      z.object({
        说明: z.string(),
        级别: z.enum(['主要', '次要']).prefault('次要'),
        剩余时间: z.string().prefault(''),
        逃离原因: z.string().prefault(''),
      }),
    )
    .prefault({
      熬过第一个寒夜: {
        说明: '必须尽快生火并分配有限的食物，否则向心力会持续下降。',
        级别: '主要',
      },
      评估残骸价值: {
        说明: '兽耳娘们还不知道这个铁壳子能换来什么，需要首领做出判断。',
        级别: '次要',
      },
    }),

  综合事物: z
    .record(
      z.string().describe('事项名称'),
      z.object({
        说明: z.string().prefault(''),
        状态: z.enum(['进行中', '待定', '已完成']).prefault('进行中'),
        具名参与: z.array(z.string()).prefault([]),
        来源: z.string().prefault(''),
      }),
    )
    .prefault({}),

  探索编队: z.preprocess((raw: unknown) => {
    if (!raw || typeof raw !== 'object') return raw;
    for (const squad of Object.values(raw as Record<string, Record<string, unknown>>)) {
      if (squad?.狩猎背包 && !squad.出行背包) {
        squad.出行背包 = squad.狩猎背包;
        delete squad.狩猎背包;
      }
    }
    return raw;
  }, z.record(
      z.string().describe('编队名称'),
      z.object({
        状态: z.enum(['待命', '探索中', '采集中', '狩猎中']).prefault('待命'),
        具名成员: z.array(z.string()).prefault([]),
        无名队员数: z.coerce.number().prefault(0),
        计划时长: z.coerce
          .number()
          .transform(v => _.clamp(v, 2, 8))
          .prefault(4),
        目标区域: z.string().prefault(''),
        出行背包: z
          .record(z.string(), z.coerce.number())
          .transform(data => _.pickBy(data, qty => qty > 0))
          .prefault({}),
      }),
    ))
    .prefault({}),

  探索区域: z
    .record(z.string().describe('区域名称'), explorationAreaSchema)
    .prefault({
      乱石滩营地: {
        描述: '坠星盆地边缘的流浪猫耳部族临时营地，简易火塘常熄灭，食水紧缺。',
        路程: '即刻',
        危险度: '低',
        已掌握: true,
        探索度: 70,
      },
      飞船残骸周边: {
        描述: '熟悉的营地区域，可采集枯枝与残骸金属碎片。',
        路程: '即刻',
        危险度: '极低',
        已掌握: true,
        探索度: 100,
      },
      中央大陆林缘: {
        描述: '林缘地带，可能找到食草野兽与可食用浆果，偶有狼群出没。',
        路程: '半个日落',
        危险度: '低',
        已掌握: false,
        探索度: 30,
      },
    }),

  大地见闻: z
    .record(
      z.string().describe('见闻标题'),
      z.object({
        内容: z.string(),
        来源: z.string(),
        时间: z.string(),
        已处理: z.boolean().prefault(false),
      }),
    )
    .prefault({}),

  工作队列: z
    .record(
      z.string().describe('工作项名称'),
      z.object({
        类型: z.enum(['研发', '学习', '建造', '生产']),
        进度: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 100))
          .prefault(0),
        状态: z.enum(['待指派', '进行中', '暂停', '已停止', '缺料停工']).prefault('待指派'),
        具名指派: z.array(z.string()).prefault([]),
        协同兽耳娘数: z.coerce.number().prefault(0),
        效率加成: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 80))
          .prefault(0),
        负责人: z.string().prefault(''),
        所需工时: z.coerce.number().prefault(0),
        优先级: z.coerce
          .number()
          .transform(v => _.clamp(v, 1, 9))
          .prefault(5),
      }),
    )
    .prefault({}),

  幼崽: z
    .record(
      z.string().describe('幼崽名字'),
      z.object({
        母亲: z.string().prefault(''),
        种族: z.string().prefault(''),
        年龄: z.coerce.number().prefault(0),
        状态: z.string().prefault('健康'),
        生长状态: z.string().prefault(''),
      }),
    )
    .prefault({}),

  具名NPC: z
    .record(
      z.string().describe('NPC名字'),
      z.object({
        种族: z.string().prefault(''),
        职务: z.string().prefault(''),
        档位: coerce档位.prefault('初学'),
        孕期: z.enum(['未孕', '受孕', '早孕', '安胎', '临盆', '哺乳']).prefault('未孕'),
        受孕日: z.coerce.number().prefault(0),
        忠诚度: z.coerce
          .number()
          .transform(v => _.clamp(v, -100, 100))
          .prefault(0),
        好感度: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 100))
          .prefault(50),
        体力: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 100))
          .prefault(80),
        心情: coerce心情.prefault('平静'),
        状态: z.string().prefault('正常'),
        当前位置: z.string().prefault('营地'),
        当前任务: z.string().prefault('待命'),
        当前想法: z.string().prefault(''),
        饱食度: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 100))
          .prefault(40),
        种族系: coerce种族系.prefault('未知'),
        互动状态: z.string().prefault('无'),
        对视时: z
          .object({
            动作: z.string().prefault(''),
            表情: z.string().prefault(''),
            心里话: z.string().prefault(''),
          })
          .prefault({}),
        技能: z
          .object({
            狩猎: z.coerce
              .number()
              .transform(v => _.clamp(v, 0, 100))
              .prefault(0),
            战斗: z.coerce
              .number()
              .transform(v => _.clamp(v, 0, 100))
              .prefault(0),
            采集: z.coerce
              .number()
              .transform(v => _.clamp(v, 0, 100))
              .prefault(0),
            后勤: z.coerce
              .number()
              .transform(v => _.clamp(v, 0, 100))
              .prefault(0),
          })
          .prefault({}),
      }),
    )
    .prefault({}),

  未收入兽耳娘: z
    .record(
      z.string().describe('NPC名字'),
      z.object({
        种族: z.string().prefault(''),
        档位: coerce档位.prefault('初学'),
        好感度: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 100))
          .prefault(50),
        心情: coerce心情.prefault('平静'),
        状态: z.string().prefault('正常'),
        当前位置: z.string().prefault(''),
        当前想法: z.string().prefault(''),
        技能: z
          .object({
            狩猎: z.coerce
              .number()
              .transform(v => _.clamp(v, 0, 100))
              .prefault(0),
            战斗: z.coerce
              .number()
              .transform(v => _.clamp(v, 0, 100))
              .prefault(0),
            采集: z.coerce
              .number()
              .transform(v => _.clamp(v, 0, 100))
              .prefault(0),
            后勤: z.coerce
              .number()
              .transform(v => _.clamp(v, 0, 100))
              .prefault(0),
          })
          .prefault({}),
      }),
    )
    .prefault({}),

  主角: z
    .object({
      威望称号: z.string().prefault('无耳族废品雄性'),
      威望: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 9999))
        .prefault(0),
      随身装备: z
        .record(
          z.string().describe('装备名称'),
          z.object({
            状态: z.string(),
            电量或弹药: z.string().prefault('无'),
          }),
        )
        .prefault({
          战术终端: { 状态: '受限于太阳能', 电量或弹药: '低' },
          多功能生存服: { 状态: '恒温受损', 电量或弹药: '无' },
          '9毫米半自动手枪': { 状态: '完好', 电量或弹药: '极少' },
          高周波工兵铲: { 状态: '电池耗尽', 电量或弹药: '无' },
        }),
    })
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;
