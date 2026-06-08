export const Schema = z.object({
  世界: z
    .object({
      当前时代: z.enum(['一', '二', '三']).prefault('一'),
      当前位置: z.string().prefault('中央大陆'),
      星历: z.string().prefault('2026年9月1日'),
      季节: z.string().prefault('秋季'),
      时间: z.string().prefault('清晨'),
      飞船能源: z.enum(['低功耗', '警戒', '耗尽', '分区供电', '恢复供电']).prefault('低功耗'),
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
          营地防御: z.enum(['极弱', '初具雏形', '坚不可摧']).prefault('极弱'),
          住所等级: z.enum(['露宿', '简陋窝棚', '稳固聚落', '石砌聚落', '舰城生活区']).prefault('露宿'),
        })
        .prefault({}),
      向心力: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 100))
        .prefault(5),
      篝火燃料: z
        .object({
          当前: z.coerce.number().prefault(0),
          上限: z.coerce.number().prefault(1000),
        })
        .prefault({}),
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
        .record(
          z.string().describe('建筑名称'),
          z.object({
            状态: z.string(),
            描述: z.string(),
            功能: z.string().prefault(''),
            建筑阶段: z.enum(['已建成', '蓝图', '建造中', '受损']).prefault('已建成'),
            所需材料: z.record(z.string(), z.coerce.number()).prefault({}),
            所需工时: z.coerce.number().prefault(0),
          }),
        )
        .prefault({
          熄灭的火堆: {
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

  探索编队: z
    .record(
      z.string().describe('编队名称'),
      z.object({
        状态: z.enum(['待命', '探索中', '采集中']).prefault('待命'),
        具名成员: z.array(z.string()).prefault([]),
        无名队员数: z.coerce.number().prefault(0),
        计划时长: z.coerce
          .number()
          .transform(v => _.clamp(v, 2, 8))
          .prefault(4),
        目标区域: z.string().prefault(''),
      }),
    )
    .prefault({}),

  探索区域: z
    .record(
      z.string().describe('区域名称'),
      z.object({
        描述: z.string(),
        路程: z.string(),
        危险度: z.string().prefault('未知'),
        已掌握: z.boolean().prefault(false),
        探索度: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 100))
          .prefault(0),
      }),
    )
    .prefault({
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
        状态: z.enum(['进行中', '暂停', '已停止', '缺料停工']).prefault('进行中'),
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

  具名NPC: z
    .record(
      z.string().describe('NPC名字'),
      z.object({
        种族: z.string().prefault(''),
        职务: z.string().prefault(''),
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
        心情: z.string().prefault('平静'),
        状态: z.string().prefault('正常'),
        当前位置: z.string().prefault('营地'),
        当前任务: z.string().prefault('待命'),
        当前想法: z.string().prefault('无'),
        饱食度: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 100))
          .prefault(40),
        种族系: z.enum(['食草', '食肉', '杂食', '未知']).prefault('未知'),
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
        好感度: z.coerce
          .number()
          .transform(v => _.clamp(v, 0, 100))
          .prefault(50),
        心情: z.string().prefault('平静'),
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
