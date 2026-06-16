import dedent from 'dedent';
import opening_outline from '../../../../../坠星大陆/角色卡/世界书/开场白_初至残骸.yaml?raw';
import { is_opening_stat_ready, OPENING_REQUEST_MARKER } from '../../../util/openingStatus';
import { useSideDrawer } from '../composables/useSideDrawer';
import type { CustomStartNotes, CustomStartSelections } from '../constants/customStartOptions';
import { format_numbered_opening_list, upsert_player_opening_entry } from './playerOpeningWorldbook';

export { is_opening_complete, is_opening_stat_ready, OPENING_REQUEST_MARKER } from '../../../util/openingStatus';

const OPENING_MVU_INIT_COMMON = dedent`
  请根据以上信息与现有世界观，生成合理、生动的开局正文（每局细节可略有不同，但须符合大纲硬设定）。
  正文结束后，必须在同条回复末尾输出 MVU 变量更新块，按【开局初始化】与【世界观_开局变量浮动规则】初始化 stat_data。
  正文须包在 <story> 内；变量块在 </story> 之后。
  正文须包在 <story> 内；变量块在 </story> 之后。不要输出 <StatusPlaceHolderImpl/>。
`;

/** 迫降残骸路线：固定四名核心 NPC */
export const OPENING_MVU_INIT_WRECK = dedent`
  ${OPENING_MVU_INIT_COMMON}
  已登场具名兽耳娘须 insert 至【具名NPC】（春/白/林/菊四人缺一不可，技能与【核心具名NPC技能基准】一致），并为每人写入【档位】（按技能最高值：春/熟练、菊/熟练、白/精通、林/入门）、【当前想法】与【对视时】成对变量（禁止「无」或留空）；每名核心成员在 <story> 内首次登场处须插入 <npc_panel>（含 [档位|…] 或由技能自动展示）。
  replace【营地.族人构成】须与【营地.人口】一致（迫降开局参考：黑狼娘1、羊角娘1、猫耳娘12）。
  【当前想法】=「我」视角主线内心；【对视时.心里话】=对 {{user}}「你」视角（可随剧情暂为中性注视反应）。
  核心四人种族：春=黑狼娘(食肉系)、白=羊角娘(食草系)、林=猫耳娘(杂食系)、菊=猫耳娘(食肉系)；白禁止写成兔耳娘。
  探索区域、时间、向心力、威望等可在允许范围内随当局剧情微调。
`;

/** 自定义开局：以玩家开局设定为准，禁止强行写入迫降线四人 */
export const OPENING_MVU_INIT_CUSTOM = dedent`
  ${OPENING_MVU_INIT_COMMON}
  已登场具名兽耳娘须 insert 至【具名NPC】，严格以【玩家开局】与上文编号选项为准；禁止 insert 春/白/林/菊等迫降残骸路线专属角色，除非玩家设定中明确包含该角色。
  【玩家开局】列出的每一名核心成员必须 insert 至 /具名NPC/，并在 <story> 内其首次登场处插入 <npc_panel>。
  为每名实际登场的具名 NPC 写入【技能】、【当前想法】与【对视时】成对变量（禁止「无」或留空）；探索区域、时间、向心力、威望等按玩家所选降生区域与身份在允许范围内微调。
`;

/** @deprecated 请使用 OPENING_MVU_INIT_WRECK 或 OPENING_MVU_INIT_CUSTOM */
export const OPENING_MVU_INIT_INSTRUCTION = OPENING_MVU_INIT_WRECK;

export function format_opening_user_message(outline: string, routeLabel: string): string {
  return dedent`
    ${OPENING_REQUEST_MARKER} ${routeLabel}

    以下为本局开场白大纲，请严格参照世界观与节奏展开，可细化细节但勿违背核心矛盾：

    ${outline.trim()}

    ${OPENING_MVU_INIT_WRECK}
  `;
}

/** 迫降残骸路线：推送开场大纲至 AI 并触发生成与变量初始化 */
export async function generate_wreck_opening(): Promise<void> {
  const { collapse_for_opening_generation } = useSideDrawer();
  collapse_for_opening_generation();
  const message = format_opening_user_message(opening_outline, '迫降残骸路线');
  await createChatMessages([{ role: 'user', message }], { refresh: 'all' });
  await triggerSlash('/trigger await=true');
  console.info('[开局生成] 已推送初至残骸大纲并触发 AI 生成');
}

const OPENING_NPC_POLL_MS = 500;
const OPENING_NPC_TIMEOUT_MS = 120_000;

/** 等待开局 AI 将变量（含具名 NPC）写入最新楼层 stat_data */
export async function wait_for_opening_npcs(timeout_ms = OPENING_NPC_TIMEOUT_MS): Promise<boolean> {
  if (typeof getVariables !== 'function') {
    return true;
  }
  await waitGlobalInitialized('Mvu');
  const deadline = Date.now() + timeout_ms;
  while (Date.now() < deadline) {
    const stat_data = _.get(getVariables({ type: 'message', message_id: 'latest' }), 'stat_data', {}) as Record<
      string,
      unknown
    >;
    if (is_opening_stat_ready(stat_data)) {
      useSideDrawer().unlock_drawer();
      console.info('[开局生成] 开局变量已写入 stat_data');
      return true;
    }
    await new Promise<void>(resolve => {
      setTimeout(resolve, OPENING_NPC_POLL_MS);
    });
  }
  console.warn('[开局生成] 等待开局变量超时');
  return false;
}

export function format_custom_floor_message(
  selections: CustomStartSelections,
  custom_notes: CustomStartNotes,
): string {
  const numbered = format_numbered_opening_list(selections, custom_notes);
  return dedent`
    ${OPENING_REQUEST_MARKER} 自定义开局

    ${numbered}

    ${OPENING_MVU_INIT_CUSTOM}
  `;
}

/** 自定义开局：写入世界书「玩家开局」，推送用户楼层并触发 AI 生成与变量初始化 */
export async function generate_custom_opening(
  selections: CustomStartSelections,
  custom_notes: CustomStartNotes,
): Promise<void> {
  const { collapse_for_opening_generation } = useSideDrawer();
  collapse_for_opening_generation();
  await upsert_player_opening_entry(selections, custom_notes);
  const message = format_custom_floor_message(selections, custom_notes);
  await createChatMessages([{ role: 'user', message }], { refresh: 'all' });
  await triggerSlash('/trigger await=true');
  console.info('[自定义开局] 已推送用户楼层并触发 AI 生成');
}
